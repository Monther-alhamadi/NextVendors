from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.api.v1.dependencies import get_current_user
from app.models.user import User
from app.services.notification_service import NotificationService
from app.api.v1.schemas import NotificationResponse

router = APIRouter(prefix="/notifications", tags=["notifications"])

@router.get("/", response_model=List[NotificationResponse])
def get_notifications(
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    svc = NotificationService(db)
    return svc.list_notifications(current_user.id, limit=limit)

@router.get("/unread-count")
def get_unread_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    svc = NotificationService(db)
    return {"count": svc.get_unread_count(current_user.id)}

@router.patch("/{id}/read")
def mark_as_read(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    svc = NotificationService(db)
    success = svc.mark_as_read(id, current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"status": "success"}

@router.post("/mark-all-read")
def mark_all_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    svc = NotificationService(db)
    svc.mark_all_as_read(current_user.id)
    return {"status": "success"}
