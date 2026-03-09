from sqlalchemy import Column, Integer, String, Text, ForeignKey, Float, Boolean
from sqlalchemy.orm import relationship
from app.models.base import SQLAlchemyBaseModel
from app.core.database import Base


class Review(SQLAlchemyBaseModel, Base):
    __tablename__ = "reviews"
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    rating = Column(Float, default=5.0)
    title = Column(String(128), default="")
    content = Column(Text, default="")
    vendor_reply = Column(Text, default=None)
    is_verified = Column(Boolean, default=False)

    # Use back_populates to avoid creating a backref that may conflict
    # with defensive wiring in `app.models.__init__` which assigns
    # `Product.reviews` when available.
    product = relationship("Product", back_populates="reviews")
