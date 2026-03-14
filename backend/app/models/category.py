from sqlalchemy import Column, String, Float
from app.models.base import SQLAlchemyBaseModel
from app.core.database import Base
from app.models.product_category import product_categories  # noqa: F401


class Category(SQLAlchemyBaseModel, Base):
    __tablename__ = "categories"

    name = Column(String(128), unique=True, nullable=False)
    name_en = Column(String(128), unique=True, nullable=True)
    description = Column(String(255), default="")
    description_en = Column(String(255), nullable=True)
    commission_rate = Column(Float, nullable=True) # Override platform default if set

    # Omit declarative many-to-many relationship to Product to avoid
    # import-order and mapper configuration issues during tests. Use
    # explicit joins against `product_categories` when category-product
    # associations are required.
