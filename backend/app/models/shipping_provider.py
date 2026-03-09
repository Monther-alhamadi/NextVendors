from sqlalchemy import Column, String, Boolean, JSON
from app.models.base import SQLAlchemyBaseModel
from app.core.database import Base

class ShippingProvider(SQLAlchemyBaseModel, Base):
    __tablename__ = "shipping_providers"

    name = Column(String(100), nullable=False)
    code = Column(String(50), nullable=False, unique=True)
    is_active = Column(Boolean, default=True)
    description = Column(String(255), nullable=True)
    api_config = Column(JSON, nullable=True) # stores keys, account numbers, etc.
    environment = Column(String(20), default="sandbox") # sandbox or production

    def __repr__(self):
        return f"<ShippingProvider {self.name} ({self.code})>"
