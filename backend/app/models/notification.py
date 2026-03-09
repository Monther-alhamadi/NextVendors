from sqlalchemy import Column, Integer, String, Text, ForeignKey, Boolean, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.models.base import SQLAlchemyBaseModel
from app.core.database import Base

__all__ = ["Notification"]

class Notification(SQLAlchemyBaseModel, Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    # type can be 'info', 'success', 'warning', 'order', 'promo'
    type = Column(String(50), default="info")
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # link is optional to redirect user when they click the notification
    link = Column(String(255), nullable=True)

    user = relationship("User", backref="notifications")
