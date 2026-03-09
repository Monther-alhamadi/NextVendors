from sqlalchemy import Column, Integer, String, TIMESTAMP, ForeignKey
from sqlalchemy.sql import func
from app.models.base import SQLAlchemyBaseModel
from app.core.database import Base

class StockReservation(SQLAlchemyBaseModel, Base):
    __tablename__ = "stock_reservations"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False, index=True)
    variant_id = Column(Integer, ForeignKey("product_variants.id"), nullable=True)
    
    quantity = Column(Integer, nullable=False)
    session_id = Column(String(255), nullable=True) # For guest carts
    user_id = Column(Integer, nullable=True) # For logged in users
    
    expires_at = Column(TIMESTAMP, nullable=False, index=True)
    created_at = Column(TIMESTAMP, server_default=func.now())

    def __repr__(self):
        return f"<Reservation {self.id} - Prod: {self.product_id} Qty: {self.quantity}>"
