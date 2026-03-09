from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import SQLAlchemyBaseModel
from app.core.database import Base

class AffiliateCoupon(SQLAlchemyBaseModel, Base):
    """Vendor-created coupons for specific affiliates with custom commission rates"""
    __tablename__ = "affiliate_coupons"

    id = Column(Integer, primary_key=True, index=True)
    vendor_id = Column(Integer, ForeignKey("suppliers.id"), nullable=False, index=True)
    affiliate_id = Column(Integer, ForeignKey("affiliates.id"), nullable=False, index=True)
    coupon_code = Column(String(50), unique=True, nullable=False, index=True)
    
    # Commission configuration
    commission_type = Column(String(20), default="percentage")  # percentage or fixed
    commission_value = Column(Float, default=5.0)  # 5% or $5
    
    # Metrics
    clicks = Column(Integer, default=0)
    conversions = Column(Integer, default=0)
    
    is_active = Column(Boolean, default=True)

    # Relationships
    vendor = relationship("Supplier", backref="affiliate_coupons")
    affiliate = relationship("Affiliate", back_populates="coupons")

    def calculate_commission(self, order_subtotal: float) -> float:
        """Calculate affiliate commission based on type"""
        if self.commission_type == "percentage":
            return order_subtotal * (self.commission_value / 100)
        else:  # fixed
            return self.commission_value

    def __repr__(self):
        return f"<AffiliateCoupon {self.coupon_code} ({self.commission_value}{'%' if self.commission_type == 'percentage' else '$'})>"
