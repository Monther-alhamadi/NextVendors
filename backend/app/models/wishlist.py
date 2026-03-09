from sqlalchemy import Column, Integer, ForeignKey
from sqlalchemy import JSON as SA_JSON
from app.models.base import SQLAlchemyBaseModel
from app.core.database import Base


class Wishlist(SQLAlchemyBaseModel, Base):
    __tablename__ = "wishlists"

    user_id = Column(
        Integer, ForeignKey("users.id"), nullable=False, unique=True, index=True
    )
    items = Column(SA_JSON, nullable=False, default=list)
