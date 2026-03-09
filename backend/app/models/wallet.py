from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Enum, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.models.base import SQLAlchemyBaseModel
from app.core.database import Base

class TransactionType(str, enum.Enum):
    CREDIT = "credit" # Incoming
    DEBIT = "debit"   # Outgoing

class UserWallet(SQLAlchemyBaseModel, Base):
    __tablename__ = "user_wallets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    
    currency = Column(String(3), default="USD")
    balance = Column(Float, default=0.00)
    pending_balance = Column(Float, default=0.00) # Funds in escrow
    loyalty_points = Column(Integer, default=0)
    
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="wallet")
    transactions = relationship("WalletTransaction", back_populates="wallet", cascade="all, delete-orphan", order_by="desc(WalletTransaction.created_at)")

class WalletTransaction(SQLAlchemyBaseModel, Base):
    __tablename__ = "wallet_transactions"

    id = Column(Integer, primary_key=True, index=True)
    wallet_id = Column(Integer, ForeignKey("user_wallets.id"), nullable=False, index=True)
    
    amount = Column(Float, nullable=False) # Positive value
    transaction_type = Column(String(20), nullable=False) # credit or debit
    
    reference_id = Column(String(100), nullable=True) # e.g. Order ID, Refund ID
    reference_type = Column(String(50), nullable=True) # order, refund, bonus
    description = Column(String(255), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    wallet = relationship("UserWallet", back_populates="transactions")

class PayoutStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    REJECTED = "rejected"

class PayoutRequest(SQLAlchemyBaseModel, Base):
    __tablename__ = "payout_requests"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    amount = Column(Float, nullable=False)
    status = Column(String(20), default="pending") # PayoutStatus
    method = Column(String(50), nullable=False) # paypal, bank, etc
    details = Column(JSON, nullable=True) # Bank details or account info
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", backref="payout_requests")
