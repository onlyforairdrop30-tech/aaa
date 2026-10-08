import os
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta

from database import get_db
from models import User, PasswordReset
from auth_utils import hash_password, generate_otp
from email_utils import send_otp_email

router = APIRouter(prefix="/api", tags=["Password"])


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class VerifyOTPRequest(BaseModel):
    email: EmailStr
    otp_code: str


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    otp_code: str
    new_password: str


@router.post("/forgot-password")
async def forgot_password(request: ForgotPasswordRequest, db: Session = Depends(get_db)):
    clean_email = request.email.strip().lower()
    user = db.query(User).filter(func.lower(User.email) == clean_email).first()
    if not user:
        raise HTTPException(status_code=404, detail="No account found with this email")

    # Invalidate previous unused OTPs
    db.query(PasswordReset).filter(
        PasswordReset.user_id == user.id,
        PasswordReset.is_used == False
    ).update({"is_used": True})

    otp = generate_otp()
    expires_at = datetime.utcnow() + timedelta(minutes=10)

    reset_record = PasswordReset(
        user_id=user.id,
        otp_code=otp,
        expires_at=expires_at,
        is_used=False,
    )
    db.add(reset_record)
    db.commit()

    email_sent = await send_otp_email(to_email=user.email, otp_code=otp, student_name=user.name)

    smtp_user = os.getenv("SMTP_USER", "").strip()
    if smtp_user and email_sent:
        print(f"[OTP] Sent real email with OTP to {user.email}")
        return {
            "message": f"OTP sent to {user.email}. Valid for 10 minutes.",
            "email": user.email,
            "smtp_sent": True
        }
    else:
        print(f"\n==========================================")
        print(f"[OTP] PASSWORD RESET OTP FOR {user.email}: {otp}")
        print(f"==========================================\n")
        return {
            "message": f"OTP generated: {otp}",
            "email": user.email,
            "dev_otp": otp,
            "smtp_sent": False
        }


@router.post("/verify-otp")
def verify_otp(request: VerifyOTPRequest, db: Session = Depends(get_db)):
    clean_email = request.email.strip().lower()
    user = db.query(User).filter(func.lower(User.email) == clean_email).first()
    if not user:
        raise HTTPException(status_code=404, detail="No account found with this email")

    reset_record = (
        db.query(PasswordReset)
        .filter(
            PasswordReset.user_id == user.id,
            PasswordReset.otp_code == request.otp_code.strip(),
            PasswordReset.is_used == False,
            PasswordReset.expires_at > datetime.utcnow(),
        )
        .order_by(PasswordReset.created_at.desc())
        .first()
    )

    if not reset_record:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")

    return {"message": "OTP verified successfully"}


@router.post("/reset-password")
def reset_password(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    if len(request.new_password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")

    clean_email = request.email.strip().lower()
    user = db.query(User).filter(func.lower(User.email) == clean_email).first()
    if not user:
        raise HTTPException(status_code=404, detail="No account found with this email")

    reset_record = (
        db.query(PasswordReset)
        .filter(
            PasswordReset.user_id == user.id,
            PasswordReset.otp_code == request.otp_code.strip(),
            PasswordReset.is_used == False,
            PasswordReset.expires_at > datetime.utcnow(),
        )
        .order_by(PasswordReset.created_at.desc())
        .first()
    )

    if not reset_record:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")

    reset_record.is_used = True
    user.password_hash = hash_password(request.new_password)
    db.commit()

    return {"message": "Password reset successfully. You can now login."}