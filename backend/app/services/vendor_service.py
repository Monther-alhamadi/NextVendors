from typing import List, Optional, Union
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.models.supplier import Supplier
from app.models.supplier_product import SupplierProduct
from app.models.product import Product
from app.services.crud_service import CRUDService


class VendorService(CRUDService[Supplier]):
    """Service for managing Vendors (Suppliers) and their product linkages."""

    def __init__(self, db: Session):
        super().__init__(db, Supplier)

    def get_by_code(self, code: str) -> Optional[Supplier]:
        stmt = select(Supplier).where(Supplier.code == code).limit(1)
        return self.db.execute(stmt).scalars().first()

    def create(self, data: Union[dict, Supplier]) -> Supplier:
        """Create a new Supplier (Vendor) instance.
        
        Handles dict-like payloads by instantiating the Supplier model.
        """
        if not isinstance(data, Supplier):
            # If it's a Pydantic model or similar, convert to dict first
            if hasattr(data, "dict"):
                data = data.dict()
            elif hasattr(data, "model_dump"):
                data = data.model_dump()
                
            # Filter data to only include valid Supplier attributes
            valid_keys = {c.key for c in Supplier.__table__.columns}
            filtered_data = {k: v for k, v in data.items() if k in valid_keys}
            
            data = Supplier(**filtered_data)
            
        return super().create(data)

    def update(self, id: int, obj: Union[dict, Supplier]) -> Optional[Supplier]:
        """Override update to handle Store-specific elite customization fields."""
        store_fields = ["theme_color", "background_image_url", "store_ads", "announcement_text", "currency_display"]
        store_updates = {}
        
        if isinstance(obj, dict):
            # Extract store fields from dict
            for field in store_fields:
                if field in obj:
                    store_updates[field] = obj.pop(field)
        
        # Super update for Supplier attributes
        vendor = super().update(id, obj)
        
        # If there are store updates, apply them to the related store
        if vendor and store_updates:
            from app.models.store import Store
            store = self.db.query(Store).filter(Store.vendor_id == id).first()
            if store:
                for k, v in store_updates.items():
                    setattr(store, k, v)
                self.db.commit()
                self.db.refresh(vendor)
                
        return vendor


    def link_product(
        self,
        supplier_id: int,
        product_id: int,
        cost_price: float,
        inventory: int = 0,
        currency: str = "USD",
        sku_vendor: str = None,
    ) -> SupplierProduct:
        """
        Link a product to a supplier (Vendor) with specific cost and stock.
        Acts as the 'Offer' creation in the Reseller logic.
        """
        # Check existing link
        stmt = select(SupplierProduct).where(
            SupplierProduct.supplier_id == supplier_id,
            SupplierProduct.product_id == product_id,
        )
        existing = self.db.execute(stmt).scalars().first()

        if existing:
            existing.cost_price = cost_price
            existing.inventory = inventory
            existing.currency = currency
            if sku_vendor:
                existing.sku_vendor = sku_vendor
            self.db.commit()
            return existing

        # Create new link
        link = SupplierProduct(
            supplier_id=supplier_id,
            product_id=product_id,
            cost_price=cost_price,
            inventory=inventory,
            currency=currency,
            sku_vendor=sku_vendor,
        )
        self.db.add(link)
        self.db.commit()
        return link

    def get_supplier_products(self, supplier_id: int) -> List[SupplierProduct]:
        """Get all products supplied by a specific vendor."""
        stmt = (
            select(SupplierProduct)
            .where(SupplierProduct.supplier_id == supplier_id)
            .options(joinedload(SupplierProduct.product))
        )
        return list(self.db.execute(stmt).scalars().all())

    def update_supplier_stock(
        self, supplier_id: int, product_id: int, delta: int
    ) -> bool:
        stmt = select(SupplierProduct).where(
            SupplierProduct.supplier_id == supplier_id,
            SupplierProduct.product_id == product_id,
        )
        link = self.db.execute(stmt).scalars().first()
        if not link:
            return False
            
        new_val = link.inventory + delta
        if new_val < 0:
            raise ValueError("Supplier inventory cannot be negative")
            
        link.inventory = new_val
        self.db.commit()
        return True
        return True

    def register_vendor(self, user_id: int, data: dict) -> Supplier:
        """Register a new vendor for the given user."""
        # Check if user already has a vendor profile
        stmt = select(Supplier).where(Supplier.owner_id == user_id)
        existing = self.db.execute(stmt).scalars().first()
        if existing:
            raise ValueError("User already has a vendor profile")
            
        # Create pending vendor
        import uuid
        code = str(uuid.uuid4())[:8].upper() # Temp code
        
        vendor = Supplier(
            name=data["name"],
            description=data.get("description"),
            logo_url=data.get("logo_url"),
            owner_id=user_id,
            status="pending",
            code=code,
            is_verified=False,
            verification_document_url=data.get("verification_document_url")
        )
        self.db.add(vendor)
        self.db.commit()
        return vendor
