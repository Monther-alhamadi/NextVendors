from sqlalchemy import Column, Integer, String, Float, Boolean
from sqlalchemy.orm import relationship
from app.models.base import SQLAlchemyBaseModel
from app.core.database import Base

class VendorPlan(SQLAlchemyBaseModel, Base):
    __tablename__ = "vendor_plans"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True) # e.g. "Basic", "Pro", "Enterprise"
    description = Column(String(500), nullable=True)
    
    # Pricing
    monthly_price = Column(Float, default=0.0)
    yearly_price = Column(Float, default=0.0)
    
    # Limits & Features
    max_products = Column(Integer, default=50)
    commission_rate = Column(Float, default=0.10) # Platform fee per sale
    
    # Capabilities
    can_customize_store = Column(Boolean, default=False)
    can_access_advanced_analytics = Column(Boolean, default=False)
    can_use_priority_support = Column(Boolean, default=False)
    auto_approve_products = Column(Boolean, default=False) # Skip moderation
    max_coupons = Column(Integer, default=0) # 0 means none allowed on free plans
    allow_whatsapp_checkout = Column(Boolean, default=False)
    
    is_active = Column(Boolean, default=True)

    # Relationships
    suppliers = relationship("Supplier", back_populates="plan")
    features = relationship("PlanFeature", back_populates="plan", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<VendorPlan {self.name}>"
