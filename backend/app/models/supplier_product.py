from sqlalchemy import Column, Integer, ForeignKey, Float, String, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base


class SupplierProduct(Base):
    __tablename__ = "supplier_products"

    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=False, primary_key=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False, primary_key=True)
    
    # Core Reseller Fields
    inventory = Column(Integer, nullable=False, default=0)
    cost_price = Column(Float, nullable=False, default=0.0)
    currency = Column(String(3), nullable=False, default="USD")
    sku_vendor = Column(String(100), nullable=True)
    low_stock_threshold = Column(Integer, nullable=False, default=5)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    supplier = relationship("Supplier", back_populates="products")
    product = relationship("Product", back_populates="supplier_products")

    @property
    def vendor_name(self) -> str:
        if self.supplier:
            return self.supplier.name
        return "Unknown"


__all__ = ["SupplierProduct"]
