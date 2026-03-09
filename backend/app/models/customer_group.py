from sqlalchemy import Column, Integer, String, Float
from sqlalchemy.orm import relationship
from app.models.base import SQLAlchemyBaseModel
from app.core.database import Base

class CustomerGroup(SQLAlchemyBaseModel, Base):
    __tablename__ = "customer_groups"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False) # VIP, Wholesale, New
    
    default_discount_percent = Column(Float, default=0.0)
    
    # Could add criteria for auto-joining later

    users = relationship("User", back_populates="customer_group")
