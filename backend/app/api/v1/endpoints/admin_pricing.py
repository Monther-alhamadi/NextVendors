"""Admin endpoints to manage tax rates and coupons.

These are implemented defensively so importing this module won't fail
if FastAPI or related runtime dependencies are unavailable in the
execution environment (useful for running unit tests that don't
require the full HTTP stack).
"""

from typing import Optional
from datetime import datetime
from app.core.database import get_db
from app.services.pricing_service import PricingService
from app.services.discount_service import DiscountService

try:
    from fastapi import APIRouter, Depends, HTTPException
    from pydantic import BaseModel

    router = APIRouter()

    class TaxIn(BaseModel):
        name: str
        rate: float
        country: Optional[str] = None
        region: Optional[str] = None
        postal_code_pattern: Optional[str] = None
        priority: int = 0
        override: bool = False
        active: bool = True

    class CouponIn(BaseModel):
        code: str
        amount: float
        amount_type: str = "fixed"
        active: bool = True
        min_order_amount: Optional[float] = None
        max_uses: Optional[int] = None
        per_user_limit: Optional[int] = None
        start_at: Optional[datetime] = None
        expires_at: Optional[datetime] = None
        stackable: bool = False

    @router.post("/admin/taxes")
    def create_tax(t: TaxIn, db=Depends(get_db)):
        svc = PricingService(db)
        tr = svc.create_tax_rate(
            t.name,
            t.rate,
            country=t.country,
            region=t.region,
            postal_code_pattern=t.postal_code_pattern,
            priority=int(t.priority),
            override=bool(t.override),
            active=t.active,
        )
        return {"id": tr.id, "name": tr.name, "rate": tr.rate}

    @router.get("/admin/taxes")
    def list_taxes(db=Depends(get_db)):
        svc = PricingService(db)
        return [
            dict(id=r.id, name=r.name, rate=r.rate, country=r.country, active=r.active)
            for r in svc.list_active_rates()
        ]

    @router.get("/admin/taxes/{tax_id}")
    def get_tax(tax_id: int, db=Depends(get_db)):
        svc = PricingService(db)
        tr = svc.get_tax_rate_by_id(tax_id)
        if not tr:
            raise HTTPException(status_code=404, detail="Tax rate not found")
        return dict(
            id=tr.id, name=tr.name, rate=tr.rate, country=tr.country, active=tr.active
        )

    @router.put("/admin/taxes/{tax_id}")
    def update_tax(tax_id: int, t: TaxIn, db=Depends(get_db)):
        svc = PricingService(db)
        tr = svc.update_tax_rate(
            tax_id,
            name=t.name,
            rate=float(t.rate),
            country=t.country,
            active=bool(t.active),
        )
        if not tr:
            raise HTTPException(status_code=404, detail="Tax rate not found")
        return dict(
            id=tr.id, name=tr.name, rate=tr.rate, country=tr.country, active=tr.active
        )

    @router.delete("/admin/taxes/{tax_id}")
    def delete_tax(tax_id: int, db=Depends(get_db)):
        svc = PricingService(db)
        ok = svc.delete_tax_rate(tax_id)
        if not ok:
            raise HTTPException(status_code=404, detail="Tax rate not found")
        return {"deleted": True}

    @router.post("/admin/coupons")
    def create_coupon(c: CouponIn, db=Depends(get_db)):
        svc = DiscountService(db)
        coupon = svc.create_coupon(
            code=c.code,
            amount=c.amount,
            amount_type=c.amount_type,
            active=c.active,
            min_order_amount=c.min_order_amount,
            max_uses=c.max_uses,
            per_user_limit=c.per_user_limit,
            start_at=c.start_at,
            expires_at=c.expires_at,
            stackable=c.stackable,
        )
        return {"id": coupon.id, "code": coupon.code}

    @router.get("/admin/coupons")
    def list_coupons(db=Depends(get_db)):
        svc = DiscountService(db)
        return [
            dict(
                id=r.id,
                code=r.code,
                amount=r.amount,
                amount_type=r.amount_type,
                active=r.active,
            )
            for r in svc.list_coupons()
        ]

    @router.get("/admin/coupons/{coupon_id}")
    def get_coupon(coupon_id: int, db=Depends(get_db)):
        svc = DiscountService(db)
        c = svc.get_by_id(coupon_id)
        if not c:
            raise HTTPException(status_code=404, detail="Coupon not found")
        return dict(
            id=c.id,
            code=c.code,
            amount=c.amount,
            amount_type=c.amount_type,
            active=c.active,
        )

    @router.put("/admin/coupons/{coupon_id}")
    def update_coupon(coupon_id: int, c_in: CouponIn, db=Depends(get_db)):
        svc = DiscountService(db)
        c = svc.update_coupon(
            coupon_id,
            code=c_in.code,
            amount=float(c_in.amount),
            amount_type=c_in.amount_type,
            active=bool(c_in.active),
            min_order_amount=c_in.min_order_amount,
            max_uses=c_in.max_uses,
            per_user_limit=c_in.per_user_limit,
            start_at=c_in.start_at,
            expires_at=c_in.expires_at,
            stackable=c_in.stackable,
        )
        if not c:
            raise HTTPException(status_code=404, detail="Coupon not found")
        return dict(
            id=c.id,
            code=c.code,
            amount=c.amount,
            amount_type=c.amount_type,
            active=c.active,
        )

    @router.delete("/admin/coupons/{coupon_id}")
    def delete_coupon(coupon_id: int, db=Depends(get_db)):
        svc = DiscountService(db)
        ok = svc.delete_coupon(coupon_id)
        if not ok:
            raise HTTPException(status_code=404, detail="Coupon not found")
        return {"deleted": True}

except Exception:
    # FastAPI not available or imports failed; declare a no-op router
    router = None
