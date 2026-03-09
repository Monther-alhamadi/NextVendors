from sqlalchemy.orm import Session
from typing import Any, Optional
from app.models.system_setting import SystemSetting
import logging

logger = logging.getLogger(__name__)

class SystemSettingsService:
    def __init__(self, db: Session):
        self.db = db

    def get_setting(self, key: str, default: Any = None) -> Any:
        """
        Retrieve a typed setting value.
        Returns the typed value if found, otherwise returns the default.
        """
        setting = self.db.query(SystemSetting).filter(
            SystemSetting.key == key
        ).first()
        
        if setting:
            return setting.get_typed_value()
        
        logger.debug(f"Setting '{key}' not found, using default: {default}")
        return default

    def set_setting(self, key: str, value: Any, data_type: str = "string") -> SystemSetting:
        """
        Set a system setting value.
        Converts the value to string for storage.
        """
        setting = self.db.query(SystemSetting).filter(
            SystemSetting.key == key
        ).first()
        
        # Convert value to string
        if data_type == "json":
            import json
            str_value = json.dumps(value)
        else:
            str_value = str(value)
        
        if setting:
            setting.value = str_value
            setting.data_type = data_type
        else:
            setting = SystemSetting(
                key=key,
                value=str_value,
                data_type=data_type
            )
            self.db.add(setting)
        
        self.db.commit()
        self.db.refresh(setting)
        logger.info(f"Updated system setting: {key} = {value}")
        return setting

    def get_all_settings(self) -> dict:
        """Get all system settings as a dictionary"""
        settings = self.db.query(SystemSetting).all()
        return {s.key: s.get_typed_value() for s in settings}

    def delete_setting(self, key: str) -> bool:
        """Delete a system setting"""
        setting = self.db.query(SystemSetting).filter(
            SystemSetting.key == key
        ).first()
        
        if setting:
            self.db.delete(setting)
            self.db.commit()
            logger.info(f"Deleted system setting: {key}")
            return True
        
        return False

    # Convenience methods for common settings
    def get_default_commission_rate(self) -> float:
        """Get the default platform commission rate"""
        return self.get_setting("default_commission_rate", 0.10)

    def get_min_payout_threshold(self) -> float:
        """Get the minimum payout threshold for vendors"""
        return self.get_setting("min_payout_threshold", 50.0)

    def is_maintenance_mode(self) -> bool:
        """Check if the platform is in maintenance mode"""
        return self.get_setting("maintenance_mode", False)

    def get_ad_price_per_day(self) -> float:
        """Get the price for featured ads per day"""
        return self.get_setting("ad_price_per_day", 10.0)
