from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import SQLAlchemyBaseModel
from app.core.database import Base


class RefreshTokenAudit(SQLAlchemyBaseModel, Base):
    __tablename__ = "refresh_token_audit"

    user_id: int = Column(Integer, ForeignKey("users.id"), nullable=False)
    token_id: int = Column(Integer, nullable=True)
    event_type: str = Column(String(128), nullable=False)
    detail: str = Column(String(1024), nullable=True)

    user = relationship("User")
