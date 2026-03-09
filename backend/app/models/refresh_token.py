from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.models.base import SQLAlchemyBaseModel
from app.core.database import Base


class RefreshToken(SQLAlchemyBaseModel, Base):
    __tablename__ = "refresh_tokens"

    token: str = Column(String(512), unique=True, nullable=False, index=True)
    user_id: int = Column(Integer, ForeignKey("users.id"), nullable=False)
    revoked: bool = Column(Boolean, default=False)
    # if token was rotated, this points to the replacement token id
    replaced_by_id: int = Column(
        Integer, ForeignKey("refresh_tokens.id"), nullable=True
    )
    expires_at: datetime = Column(DateTime(timezone=True), nullable=False)

    # Keep relationship simple to avoid tight bi-directional mapper
    # initialization ordering issues during import-time model registration.
    user = relationship("User")
    # replaced_by relationship is not needed for now — use replaced_by_id to detect reuse
