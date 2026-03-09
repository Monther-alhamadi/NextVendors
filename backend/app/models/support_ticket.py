from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.models.base import SQLAlchemyBaseModel
from app.core.database import Base

class TicketStatus(str, enum.Enum):
    open = "open"
    pending = "pending"
    closed = "closed"

class TicketPriority(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"

class SupportTicket(SQLAlchemyBaseModel, Base):
    __tablename__ = "support_tickets"
    __table_args__ = {'extend_existing': True}

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    subject = Column(String(255), nullable=False)
    status = Column(SQLEnum(TicketStatus), default=TicketStatus.open)
    priority = Column(SQLEnum(TicketPriority), default=TicketPriority.medium)
    category = Column(String(100), nullable=True) # e.g. "Order Issue", "Technical", "Billing"
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=True, index=True)
    
    messages = relationship("SupportMessage", back_populates="ticket", cascade="all, delete-orphan")
    user = relationship("User", backref="support_tickets")
    order = relationship("Order")

class SupportMessage(SQLAlchemyBaseModel, Base):
    __tablename__ = "support_messages"
    __table_args__ = {'extend_existing': True}

    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("support_tickets.id"), nullable=False, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    is_internal = Column(Integer, default=0) # 0: normal, 1: admin-only note

    ticket = relationship("SupportTicket", back_populates="messages")
    sender = relationship("User")
