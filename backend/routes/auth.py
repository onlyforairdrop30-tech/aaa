from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime

from database import get_db
from models import User, DeviceToken
from auth_utils import (
    verify_password, create_access_token, get_current_user, hash_password
)

router = APIRouter(prefix="/api", tags=["Auth"])


class LoginRequest(BaseModel):
    student_id: str
    password: str
    device_fingerprint: str


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


@router.post("/login")
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.student_id == request.student_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid Student ID or Password")

    if not verify_password(request.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid Student ID or Password")

    if user.status == "pending":
        raise HTTPException(status_code=403, detail="Your registration is pending admin approval.")
    if user.status == "rejected":
        raise HTTPException(status_code=403, detail="Your registration has been rejected.")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Your account has been disabled.")

    existing_token = db.query(DeviceToken).filter(DeviceToken.user_id == user.id).first()

    if existing_token:
        if existing_token.fingerprint != request.device_fingerprint:
            raise HTTPException(status_code=403, detail="This account is locked to another device. Contact admin.")
        existing_token.last_used = datetime.utcnow()
    else:
        new_token = DeviceToken(
            user_id=user.id,
            fingerprint=request.device_fingerprint,
            token=create_access_token({"user_id": user.id, "type": "device"}),
            last_used=datetime.utcnow()
        )
        db.add(new_token)

    db.commit()

    access_token = create_access_token({"user_id": user.id, "student_id": user.student_id})

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "name": user.name,
            "student_id": user.student_id,
            "email": user.email,
        }
    }


@router.post("/logout")
def logout(current_user: User = Depends(get_current_user)):
    return {"message": "Logged out successfully"}


@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "name": current_user.name,
        "student_id": current_user.student_id,
        "email": current_user.email,
        "college_enroll_id": current_user.college_enroll_id,
        "status": current_user.status,
    }


@router.post("/change-password")
def change_password(
    request: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not verify_password(request.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    if len(request.new_password) < 8:
        raise HTTPException(status_code=400, detail="New password must be at least 8 characters")

    current_user.password_hash = hash_password(request.new_password)
    db.commit()

    return {"message": "Password changed successfully"}