from enum import Enum
import json
from sqlalchemy import Column, Integer, Float, String, ForeignKey
from sqlalchemy.dialects.postgresql import ENUM as SQLEnum
from sqlalchemy.orm import relationship
from app.models.base import SQLAlchemyBaseModel
from app.core.database import Base

class OrderStatus(str, Enum):
    pending = "pending"
    paid = "paid"
    processing = "processing"
    shipped = "shipped"
    delivered = "delivered"
    completed = "completed"
    refunded = "refunded"
    cancelled = "cancelled"

class Order(SQLAlchemyBaseModel, Base):
    __tablename__ = "orders"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    total_amount = Column(Float, nullable=False, default=0.0)
    tax_total = Column(Float, nullable=False, default=0.0)
    shipping_cost = Column(Float, nullable=False, default=0.0)
    discount_total = Column(Float, nullable=False, default=0.0)
    status = Column(
        SQLEnum(OrderStatus, name="orderstatus", create_type=False), nullable=False, default=OrderStatus.pending
    )
    
    # Affiliate tracking
    affiliate_id = Column(Integer, ForeignKey("affiliates.id"), nullable=True, index=True)
    affiliate_commission = Column(Float, default=0.0)
    
    # Store JSON as a text column but expose a dict property for API/consumers
    _shipping_address = Column("shipping_address", String(1024), nullable=True)
    items = relationship("OrderItem", back_populates="order")
    # Avoid back_populates to prevent import-time mapper ordering issues.
    # Use User.get_orders() runtime query when user orders are needed.
    user = relationship("User")

    def calculate_total(self) -> float:
        items_total = sum((getattr(i, "subtotal", 0.0) for i in (self.items or [])))
        return (
            items_total
            + (getattr(self, "tax_total", 0.0) or 0.0)
            + (getattr(self, "shipping_cost", 0.0) or 0.0)
            - (getattr(self, "discount_total", 0.0) or 0.0)
        )

    def update_status(self, status: OrderStatus) -> None:
        self.status = status

    @property
    def shipping_address(self):
        raw = getattr(self, "_shipping_address", None)
        if raw is None:
            return None
        try:
            return json.loads(raw) if isinstance(raw, str) else raw
        except Exception:
            return raw

    @shipping_address.setter
    def shipping_address(self, value):
        if value is None:
            setattr(self, "_shipping_address", None)
        elif isinstance(value, (dict, list)):
            setattr(self, "_shipping_address", json.dumps(value))
        else:
            # if a string is provided, assume it's already serialized
            setattr(self, "_shipping_address", value)


__all__ = ["Order", "OrderStatus"]
