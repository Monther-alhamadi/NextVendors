from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from typing import Optional, TYPE_CHECKING
from app.models.base import SQLAlchemyBaseModel
from app.core.database import Base

if TYPE_CHECKING:
    from app.models.product_image import ProductImage
    from app.models.store import Store
    from app.models.master_product import MasterProduct

class Product(SQLAlchemyBaseModel, Base):
    __tablename__ = "products"

    id: int = Column(Integer, primary_key=True, index=True)
    
    # Ownership
    store_id = Column(Integer, ForeignKey("stores.id"), nullable=True, index=True) 
    # Nullable temporarily for migration, but logic should enforce it
    
    name: str = Column(String(255), nullable=False, index=True)
    name_en: Optional[str] = Column(String(255), nullable=True, index=True)
    description: Optional[str] = Column(String(1024), nullable=True)
    description_en: Optional[str] = Column(String(1024), nullable=True)
    price: float = Column(Float, nullable=False, default=0.0)
    
    # Sales & Ratings
    total_sales = Column(Integer, default=0)
    rating = Column(Float, default=0.0)
    
    # Inventory is now a CACHED TOTAL of all SupplierProduct.inventory or Store inventory. 
    inventory = Column(Integer, default=0)
    
    # SEO & Marketing
    seo_title = Column(String(255), nullable=True)
    seo_description = Column(String(512), nullable=True)
    
    # Advertising Logic
    is_sponsored = Column(Boolean, default=False, index=True)
    active_ad_campaign = Column(Boolean, default=False)
    
    # Relationships
    category: Optional[str] = Column(String(128), nullable=True, index=True)
    category_en: Optional[str] = Column(String(128), nullable=True, index=True)

    # Lifecycle
    status: str = Column(String(50), default="published", index=True) # draft, review, published, suspended
    vendor_notes: Optional[str] = Column(String(512), nullable=True)

    # Module 2: Hybrid & Inventory & Moderation
    master_product_id = Column(Integer, ForeignKey("master_products.id"), nullable=True)
    
    moderation_status = Column(String(20), default="pending", index=True) # pending, approved, rejected
    rejection_reason = Column(String(255), nullable=True)
    
    inventory_threshold = Column(Integer, default=5) # Low stock alert
    virtual_stock = Column(Integer, default=0) # Available stock (inventory - reserved)
    
    # Relationships
    master_product = relationship("MasterProduct", back_populates="vendor_listings")
    store = relationship("Store", back_populates="products")
    images = relationship("ProductImage", back_populates="product", cascade="all, delete-orphan")
    
    supplier_products = relationship("SupplierProduct", back_populates="product")
    variants = relationship("ProductVariant", back_populates="product", cascade="all, delete-orphan")
    variation_variables = relationship("ProductVariationVariable", back_populates="product", cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="product", cascade="all, delete-orphan")

    def is_available(self, quantity: int = 1) -> bool:
        return self.inventory >= quantity

    def update_inventory(self, delta: int) -> None:
        new = (self.inventory or 0) + int(delta)
        if new < 0:
            raise ValueError("Inventory cannot be negative")
        self.inventory = new

    def calculate_discount(self, percent: float) -> float:
        try:
            pct = float(percent)
        except Exception:
            pct = 0.0
        return (self.price or 0.0) * (pct / 100.0)


__all__ = ["Product"]
