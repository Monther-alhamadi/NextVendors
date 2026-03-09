from sqlalchemy import Column, Integer, String, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.models.base import SQLAlchemyBaseModel
from app.core.database import Base


class ProductImage(SQLAlchemyBaseModel, Base):
    __tablename__ = "product_images"

    product_id = Column(Integer, ForeignKey("products.id"))
    url = Column(String(1024))
    # Optional metadata inspired by richer platforms (e.g. Shuup)
    kind = Column(String(32), nullable=False, default="image")
    position = Column(Integer, nullable=False, default=0)
    public = Column(Boolean, nullable=False, default=True)
    is_primary = Column(Boolean, nullable=False, default=False)

    # Keep a simple relationship to Product but avoid declaring a back_populates
    # attribute here to prevent mapper ordering issues when Product.module is
    # imported without ProductImage being available. Use service-layer queries
    # for image loading in tests and runtime.
    product = relationship("Product")
