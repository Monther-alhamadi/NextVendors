from sqlalchemy.orm import Session
from typing import List
from app.models.plan_feature import PlanFeature
from app.models.supplier import Supplier
from app.models.vendor_plan import VendorPlan
import logging

logger = logging.getLogger(__name__)

class FeatureFlagService:
    def __init__(self, db: Session):
        self.db = db

    def check_feature_access(self, vendor_id: int, feature_name: str) -> bool:
        """
        Check if a vendor has access to a specific feature based on their plan.
        Returns True if the feature is enabled for their plan, False otherwise.
        """
        vendor = self.db.get(Supplier, vendor_id)
        if not vendor or not vendor.plan_id:
            logger.warning(f"Vendor #{vendor_id} has no plan assigned")
            return False
        
        # Query for the feature flag
        feature = self.db.query(PlanFeature).filter(
            PlanFeature.plan_id == vendor.plan_id,
            PlanFeature.feature_name == feature_name
        ).first()
        
        if feature:
            return feature.is_enabled
        
        # If no explicit feature flag exists, deny access
        logger.debug(f"Feature '{feature_name}' not found for plan #{vendor.plan_id}")
        return False

    def get_plan_features(self, plan_id: int) -> List[PlanFeature]:
        """Get all features for a specific plan"""
        return self.db.query(PlanFeature).filter(
            PlanFeature.plan_id == plan_id
        ).all()

    def enable_feature_for_plan(self, plan_id: int, feature_name: str) -> PlanFeature:
        """Enable a feature for a plan"""
        feature = self.db.query(PlanFeature).filter(
            PlanFeature.plan_id == plan_id,
            PlanFeature.feature_name == feature_name
        ).first()
        
        if feature:
            feature.is_enabled = True
        else:
            feature = PlanFeature(
                plan_id=plan_id,
                feature_name=feature_name,
                is_enabled=True
            )
            self.db.add(feature)
        
        self.db.commit()
        self.db.refresh(feature)
        return feature

    def disable_feature_for_plan(self, plan_id: int, feature_name: str) -> bool:
        """Disable a feature for a plan"""
        feature = self.db.query(PlanFeature).filter(
            PlanFeature.plan_id == plan_id,
            PlanFeature.feature_name == feature_name
        ).first()
        
        if feature:
            feature.is_enabled = False
            self.db.commit()
            return True
        
        return False

    def get_vendor_features(self, vendor_id: int) -> List[str]:
        """Get all enabled features for a vendor"""
        vendor = self.db.get(Supplier, vendor_id)
        if not vendor or not vendor.plan_id:
            return []
        
        features = self.db.query(PlanFeature).filter(
            PlanFeature.plan_id == vendor.plan_id,
            PlanFeature.is_enabled == True
        ).all()
        
        return [f.feature_name for f in features]
