from sqlalchemy import Column, Integer, String, Float, Boolean
from app.models.base import SQLAlchemyBaseModel
from app.core.database import Base

class SubscriptionPlan(SQLAlchemyBaseModel, Base):
    __tablename__ = "subscription_plans"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True)
    description = Column(String(255), nullable=True)
    monthly_price = Column(Float, nullable=False, default=0.0)
    commission_rate = Column(Float, nullable=False, default=0.10) # Reduced commission for higher tiers
    is_active = Column(Boolean, default=True)
    features = Column(String(1024), nullable=True) # JSON or Comma-separated list

    def __repr__(self):
        return f"<SubscriptionPlan {self.name} {self.monthly_price}>"
