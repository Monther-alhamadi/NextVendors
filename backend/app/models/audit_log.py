from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class SystemAuditLog(Base):
    __tablename__ = "system_audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    action = Column(String(100), nullable=False) # e.g., "UPDATE_STATUS", "PAYOUT_RECORDED"
    target_type = Column(String(50), nullable=True) # e.g., "order", "vendor", "user"
    target_id = Column(String(100), nullable=True)
    
    details = Column(Text, nullable=True) # Descriptive text
    
    # Data Changes
    previous_value = Column(JSON, nullable=True)
    new_value = Column(JSON, nullable=True)
    
    ip_address = Column(String(45), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")

__all__ = ["SystemAuditLog"]
