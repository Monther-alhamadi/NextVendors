from typing import List, Optional
from sqlalchemy import select, desc
from sqlalchemy.orm import Session
from datetime import datetime
from app.models.notification import Notification

class NotificationService:
    def __init__(self, db: Session):
        self.db = db

    def list_notifications(self, user_id: int, limit: int = 20) -> List[Notification]:
        """List notifications for a user, most recent first."""
        stmt = select(Notification).where(
            Notification.user_id == user_id
        ).order_by(desc(Notification.created_at)).limit(limit)
        
        return list(self.db.execute(stmt).scalars().all())

    def get_unread_count(self, user_id: int) -> int:
        """Count unread notifications for a user."""
        stmt = select(Notification).where(
            Notification.user_id == user_id,
            Notification.is_read == False
        )
        return len(self.db.execute(stmt).scalars().all())

    def create_notification(self, user_id: int, title: str, content: str, type: str = "info", link: Optional[str] = None) -> Notification:
        """Create a new system notification."""
        notif = Notification(
            user_id=user_id,
            title=title,
            content=content,
            type=type,
            link=link
        )
        self.db.add(notif)
        self.db.commit()
        self.db.refresh(notif)
        return notif

    def mark_as_read(self, notification_id: int, user_id: int) -> bool:
        """Mark a specific notification as read."""
        notif = self.db.get(Notification, notification_id)
        if notif and notif.user_id == user_id:
            notif.is_read = True
            self.db.commit()
            return True
        return False

    def mark_all_as_read(self, user_id: int):
        """Mark all notifications for a user as read."""
        stmt = select(Notification).where(
            Notification.user_id == user_id,
            Notification.is_read == False
        )
        unread = self.db.execute(stmt).scalars().all()
        for n in unread:
            n.is_read = True
        self.db.commit()
