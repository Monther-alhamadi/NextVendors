from sqlalchemy import Column, Integer, Float, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.models.base import SQLAlchemyBaseModel
from app.core.database import Base

class VendorLedger(SQLAlchemyBaseModel, Base):
    __tablename__ = "vendor_ledger"

    id = Column(Integer, primary_key=True, index=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=False, index=True)
    amount = Column(Float, nullable=False) # Positive for Credit (Owe supplier), Negative for Debit (Paid supplier)
    transaction_type = Column(String(50), nullable=False) # "SALE", "PAYOUT", "REFUND"
    reference_id = Column(String(100), nullable=True) # Order ID or Payout Reference
    description = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    supplier = relationship("Supplier", backref="ledger_entries")

    def __repr__(self):
        return f"<VendorLedger {self.id} {self.transaction_type} {self.amount}>"
