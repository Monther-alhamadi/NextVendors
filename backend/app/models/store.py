from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Text, Float
from sqlalchemy.orm import relationship
from app.models.base import SQLAlchemyBaseModel
from app.core.database import Base

class Store(SQLAlchemyBaseModel, Base):
    __tablename__ = "stores"

    id = Column(Integer, primary_key=True, index=True)
    vendor_id = Column(Integer, ForeignKey("suppliers.id"), nullable=False, unique=True)
    
    # Identity
    name = Column(String(100), nullable=False, index=True)
    slug = Column(String(120), unique=True, index=True, nullable=False)
    description = Column(Text, nullable=True)
    
    # Visuals & Elite Customization
    logo_url = Column(String(512), nullable=True)
    cover_image_url = Column(String(512), nullable=True)
    theme_color = Column(String(20), nullable=True) # Hex code e.g. #FF5733
    background_image_url = Column(String(512), nullable=True)
    store_ads = Column(Text, nullable=True) # JSON string array of image URLs/links for the store carousel
    announcement_text = Column(String(255), nullable=True)
    currency_display = Column(String(10), default="SAR") # Preferable display currency
    
    # Metric & Status
    rating = Column(Float, default=0.0)
    is_verified = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True) # Vacation mode or hidden
    
    # Monetization
    is_promoted = Column(Boolean, default=False, index=True) # Paid slot for Store Showcase

    # Relationships
    vendor = relationship("Supplier", back_populates="store")
    products = relationship("Product", back_populates="store", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Store {self.name}>"
