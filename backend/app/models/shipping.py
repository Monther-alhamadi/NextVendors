from sqlalchemy import Column, Integer, String, JSON, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import SQLAlchemyBaseModel
from app.core.database import Base


class Shipping(SQLAlchemyBaseModel, Base):
    __tablename__ = "shippings"

    order_id = Column(Integer, ForeignKey("orders.id"))
    address = Column(JSON)
    method = Column(String(64), default="standard")
    tracking_number = Column(String(128), default="")

    order = relationship("Order")
