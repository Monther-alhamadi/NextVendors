from sqlalchemy import Column, Integer, ForeignKey
from sqlalchemy import JSON as SA_JSON
from app.models.base import SQLAlchemyBaseModel
from app.core.database import Base


class Cart(SQLAlchemyBaseModel, Base):
    __tablename__ = "carts"

    user_id = Column(
        Integer, ForeignKey("users.id"), nullable=False, unique=True, index=True
    )
    # JSON column: SQLAlchemy will map appropriately for sqlite or postgres
    items = Column(SA_JSON, nullable=False, default=list)
