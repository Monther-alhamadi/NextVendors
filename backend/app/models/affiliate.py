from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import SQLAlchemyBaseModel
from app.core.database import Base
import secrets

class Affiliate(SQLAlchemyBaseModel, Base):
    __tablename__ = "affiliates"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    referral_code = Column(String(50), unique=True, nullable=False, index=True)
    
    # Metrics
    total_clicks = Column(Integer, default=0)
    total_conversions = Column(Integer, default=0)
    total_earnings = Column(Float, default=0.0)
    
    is_active = Column(Boolean, default=True)

    # Relationships
    user = relationship("User", backref="affiliate")
    coupons = relationship("AffiliateCoupon", back_populates="affiliate")

    @staticmethod
    def generate_referral_code():
        """Generate a unique 8-character referral code"""
        return secrets.token_urlsafe(6).upper()[:8]

    def __repr__(self):
        return f"<Affiliate {self.referral_code} (User#{self.user_id})>"
