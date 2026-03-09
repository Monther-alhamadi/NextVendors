from sqlalchemy import Column, Integer, String, Float, Boolean, JSON, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import SQLAlchemyBaseModel
from app.core.database import Base

class ShippingZone(SQLAlchemyBaseModel, Base):
    __tablename__ = "shipping_zones"

    name = Column(String(100), nullable=False)
    provider_id = Column(Integer, ForeignKey("shipping_providers.id"), nullable=False)
    countries = Column(JSON, nullable=False) # e.g. ["SA", "AE", "KW"]
    base_cost = Column(Float, default=0.0)
    cost_per_kg = Column(Float, default=0.0)
    is_active = Column(Boolean, default=True)

    provider = relationship("ShippingProvider")

    def __repr__(self):
        return f"<ShippingZone {self.name} (Provider {self.provider_id})>"
