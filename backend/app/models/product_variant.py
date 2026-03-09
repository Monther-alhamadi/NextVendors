from sqlalchemy import Column, Integer, String, Float, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.models.base import SQLAlchemyBaseModel
from app.core.database import Base


class ProductVariant(SQLAlchemyBaseModel, Base):
    __tablename__ = "product_variants"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    sku = Column(String(64), nullable=True, index=True)
    name = Column(String(255), nullable=True)
    price = Column(Float, nullable=False, default=0.0)
    inventory = Column(Integer, nullable=False, default=0)
    reserved_stock = Column(Integer, nullable=False, default=0) # Module 2 via StockReservation
    active = Column(Boolean, nullable=False, default=True)

    # Keep a light relationship back to Product to allow simple eager loading
    product = relationship("Product", back_populates="variants")


__all__ = ["ProductVariant"]
