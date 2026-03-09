from typing import Optional
from app.models.coupon import Coupon, CouponRedemption


class DiscountService:
    """Simple discount/coupon service."""

    def __init__(self, db):
        self.db = db

    def create_coupon(
        self, code: str, amount: float, amount_type: str = "fixed", **kwargs
    ) -> Coupon:
        c = Coupon(code=code, amount=amount, amount_type=amount_type, **kwargs)
        self.db.add(c)
        self.db.commit()
        return c

    def get_by_code(self, code: str) -> Optional[Coupon]:
        try:
            return self.db.query(Coupon).filter(Coupon.code == code).first()
        except Exception:
            return None

    def list_coupons(self, supplier_id: Optional[int] = None):
        try:
            query = self.db.query(Coupon)
            if supplier_id is not None:
                query = query.filter(Coupon.supplier_id == supplier_id)
            return query.all()
        except Exception:
            return []

    def get_by_id(self, coupon_id: int) -> Optional[Coupon]:
        try:
            return self.db.query(Coupon).filter(Coupon.id == int(coupon_id)).first()
        except Exception:
            return None

    def get_user_redemption(
        self, coupon_id: int, user_id: int
    ) -> Optional[CouponRedemption]:
        try:
            return (
                self.db.query(CouponRedemption)
                .filter(CouponRedemption.coupon_id == int(coupon_id))
                .filter(CouponRedemption.user_id == int(user_id))
                .first()
            )
        except Exception:
            return None

    def update_coupon(self, coupon_id: int, **fields) -> Optional[Coupon]:
        c = self.get_by_id(coupon_id)
        if not c:
            return None
        for k, v in fields.items():
            if hasattr(c, k):
                setattr(c, k, v)
        self.db.commit()
        return c

    def delete_coupon(self, coupon_id: int) -> bool:
        c = self.get_by_id(coupon_id)
        if not c:
            return False
        try:
            self.db.delete(c)
            self.db.commit()
            return True
        except Exception:
            return False

    def validate_coupon_for_total(self, coupon: Coupon, order_total: float) -> bool:
        if coupon is None:
            return False
        return coupon.is_valid(order_total)

    def validate_coupon_for_user(
        self, coupon: Coupon, order_total: float, user_id: int | None = None
    ) -> bool:
        if not self.validate_coupon_for_total(coupon, order_total):
            return False
        if user_id is None or coupon.per_user_limit is None:
            return True
        ur = self.get_user_redemption(coupon.id, user_id)
        if ur is None:
            return True
        return ur.used_count < (coupon.per_user_limit or 0)

    def apply_coupon_to_total(self, coupon: Coupon, order_total: float) -> float:
        """Return discount amount (positive number) to subtract from order_total."""
        if coupon.amount_type == "percentage":
            return order_total * (float(coupon.amount) / 100.0)
        return float(coupon.amount)

    def record_redemption(self, coupon: Coupon, user_id: int) -> None:
        # increment global used_count
        try:
            coupon.used_count = (coupon.used_count or 0) + 1
            ur = self.get_user_redemption(coupon.id, user_id)
            if ur is None:
                ur = CouponRedemption(
                    coupon_id=coupon.id, user_id=user_id, used_count=1
                )
                self.db.add(ur)
            else:
                ur.used_count = (ur.used_count or 0) + 1
            self.db.commit()
        except Exception:
            self.db.rollback()


__all__ = ["DiscountService"]
