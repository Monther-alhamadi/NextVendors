from sqlalchemy import Column, Integer, String, Boolean, DateTime
from datetime import datetime
from app.models.base import SQLAlchemyBaseModel
from app.core.database import Base

class Banner(SQLAlchemyBaseModel, Base):
    __tablename__ = "banners"

    id: int = Column(Integer, primary_key=True, index=True)
    title: str = Column(String(255), nullable=True)
    subtitle: str = Column(String(512), nullable=True)
    image_url: str = Column(String(1024), nullable=False)
    link_url: str = Column(String(1024), nullable=True)
    position: int = Column(Integer, default=0)
    is_active: bool = Column(Boolean, default=True)
    created_at: datetime = Column(DateTime, default=datetime.utcnow)

__all__ = ["Banner"]
