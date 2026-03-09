from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.services.user_service import UserService
from app.api.v1.dependencies import require_role

router = APIRouter(prefix="/admin/users", tags=["admin-users"])


@router.get("/", response_model=list)
def list_users(db: Session = Depends(get_db), _admin=Depends(require_role("admin"))):
    try:
        stmt = select(User)
        users = list(db.scalars(stmt))
    except Exception:
        users = db.query(User).all()
    return [
        {
            "id": u.id,
            "username": u.username,
            "email": u.email,
            "role": u.role,
            "is_active": u.is_active,
            "is_suspended": u.is_suspended,
        }
        for u in users
    ]


@router.delete("/{user_id}")
def delete_user(
    user_id: int, db: Session = Depends(get_db), _admin=Depends(require_role("admin"))
):
    svc = UserService(db)
    user = svc.get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="المستخدم غير موجود")
    if user.role == "admin":
        raise HTTPException(status_code=403, detail="لا يمكن حذف مستخدم أدمن")
    svc.delete(user_id)
    return {"message": "تم حذف المستخدم بنجاح"}


@router.put("/{user_id}/activate")
def activate_user(
    user_id: int, db: Session = Depends(get_db), _admin=Depends(require_role("admin"))
):
    svc = UserService(db)
    user = svc.get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="المستخدم غير موجود")
    user.is_active = True
    db.commit()
    return {"message": "تم تفعيل المستخدم"}


@router.put("/{user_id}/deactivate")
def deactivate_user(
    user_id: int, db: Session = Depends(get_db), _admin=Depends(require_role("admin"))
):
    svc = UserService(db)
    user = svc.get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="المستخدم غير موجود")
    user.is_active = False
    db.commit()
    return {"message": "تم تعطيل المستخدم"}
@router.put("/{user_id}/suspend")
def suspend_user(
    user_id: int, db: Session = Depends(get_db), _admin=Depends(require_role("admin"))
):
    svc = UserService(db)
    user = svc.get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="المستخدم غير موجود")
    user.is_suspended = True
    db.commit()
    return {"message": "تم حظر المستخدم"}


@router.put("/{user_id}/unsuspend")
def unsuspend_user(
    user_id: int, db: Session = Depends(get_db), _admin=Depends(require_role("admin"))
):
    svc = UserService(db)
    user = svc.get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="المستخدم غير موجود")
    user.is_suspended = False
    db.commit()
    return {"message": "تم رفع الحظر عن المستخدم"}
