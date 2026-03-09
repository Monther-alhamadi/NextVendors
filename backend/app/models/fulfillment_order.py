from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Enum, Float
from sqlalchemy.orm import relationship
from datetime import datetime
from app.models.base import SQLAlchemyBaseModel
from app.core.database import Base
import enum

class FulfillmentStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"

class FulfillmentOrder(SQLAlchemyBaseModel, Base):
    __tablename__ = "fulfillment_orders"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False, index=True)
    vendor_id = Column(Integer, ForeignKey("suppliers.id"), nullable=False, index=True)
    status = Column(String(50), default="pending", nullable=False) # Store enum as string for simplicity
    tracking_number = Column(String(100), nullable=True)
    
    # Financial tracking for local release
    total_vendor_share = Column(Float, default=0.0)
    total_shipping_cost = Column(Float, default=0.0)
    total_affiliate_commission = Column(Float, default=0.0)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    items = relationship("OrderItem", back_populates="fulfillment_order")
    vendor = relationship("Supplier", backref="fulfillment_orders")
    order = relationship("Order", backref="fulfillment_orders")

    def __repr__(self):
        return f"<FulfillmentOrder {self.id} Order-{self.order_id} Vendor-{self.vendor_id}>"
