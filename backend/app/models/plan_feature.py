from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import SQLAlchemyBaseModel
from app.core.database import Base

class PlanFeature(SQLAlchemyBaseModel, Base):
    """Feature flags for vendor plans (SaaS feature gating)"""
    __tablename__ = "plan_features"

    id = Column(Integer, primary_key=True, index=True)
    plan_id = Column(Integer, ForeignKey("vendor_plans.id"), nullable=False, index=True)
    feature_name = Column(String(100), nullable=False)  # custom_cover, advanced_analytics, priority_support
    is_enabled = Column(Boolean, default=True, nullable=False)

    # Relationships
    plan = relationship("VendorPlan", back_populates="features")

    def __repr__(self):
        return f"<PlanFeature {self.feature_name} for Plan#{self.plan_id}>"
