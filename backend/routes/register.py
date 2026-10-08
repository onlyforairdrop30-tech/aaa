from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr

from database import get_db
from models import User
from auth_utils import hash_password

router = APIRouter(prefix="/api", tags=["Registration"])


class RegisterRequest(BaseModel):
    name: str
    student_id: str
    email: EmailStr
    password: str
    college_enroll_id: str


@router.post("/register")
def register(request: RegisterRequest, db: Session = Depends(get_db)):
    if len(request.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")

    existing_id = db.query(User).filter(User.student_id == request.student_id).first()
    if existing_id:
        raise HTTPException(status_code=400, detail="Student ID already registered")

    existing_email = db.query(User).filter(User.email == request.email).first()
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = User(
        student_id=request.student_id,
        name=request.name,
        email=request.email,
        password_hash=hash_password(request.password),
        college_enroll_id=request.college_enroll_id,
        status="pending",
        is_active=True,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "message": "Registration successful! Pending admin approval.",
        "status": "pending"
    }