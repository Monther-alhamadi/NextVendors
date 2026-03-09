from sqlalchemy.orm import Session
from typing import Dict, Any, Optional
from app.models.affiliate import Affiliate
from app.models.affiliate_coupon import AffiliateCoupon
from app.models.wallet import UserWallet
from app.models.user import User
import logging

logger = logging.getLogger(__name__)

class AffiliateService:
    def __init__(self, db: Session):
        self.db = db

    def create_affiliate(self, user_id: int) -> Affiliate:
        """Create an affiliate account for a user"""
        existing = self.db.query(Affiliate).filter(Affiliate.user_id == user_id).first()
        if existing:
            return existing
        
        # Generate unique referral code
        while True:
            ref_code = Affiliate.generate_referral_code()
            if not self.db.query(Affiliate).filter(Affiliate.referral_code == ref_code).first():
                break
        
        affiliate = Affiliate(user_id=user_id, referral_code=ref_code)
        self.db.add(affiliate)
        self.db.commit()
        self.db.refresh(affiliate)
        
        logger.info(f"Created affiliate: {ref_code} for user #{user_id}")
        return affiliate

    def track_click(self, referral_code: str) -> bool:
        """Track a click on an affiliate link"""
        affiliate = self.db.query(Affiliate).filter(
            Affiliate.referral_code == referral_code,
            Affiliate.is_active == True
        ).first()
        
        if not affiliate:
            return False
        
        affiliate.total_clicks += 1
        self.db.commit()
        return True

    def track_conversion(self, referral_code: str, order_id: int, commission: float) -> bool:
        """Track a successful conversion and update affiliate earnings"""
        affiliate = self.db.query(Affiliate).filter(
            Affiliate.referral_code == referral_code
        ).first()
        
        if not affiliate:
            return False
        
        affiliate.total_conversions += 1
        affiliate.total_earnings += commission
        self.db.commit()
        
        logger.info(f"Affiliate {referral_code} earned ${commission:.2f} from order #{order_id}")
        return True

    def get_affiliate_by_code(self, referral_code: str) -> Optional[Affiliate]:
        """Get affiliate by referral code"""
        return self.db.query(Affiliate).filter(
            Affiliate.referral_code == referral_code
        ).first()

    def get_affiliate_dashboard(self, user_id: int) -> Dict[str, Any]:
        """Get comprehensive dashboard stats for an affiliate"""
        affiliate = self.db.query(Affiliate).filter(Affiliate.user_id == user_id).first()
        
        if not affiliate:
            return {
                "is_affiliate": False,
                "message": "User is not registered as an affiliate"
            }
        
        # Get wallet info
        wallet = self.db.query(UserWallet).filter(UserWallet.user_id == user_id).first()
        
        return {
            "is_affiliate": True,
            "referral_code": affiliate.referral_code,
            "tracking_link": f"/track/ref/{affiliate.referral_code}",
            "total_clicks": affiliate.total_clicks,
            "total_conversions": affiliate.total_conversions,
            "conversion_rate": (affiliate.total_conversions / affiliate.total_clicks * 100) if affiliate.total_clicks > 0 else 0.0,
            "lifetime_earnings": affiliate.total_earnings,
            "available_balance": wallet.balance if wallet else 0.0,
            "pending_balance": wallet.pending_balance if wallet else 0.0,
            "is_active": affiliate.is_active
        }

    def create_affiliate_coupon(
        self, 
        vendor_id: int, 
        affiliate_id: int, 
        coupon_code: str,
        commission_type: str = "percentage",
        commission_value: float = 5.0
    ) -> AffiliateCoupon:
        """Vendor creates a custom affiliate coupon"""
        coupon = AffiliateCoupon(
            vendor_id=vendor_id,
            affiliate_id=affiliate_id,
            coupon_code=coupon_code.upper(),
            commission_type=commission_type,
            commission_value=commission_value
        )
        self.db.add(coupon)
        self.db.commit()
        self.db.refresh(coupon)
        
        logger.info(f"Created affiliate coupon: {coupon_code} for vendor #{vendor_id}")
        return coupon

    def get_vendor_affiliate_coupons(self, vendor_id: int):
        """Get all affiliate coupons for a vendor"""
        return self.db.query(AffiliateCoupon).filter(
            AffiliateCoupon.vendor_id == vendor_id
        ).all()
