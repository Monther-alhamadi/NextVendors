from sqlalchemy import Column, Integer, String, Boolean, JSON, TIMESTAMP
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.models.base import SQLAlchemyBaseModel
from app.core.database import Base

class MasterProduct(SQLAlchemyBaseModel, Base):
    __tablename__ = "master_products"

    id = Column(Integer, primary_key=True, index=True)
    sku = Column(String(100), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False, index=True)
    brand = Column(String(100), index=True)
    description = Column(String(2000))
    
    # Technical Specs (e.g., {"weight": "1kg", "dimensions": "10x10x10"})
    specs = Column(JSON, default={})
    
    category = Column(String(100), index=True)
    is_active = Column(Boolean, default=True)
    
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    # Relationships
    vendor_listings = relationship("Product", back_populates="master_product")

    def __repr__(self):
        return f"<MasterProduct {self.sku} - {self.name}>"
