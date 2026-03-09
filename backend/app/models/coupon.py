from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import SQLAlchemyBaseModel
from app.core.database import Base


class Coupon(SQLAlchemyBaseModel, Base):
    __tablename__ = "coupons"

    id = Column(Integer, primary_key=True, index=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=True) # If null, it's a platform-wide coupon
    marketer_name = Column(String(128), nullable=True) # For affiliate tracking
    code = Column(String(64), nullable=False, unique=True, index=True)
    amount = Column(Float, nullable=False, default=0.0)
    amount_type = Column(
        String(16), nullable=False, default="fixed"
    )  # 'fixed' or 'percentage'
    active = Column(Boolean, nullable=False, default=True)
    max_uses = Column(Integer, nullable=True)
    used_count = Column(Integer, nullable=False, default=0)
    min_order_amount = Column(Float, nullable=True)
    expires_at = Column(DateTime, nullable=True)
    start_at = Column(DateTime, nullable=True)
    per_user_limit = Column(Integer, nullable=True)
    stackable = Column(Boolean, nullable=False, default=False)

    def is_valid(self, order_total: float) -> bool:
        if not self.active:
            return False
        if self.expires_at and datetime.utcnow() > self.expires_at:
            return False
        if self.start_at and datetime.utcnow() < self.start_at:
            return False
        if self.max_uses is not None and self.used_count >= self.max_uses:
            return False
        if self.min_order_amount is not None and order_total < self.min_order_amount:
            return False
        return True


__all__ = ["Coupon"]


class CouponRedemption(SQLAlchemyBaseModel, Base):
    __tablename__ = "coupon_redemptions"

    id = Column(Integer, primary_key=True, index=True)
    coupon_id = Column(Integer, ForeignKey("coupons.id"), nullable=False, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    used_count = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    coupon = relationship("Coupon", backref="redemptions")


__all__.append("CouponRedemption")
