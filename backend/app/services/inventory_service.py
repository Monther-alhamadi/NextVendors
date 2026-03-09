from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import select, update
from app.models.product import Product
from app.models.product_variant import ProductVariant
from app.models.stock_reservation import StockReservation

class InventoryService:
    def __init__(self, db: Session):
        self.db = db

    def get_available_stock(self, product_id: int, variant_id: int = None) -> int:
        """
        Calculate available stock.
        CONVENTION (unified):
          - virtual_stock on Product = 'available to sell' (tracks reservations)
          - inventory on Product     = physical stock count
          - available = virtual_stock (when using reservations)
          - available = inventory - reserved_stock (for Variants)
        """
        if variant_id:
            item = self.db.get(ProductVariant, variant_id)
            if not item:
                return 0
            reserved = getattr(item, 'reserved_stock', 0) or 0
            return max(0, (item.inventory or 0) - reserved)

        item = self.db.get(Product, product_id)
        if not item:
            return 0
        # virtual_stock tracks available units; fallback to inventory if not set
        if item.virtual_stock is not None:
            return max(0, item.virtual_stock)
        return max(0, item.inventory or 0)

    def reserve_stock(self, product_id: int, quantity: int, session_id: str = None,
                      user_id: int = None, variant_id: int = None,
                      duration_minutes: int = 15) -> bool:
        """
        Attempt to reserve stock atomically.
        For Products:  decrements virtual_stock (available units)
        For Variants:  increments reserved_stock
        Returns True on success, False if insufficient stock.
        """
        if variant_id:
            item = self.db.query(ProductVariant).with_for_update().get(variant_id)
            reserved = getattr(item, 'reserved_stock', 0) or 0
            if not item or (item.inventory - reserved) < quantity:
                return False
            item.reserved_stock = reserved + quantity
        else:
            item = self.db.query(Product).with_for_update().get(product_id)
            available = item.virtual_stock if (item and item.virtual_stock is not None) else (item.inventory if item else 0)
            if not item or (available or 0) < quantity:
                return False
            # Decrease available units
            if item.virtual_stock is not None:
                item.virtual_stock -= quantity
            else:
                # Initialise virtual_stock from physical inventory if first reservation
                item.virtual_stock = (item.inventory or 0) - quantity

        expires_at = datetime.utcnow() + timedelta(minutes=duration_minutes)
        res = StockReservation(
            product_id=product_id,
            variant_id=variant_id,
            quantity=quantity,
            session_id=session_id,
            user_id=user_id,
            expires_at=expires_at
        )
        self.db.add(res)
        self.db.commit()
        return True

    def release_expired_reservations(self):
        """Cron job: Release stock for all expired reservations."""
        now = datetime.utcnow()
        expired = self.db.scalars(
            select(StockReservation).where(StockReservation.expires_at < now)
        ).all()
        for res in expired:
            self.release_stock(res.id)

    def release_stock(self, reservation_id: int):
        """Return reserved units back to available pool."""
        res = self.db.get(StockReservation, reservation_id)
        if not res:
            return

        if res.variant_id:
            item = self.db.query(ProductVariant).with_for_update().get(res.variant_id)
            if item:
                item.reserved_stock = max(0, (getattr(item, 'reserved_stock', 0) or 0) - res.quantity)
        else:
            item = self.db.query(Product).with_for_update().get(res.product_id)
            if item and item.virtual_stock is not None:
                item.virtual_stock += res.quantity  # Restore available units

        self.db.delete(res)
        self.db.commit()

    def commit_stock(self, reservation_id: int):
        """
        Finalise a sale: decrement physical inventory and remove reservation.
        virtual_stock was already reduced during reservation, so no change needed there.
        Example: inventory=10, virtual_stock=10
          → reserve(1): inventory=10, virtual_stock=9
          → commit(1):  inventory=9,  virtual_stock=9  ✓
        """
        res = self.db.get(StockReservation, reservation_id)
        if not res:
            return

        if res.variant_id:
            item = self.db.query(ProductVariant).with_for_update().get(res.variant_id)
            if item:
                item.inventory = max(0, (item.inventory or 0) - res.quantity)
                item.reserved_stock = max(0, (getattr(item, 'reserved_stock', 0) or 0) - res.quantity)
        else:
            item = self.db.query(Product).with_for_update().get(res.product_id)
            if item:
                item.inventory = max(0, (item.inventory or 0) - res.quantity)
                # virtual_stock stays as-is (already reduced at reservation time)
        
        self.db.delete(res)
        self.db.commit()

    # --- Supplier / Drop-shipping Logic ---
    def find_supplier_for_product(self, product_id: int, quantity: int):
        """Find a supplier with sufficient stock for the product."""
        from app.models.supplier_product import SupplierProduct
        
        # Simple strategy: First supplier found with enough stock
        stock = self.db.query(SupplierProduct).filter(
            SupplierProduct.product_id == product_id,
            SupplierProduct.inventory >= quantity
        ).order_by(SupplierProduct.cost_price.asc()).first()
        
        return stock

    def decrement_supplier_stock(self, supplier_stock_obj, quantity: int):
        """Update supplier inventory record."""
        if not supplier_stock_obj: return
        
        supplier_stock_obj.inventory -= quantity
        self.db.add(supplier_stock_obj)

    def update_stock(self, product_id: int, delta: int, variant_id: int = None) -> bool:
        """General stock adjustment (positive to increase, negative to decrease)."""
        if variant_id:
            item = self.db.query(ProductVariant).with_for_update().get(variant_id)
            if not item: return False
            item.inventory += delta
        else:
            item = self.db.query(Product).with_for_update().get(product_id)
            if not item: return False
            item.inventory += delta
            # Also sync virtual_stock (available) if it exists
            if item.virtual_stock is not None:
                item.virtual_stock += delta
        
        self.db.commit()
        return True
