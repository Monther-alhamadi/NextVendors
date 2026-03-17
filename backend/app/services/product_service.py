from typing import Optional, List, Any, Dict, Union
import json
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload
from app.models.product import Product
from app.models.product_image import ProductImage
from app.models.product_variant import ProductVariant
from app.models.master_product import MasterProduct
from app.models.store import Store
from app.models.vendor_plan import VendorPlan
from app.models.supplier import Supplier
from app.models.user import User
from app.models.product_variation import (
    ProductVariationVariable,
    ProductVariationVariableValue,
    ProductVariationResult,
    hash_combination,
)
from app.services.crud_service import CRUDService
from app.core.cache import (
    bump_namespace_version,
    delete_cache_ns,
)
from datetime import datetime
from app.models.audit_log import SystemAuditLog


class ProductService(CRUDService[Product]):
    """Service responsible for product CRUD and domain-related helpers."""

    def __init__(self, db: Session) -> None:
        super().__init__(db, Product)

    def create(self, obj: Union[Product, Dict[str, Any], Any], user_id: int = None) -> Product:
        """Create a new Product with Plan Limits and Ownership enforcement."""
        data = None
        if isinstance(obj, dict):
            data = obj
        elif isinstance(obj, Product):
            data = {k: v for k, v in obj.__dict__.items() if not k.startswith("_")}
        else:
            data = getattr(obj, "__dict__", None) or dict(obj)

        # 1. Authority Check & store_id Resolution
        store_id = data.get("store_id")
        if user_id:
            user = self.db.get(User, user_id)
            if user and user.role != "admin" and not user.has_permission("manage_products"):
                # Non-admin users MUST have their store_id derived from their supplier account
                if user.suppliers:
                    supplier = user.suppliers[0]
                    if supplier.store:
                        store_id = supplier.store.id
                        data["store_id"] = store_id
                else:
                    raise ValueError("You must be a registered vendor to create products.")

        # 2. Plan Limit Check
        if store_id:
            store = self.db.get(Store, store_id)
            if store and store.vendor and store.vendor.plan:
                max_list = store.vendor.plan.max_products or 100
                current_count = self.db.query(Product).filter(Product.store_id == store_id).count()
                if current_count >= max_list:
                    raise ValueError(f"Subscription Limit Reached: You cannot create more than {max_list} products.")

        # 3. Handle Auto-Approval
        if store_id and "moderation_status" not in data:
            data["moderation_status"] = self._get_initial_moderation_status(store_id)

        # 4. Create Product via Base
        created = super().create(data)

        # 5. Handle Images
        imgs = data.get("images")
        if imgs and isinstance(imgs, (list, tuple)):
            for item in imgs:
                try:
                    if not item: continue
                    if isinstance(item, dict):
                        pi = ProductImage(
                            product_id=created.id,
                            url=item.get("url"),
                            kind=item.get("kind", "image"),
                            position=item.get("position", 0),
                            public=item.get("public", True),
                            is_primary=item.get("is_primary", False),
                        )
                    else:
                        pi = ProductImage(product_id=created.id, url=item)
                    self.db.add(pi)
                except Exception: continue
            self.db.commit()
            self.db.refresh(created)

        # ── Invalidate product cache namespace ──
        bump_namespace_version("products")
        return created

    def update(self, id: int, obj: Union[Product, Dict[str, Any], Any], user_id: int = None) -> Optional[Product]:
        """Update Product with Audit Logging for Price/Stock."""
        existing = self.db.get(Product, id)
        if not existing: return None
        
        old_price = existing.price
        old_stock = existing.inventory
        
        # Prepare updates
        update_data = obj if isinstance(obj, dict) else {k: v for k, v in obj.__dict__.items() if not k.startswith("_")}
        
        # Strip complex relationships before base update
        imgs = update_data.pop("images", None)
        
        updated = super().update(id, update_data)
        if not updated: return None
        
        # 1. Audit Logging
        if user_id:
            changes = {}
            if updated.price != old_price:
                changes["price"] = {"from": old_price, "to": updated.price}
            if updated.inventory != old_stock:
                changes["inventory"] = {"from": old_stock, "to": updated.inventory}
            
            if changes:
                log = SystemAuditLog(
                    action="UPDATE_PRODUCT_CRITICAL",
                    user_id=user_id,
                    target_type="product",
                    target_id=str(id),
                    details=json.dumps(changes),
                    ip_address="internal"
                )
                self.db.add(log)
                self.db.commit()

        # 2. Handle Images if provided
        if imgs is not None:
            self.db.query(ProductImage).filter(ProductImage.product_id == id).delete()
            for item in imgs:
                url = item.get("url") if isinstance(item, dict) else item
                if url:
                    pi = ProductImage(product_id=id, url=url)
                    self.db.add(pi)
            self.db.commit()

        # ── Invalidate product cache namespace ──
        bump_namespace_version("products")
        return updated

    def search_products(self, q: str = "", limit: int = 10) -> List[Product]:
        """Search products with Sponsored Priority Sorting."""
        query = select(Product).filter(Product.status == "published", Product.moderation_status == "approved")
        if q:
            query = query.filter((Product.name.ilike(f"%{q}%")) | (Product.description.ilike(f"%{q}%")))
        
        query = query.order_by(Product.is_sponsored.desc(), Product.id.desc())
        return list(self.db.scalars(query.limit(limit)))

    def filter_products(
        self,
        q: str = None,
        category: str = None,
        min_price: float = None,
        max_price: float = None,
        sort_by: str = "newest",
        in_stock: bool = None,
        supplier_id: int = None,
        page: int = 1,
        page_size: int = 20,
    ) -> dict:
        """
        Full-featured product listing: filtering + sorting + pagination.
        Returns a paginated envelope so the frontend can implement infinite scroll.
        """
        from sqlalchemy import func, desc, asc

        base = self.db.query(Product).filter(
            Product.status == "published",
            Product.moderation_status == "approved",
        )

        # --- Filters ---
        if q:
            term = f"%{q}%"
            base = base.filter(
                (Product.name.ilike(term)) | (Product.description.ilike(term))
            )
        if category:
            base = base.filter(Product.category.ilike(category))
        if min_price is not None:
            base = base.filter(Product.price >= min_price)
        if max_price is not None:
            base = base.filter(Product.price <= max_price)
        if in_stock is True:
            base = base.filter(Product.inventory > 0)
        if in_stock is False:
            base = base.filter(Product.inventory == 0)
        if supplier_id is not None:
            from app.models.supplier_product import SupplierProduct as SP
            base = base.join(SP, SP.product_id == Product.id).filter(SP.supplier_id == supplier_id)

        # --- Sorting ---
        sort_map = {
            "newest":      Product.id.desc(),
            "price_asc":   Product.price.asc(),
            "price_desc":  Product.price.desc(),
            "popular":     Product.is_sponsored.desc(),
            "sales_desc":  Product.total_sales.desc(),
            "rating_desc": Product.rating.desc(),
            "rating_asc":  Product.rating.asc(),
        }
        order_clause = sort_map.get(sort_by, Product.id.desc())
        # Always put sponsored products first unless sorting by price or explicitly by other non-sponsored metrics
        if sort_by not in ("price_asc", "price_desc", "sales_desc", "rating_desc", "rating_asc"):
            base = base.order_by(Product.is_sponsored.desc(), order_clause)
        else:
            base = base.order_by(order_clause)

        # --- Pagination ---
        # Count on the base query *before* eager loading to avoid
        # duplicate-row miscounts caused by joinedload JOINs.
        total = base.count()
        pages = max(1, -(-total // page_size))  # ceiling division
        offset = (page - 1) * page_size

        # Apply eager loading only for the final paginated fetch.
        items = (
            base.options(joinedload(Product.images))
            .offset(offset)
            .limit(page_size)
            .all()
        )

        return {
            "items": items,
            "total": total,
            "page": page,
            "pages": pages,
        }


    def delete(self, id: int) -> bool:
        ok = super().delete(id)
        if ok:
            delete_cache_ns("product", f"{id}")
            bump_namespace_version("products")
        return ok

    def _get_initial_moderation_status(self, store_id: int) -> str:
        store = self.db.get(Store, store_id)
        if store and store.vendor and store.vendor.plan:
            if store.vendor.plan.auto_approve_products:
                return "approved"
        return "pending"

    # --- Variant & Variation Helpers (Shuup-inspired) ---
    def get_variants(self, product_id: int):
        return self.db.query(ProductVariant).filter(ProductVariant.product_id == product_id).all()

    def create_variant(self, product_id: int, data: dict) -> ProductVariant:
        pv = ProductVariant(product_id=product_id, **data)
        self.db.add(pv)
        self.db.commit()
        return pv

    # --- Hybrid/Dropshipping Core ---
    def create_from_master(self, master_id: int, store_id: int, overrides: dict = None) -> Product:
        master = self.db.get(MasterProduct, master_id)
        if not master: raise ValueError("Master Product not found")
        
        store = self.db.get(Store, store_id)
        if not store: raise ValueError("Store not found")
        
        # Plan Enforcement
        if store.vendor and store.vendor.plan:
            current_count = self.db.query(Product).filter(Product.store_id == store_id).count()
            if current_count >= store.vendor.plan.max_products:
                raise ValueError("Plan limit reached. Please upgrade.")

        listing = Product(
            store_id=store_id,
            master_product_id=master.id,
            name=overrides.get("name", master.name) if overrides else master.name,
            description=overrides.get("description", master.description) if overrides else master.description,
            price=overrides.get("price", 0.0) if overrides else 0.0,
            inventory=overrides.get("inventory", 0) if overrides else 0,
            category=master.category,
            status="published",
            moderation_status=self._get_initial_moderation_status(store_id)
        )
        self.db.add(listing)
        self.db.commit()
        return listing

    def update_moderation_status(self, product_ids: List[int], status: str, reason: str = None) -> int:
        count = self.db.query(Product).filter(Product.id.in_(product_ids)).update(
            {Product.moderation_status: status, Product.rejection_reason: reason},
            synchronize_session=False
        )
        self.db.commit()
        return count
