from typing import Optional
from app.models.shipping import Shipping
from app.services.crud_service import CRUDService
from sqlalchemy import select


class ShippingService(CRUDService[Shipping]):
    def __init__(self, db):
        super().__init__(db, Shipping)

    def create_shipping(
        self, order_id: int, address: dict, method: str = "standard"
    ) -> Shipping:
        ship = Shipping(order_id=order_id, address=address, method=method)
        return self.create(ship)

    def update_tracking(self, shipping_id: int, tracking_number: str) -> Shipping:
        ship = self.get_by_id(shipping_id)
        if not ship:
            raise ValueError("Shipping not found")
        ship.tracking_number = tracking_number
        self.db.commit()
        # return a session-managed instance
        return self.get_by_id(shipping_id)

    def get_by_order(self, order_id: int) -> Optional[Shipping]:
        try:
            stmt = select(Shipping).where(Shipping.order_id == order_id).limit(1)
            return self.db.execute(stmt).scalars().first()
        except Exception:
            return self.db.query(Shipping).filter(Shipping.order_id == order_id).first()

    def calculate_shipping_cost(self, country_code: str, items_weight: float = 0.0) -> float:
        """Calculate shipping cost based on zones."""
        from app.models.shipping_zone import ShippingZone
        
        # Simple match for country in JSON countries field
        zone = self.db.query(ShippingZone).filter(
            ShippingZone.is_active == True
        ).first() # In a real app, use a more complex query to find the correct zone
        
        # Search zones for country match
        all_zones = self.db.query(ShippingZone).filter(ShippingZone.is_active == True).all()
        for z in all_zones:
            if z.countries and country_code in z.countries:
                zone = z
                break
        
        if not zone:
            return 25.0 # Default flat rate
            
        return zone.base_cost + (zone.cost_per_kg * items_weight)
