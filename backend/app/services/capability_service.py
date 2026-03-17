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
                "can_customize_store": vendor.plan.can_customize_store,
                "can_access_advanced_analytics": vendor.plan.can_access_advanced_analytics,
                "can_use_priority_support": vendor.plan.can_use_priority_support,
                "auto_approve_products": vendor.plan.auto_approve_products,
                "allow_whatsapp_checkout": vendor.plan.allow_whatsapp_checkout,
                "plan_name": vendor.plan.name,
                "plan_id": vendor.plan.id,
                "commission_rate": vendor.plan.commission_rate,
            })

            # Merge PlanFeature flags (dynamic feature toggles from plan_features table)
            if vendor.plan.features:
                for pf in vendor.plan.features:
                    base_limits[pf.feature_name] = pf.is_enabled

        # MERGE ADMIN OVERRIDES (highest priority)
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
            "can_customize_store": False,
            "can_access_advanced_analytics": False,
            "can_use_priority_support": False,
            "auto_approve_products": False,
            "allow_whatsapp_checkout": False,
            "can_use_ads": False,
            "can_use_affiliate": False,
            "can_use_dropshipping": False,
            "plan_name": "Free",
            "plan_id": None,
            "commission_rate": 0.10,
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
        return bool(caps.get('can_customize_store', False))

    def check_feature(self, vendor_id: int, feature_key: str) -> bool:
        """Generic feature check: returns True if the vendor has access to the given feature."""
        caps = self.get_vendor_capabilities(vendor_id)
        return bool(caps.get(feature_key, False))

