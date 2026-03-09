from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.models.base import SQLAlchemyBaseModel
from app.core.database import Base

class Advertisement(SQLAlchemyBaseModel, Base):
    __tablename__ = "advertisements"

    id = Column(Integer, primary_key=True, index=True)
    vendor_id = Column(Integer, ForeignKey("suppliers.id"), nullable=True) # If null, it's a global platform ad
    image_url = Column(String(500), nullable=False)
    target_url = Column(String(500), nullable=True)
    placement = Column(String(50), default="homepage_hero") # e.g. homepage_hero, homepage_sidebar
    status = Column(String(50), default="pending") # pending, active, rejected, expired
    
    start_date = Column(DateTime, nullable=True)
    end_date = Column(DateTime, nullable=True)
    
    cost = Column(Float, default=0.0)
    is_paid = Column(Boolean, default=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    vendor = relationship("Supplier", backref="advertisements")

    def __repr__(self):
        return f"<Advertisement {self.id} Status: {self.status}>"
