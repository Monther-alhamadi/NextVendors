from sqlalchemy import Column, Integer, String, Date, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import date
from app.core.database import Base
from app.models.base import SQLAlchemyBaseModel

class AffiliateStats(SQLAlchemyBaseModel, Base):
    __tablename__ = "affiliate_stats"

    id = Column(Integer, primary_key=True, index=True)
    coupon_id = Column(Integer, ForeignKey("coupons.id"), nullable=False, index=True)
    date = Column(Date, default=date.today, nullable=False, index=True)
    
    visits = Column(Integer, default=0)
    unique_visitors = Column(Integer, default=0)
    
    # Relationship
    coupon = relationship("Coupon", backref="daily_stats")

    # Ensure one record per coupon per day
    __table_args__ = (
        UniqueConstraint('coupon_id', 'date', name='uq_affiliate_stats_coupon_date'),
    )

__all__ = ["AffiliateStats"]
