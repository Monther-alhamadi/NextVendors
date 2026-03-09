from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.supplier import Supplier

class CapabilityService:
    def __init__(self, db: Session):
        self.db = db

    def get_vendor_capabilities(self, vendor_id: int) -> Dict[str, Any]:
        vendor = self.db.query(Supplier).filter(Supplier.id == vendor_id).first()
        if not vendor:
            return self._default_free_limits()

        # BASE LIMITS from Plan
        base_limits = self._default_free_limits()
        if vendor.plan:
            base_limits.update({
                "max_products": vendor.plan.max_products,
                "max_coupons": vendor.plan.max_coupons,
                "allow_store_customization": vendor.plan.can_customize_store,
                "allow_whatsapp_checkout": vendor.plan.allow_whatsapp_checkout,
            })
            
        # MERGE OVERRIDES
        overrides = vendor.override_limits or {}
        if isinstance(overrides, dict):
            for key, value in overrides.items():
                if value is not None:
                    base_limits[key] = value

        return base_limits

    def _default_free_limits(self) -> Dict[str, Any]:
        return {
            "max_products": 50,
            "max_coupons": 0,
            "allow_store_customization": False,
            "allow_whatsapp_checkout": False,
        }

    def check_can_add_product(self, vendor_id: int, current_count: int) -> bool:
        caps = self.get_vendor_capabilities(vendor_id)
        max_allowed = caps.get('max_products', 50)
        return current_count < max_allowed

    def check_can_add_coupon(self, vendor_id: int, current_count: int) -> bool:
        caps = self.get_vendor_capabilities(vendor_id)
        max_allowed = caps.get('max_coupons', 0)
        return current_count < max_allowed

    def check_can_customize_store(self, vendor_id: int) -> bool:
        caps = self.get_vendor_capabilities(vendor_id)
        return bool(caps.get('allow_store_customization', False))
