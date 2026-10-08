from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel

from database import get_db
from models import User, DeviceToken, Admin, SearchLog
from auth_utils import verify_password, create_access_token, get_current_admin

router = APIRouter(prefix="/api/admin", tags=["Admin"])


class AdminLoginRequest(BaseModel):
    username: str
    password: str


class StudentActionRequest(BaseModel):
    user_id: int


@router.post("/login")
def admin_login(request: AdminLoginRequest, db: Session = Depends(get_db)):
    clean_username = request.username.strip().lower()
    clean_password = request.password.strip()

    admin = db.query(Admin).filter(func.lower(Admin.username) == clean_username).first()
    if not admin or not verify_password(clean_password, admin.password_hash):
        raise HTTPException(status_code=401, detail="Invalid admin credentials")

    token = create_access_token({"admin_id": admin.id, "role": "admin"})
    return {"access_token": token, "token_type": "bearer"}


@router.get("/pending-students")
def get_pending_students(
    admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    pending = db.query(User).filter(User.status == "pending").order_by(User.created_at.desc()).all()
    return {
        "students": [
            {
                "id": u.id,
                "student_id": u.student_id,
                "name": u.name,
                "email": u.email,
                "college_enroll_id": u.college_enroll_id,
                "created_at": u.created_at.isoformat() if u.created_at else "",
            }
            for u in pending
        ]
    }


@router.post("/approve-student")
async def approve_student(
    request: StudentActionRequest,
    admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == request.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Student not found")

    user.status = "approved"
    user.is_active = True
    db.commit()

    try:
        from email_utils import send_status_email
        await send_status_email(user.email, user.name, "approved")
    except Exception as e:
        print(f"[!] Status email error: {e}")

    return {"message": f"Student {user.name} approved successfully"}


@router.post("/reject-student")
async def reject_student(
    request: StudentActionRequest,
    admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == request.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Student not found")

    user.status = "rejected"
    user.is_active = False
    # Immediately invalidate active device sessions
    db.query(DeviceToken).filter(DeviceToken.user_id == user.id).delete()
    db.commit()

    try:
        from email_utils import send_status_email
        await send_status_email(user.email, user.name, "rejected")
    except Exception as e:
        print(f"[!] Status email error: {e}")

    return {"message": f"Student {user.name} rejected/revoked"}


@router.post("/revoke-access")
def revoke_access(
    request: StudentActionRequest,
    admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == request.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Student not found")

    user.status = "rejected"
    user.is_active = False
    # Immediately invalidate device session so they are logged out
    db.query(DeviceToken).filter(DeviceToken.user_id == user.id).delete()
    db.commit()

    return {"message": f"Access revoked for {user.name}. Student cannot login or search."}


@router.post("/restore-access")
def restore_access(
    request: StudentActionRequest,
    admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == request.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Student not found")

    user.status = "approved"
    user.is_active = True
    db.commit()

    return {"message": f"Access restored for {user.name}."}


def _perform_delete_student(user_id: int, db: Session):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Student not found")

    student_name = user.name
    db.delete(user)
    db.commit()

    return {"message": f"Student {student_name} permanently removed from database"}


@router.delete("/delete-student")
def delete_student_delete(
    request: StudentActionRequest,
    admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    return _perform_delete_student(request.user_id, db)


@router.post("/delete-student")
def delete_student_post(
    request: StudentActionRequest,
    admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    return _perform_delete_student(request.user_id, db)


@router.get("/students")
def get_all_students(
    admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    students = db.query(User).order_by(User.created_at.desc()).all()
    result = []
    for s in students:
        device = db.query(DeviceToken).filter(DeviceToken.user_id == s.id).first()
        result.append({
            "id": s.id,
            "student_id": s.student_id,
            "name": s.name,
            "email": s.email,
            "college_enroll_id": s.college_enroll_id,
            "status": s.status,
            "is_active": s.is_active,
            "has_device": device is not None,
            "created_at": s.created_at.isoformat() if s.created_at else "",
        })
    return {"students": result}


def _perform_reset_device(user_id: int, db: Session):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Student not found")

    deleted = db.query(DeviceToken).filter(DeviceToken.user_id == user.id).delete()
    db.commit()

    if deleted:
        return {"message": f"Device token reset for {user.name}"}
    return {"message": f"No device token found for {user.name}"}


@router.delete("/reset-device")
def reset_device_delete(
    request: StudentActionRequest,
    admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    return _perform_reset_device(request.user_id, db)


@router.post("/reset-device")
def reset_device_post(
    request: StudentActionRequest,
    admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    return _perform_reset_device(request.user_id, db)


@router.get("/search-logs")
def get_search_logs(
    admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    logs = (
        db.query(SearchLog)
        .join(User)
        .order_by(SearchLog.searched_at.desc())
        .limit(100)
        .all()
    )
    return {
        "logs": [
            {
                "id": log.id,
                "student_id": log.user.student_id if log.user else "N/A",
                "student_name": log.user.name if log.user else "Unknown",
                "query": log.query,
                "results_count": log.results_count,
                "searched_at": log.searched_at.isoformat() if log.searched_at else "",
            }
            for log in logs
        ]
    }


@router.get("/stats")
def get_stats(
    admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    total = db.query(User).count()
    pending = db.query(User).filter(User.status == "pending").count()
    approved = db.query(User).filter(User.status == "approved").count()
    rejected = db.query(User).filter(User.status == "rejected").count()
    total_searches = db.query(SearchLog).count()

    return {
        "total_students": total,
        "pending": pending,
        "approved": approved,
        "rejected": rejected,
        "total_searches": total_searches,
    }