from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.models.base import SQLAlchemyBaseModel
from app.core.database import Base

class KYCStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"

class KYCDocument(SQLAlchemyBaseModel, Base):
    __tablename__ = "kyc_documents"

    id = Column(Integer, primary_key=True, index=True)
    vendor_id = Column(Integer, ForeignKey("suppliers.id"), nullable=False)
    
    document_type = Column(String(50), nullable=False) # ID, Business_License, Tax_Cert
    file_url = Column(String(512), nullable=False)
    
    status = Column(String(20), default=KYCStatus.PENDING)
    rejection_reason = Column(String(512), nullable=True)
    
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    reviewed_at = Column(DateTime, nullable=True)
    reviewed_by = Column(Integer, ForeignKey("users.id"), nullable=True)

    vendor = relationship("Supplier", back_populates="kyc_documents")
