from sqlalchemy import Column, Integer, Float, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import SQLAlchemyBaseModel
from app.core.database import Base


class OrderItem(SQLAlchemyBaseModel, Base):
    __tablename__ = "order_items"

    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, nullable=False, default=1)
    unit_price = Column(Float, nullable=False)

    # Reseller Fields (Margin Tracking)
    vendor_id = Column(Integer, nullable=True)  # FK logic handled loosely or via service
    cost_price = Column(Float, default=0.0) # Price for supplier
    commission_rate = Column(Float, default=0.0)
    commission_amount = Column(Float, default=0.0)
    affiliate_commission = Column(Float, default=0.0)

    fulfillment_order_id = Column(Integer, ForeignKey("fulfillment_orders.id"), nullable=True)
    fulfillment_order = relationship("FulfillmentOrder", back_populates="items")

    order = relationship("Order", back_populates="items")

    # Avoid declaring a relationship to `Product` at import-time to prevent
    # mapper resolution errors in environments where models are imported
    # in an unpredictable order during test startup. Use a runtime lookup
    # via the session when the Product object is needed.

    def get_product(self):
        try:
            from sqlalchemy.orm import object_session

            sess = object_session(self)
            if sess is None:
                return None
            from app.models.product import Product

            return sess.query(Product).filter(Product.id == self.product_id).first()
        except Exception:
            return None

    @property
    def subtotal(self) -> float:
        return self.quantity * self.unit_price
