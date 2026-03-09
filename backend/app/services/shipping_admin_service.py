from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.shipping_provider import ShippingProvider
from app.models.shipping_zone import ShippingZone
from app.api.v1 import schemas

class ShippingAdminService:
    def __init__(self, db: Session):
        self.db = db

    # Providers
    def list_providers(self) -> List[ShippingProvider]:
        return self.db.query(ShippingProvider).all()

    def create_provider(self, data: schemas.ShippingProviderCreate) -> ShippingProvider:
        provider = ShippingProvider(**data.model_dump())
        self.db.add(provider)
        self.db.commit()
        self.db.refresh(provider)
        return provider

    def update_provider(self, provider_id: int, data: dict) -> Optional[ShippingProvider]:
        provider = self.db.get(ShippingProvider, provider_id)
        if not provider:
            return None
        for key, value in data.items():
            setattr(provider, key, value)
        self.db.commit()
        self.db.refresh(provider)
        return provider

    # Zones
    def list_zones(self) -> List[ShippingZone]:
        return self.db.query(ShippingZone).all()

    def create_zone(self, data: schemas.ShippingZoneCreate) -> ShippingZone:
        zone = ShippingZone(**data.model_dump())
        self.db.add(zone)
        self.db.commit()
        self.db.refresh(zone)
        return zone

    def update_zone(self, zone_id: int, data: dict) -> Optional[ShippingZone]:
        zone = self.db.get(ShippingZone, zone_id)
        if not zone:
            return None
        for key, value in data.items():
            setattr(zone, key, value)
        self.db.commit()
        self.db.refresh(zone)
        return zone

    def delete_zone(self, zone_id: int) -> bool:
        zone = self.db.get(ShippingZone, zone_id)
        if not zone:
            return False
        self.db.delete(zone)
        self.db.commit()
        return True

    # Pricing Engine
    def calculate_cost(self, country_code: str, weight_kg: float) -> float:
        """
        Calculate shipping cost based on the first active provider/zone found.
        In a real scenario, this would compare multiple and pick the best.
        """
        zones = self.db.query(ShippingZone).filter(ShippingZone.is_active == True).all()
        for zone in zones:
            if country_code in zone.countries:
                return zone.base_cost + (weight_kg * zone.cost_per_kg)
        return 0.0 # Default if no zone found
