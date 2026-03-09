from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models.supplier import Supplier
from .aliexpress_connector import AliExpressConnector

class DropshippingService:
    def __init__(self, db: Session):
        self.db = db

    def get_connector(self, supplier_id: int):
        supplier = self.db.get(Supplier, supplier_id)
        if not supplier or not supplier.is_dropshipping:
            return None
        
        config = supplier.api_config or {}
        code = supplier.api_connector_code
        
        if code == 'aliexpress':
            return AliExpressConnector(config)
        # Add more connectors here as developed
        return None

    def forward_order_to_supplier(self, order_id: int, supplier_id: int) -> Dict[str, Any]:
        connector = self.get_connector(supplier_id)
        if not connector:
            return {"status": "error", "message": "No valid connector for supplier"}
        
        # In a real scenario, we fetch the full order data here
        order_data = {"id": order_id, "items": []} # Simplified for now
        return connector.place_order(order_data)

    def sync_external_product(self, external_id: str, supplier_id: int) -> Dict[str, Any]:
        connector = self.get_connector(supplier_id)
        if not connector:
            return {"status": "error", "message": "No valid connector"}
        
        return connector.sync_product(external_id)
