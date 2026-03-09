from sqlalchemy import Column, Integer, String, ForeignKey, Float, DateTime, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
from app.models.base import SQLAlchemyBaseModel
from app.core.database import Base
import enum

class ReturnReason(str, enum.Enum):
    DAMAGED = "damaged"
    CHANGED_MIND = "changed_mind"
    WRONG_ITEM = "wrong_item"
    OTHER = "other"

class ReturnStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    COMPLETED = "completed"

class ReturnRequest(SQLAlchemyBaseModel, Base):
    __tablename__ = "return_requests"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False, index=True)
    order_item_id = Column(Integer, ForeignKey("order_items.id"), nullable=False)
    
    reason = Column(String(50), nullable=False) # Store enum as string
    status = Column(String(50), default="pending", nullable=False)
    
    refund_amount = Column(Float, default=0.0)
    admin_notes = Column(String(500), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    # Relationships
    user = relationship("User", back_populates="return_requests")
    order = relationship("Order", backref="return_requests")
    order_item = relationship("OrderItem", backref="return_request")

    def __repr__(self):
        return f"<ReturnRequest {self.id} Item-{self.order_item_id} {self.status}>"
