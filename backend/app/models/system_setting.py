from sqlalchemy import Column, Integer, String, Text
from app.models.base import SQLAlchemyBaseModel
from app.core.database import Base

class SystemSetting(SQLAlchemyBaseModel, Base):
    """Global system settings for dynamic platform configuration"""
    __tablename__ = "admin_settings"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(100), unique=True, nullable=False, index=True)
    value = Column(Text, nullable=True)
    data_type = Column(String(20), default="string")  # float, int, bool, string, json

    def get_typed_value(self):
        """Convert string value to appropriate type"""
        if self.value is None:
            return None
        
        if self.data_type == "int":
            return int(self.value)
        elif self.data_type == "float":
            return float(self.value)
        elif self.data_type == "bool":
            return self.value.lower() in ("true", "1", "yes")
        elif self.data_type == "json":
            import json
            return json.loads(self.value)
        else:
            return self.value

    def __repr__(self):
        return f"<SystemSetting {self.key}={self.value}>"
