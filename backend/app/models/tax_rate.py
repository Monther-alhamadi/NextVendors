from sqlalchemy import Column, Integer, String, Float, Boolean, JSON
from app.models.base import SQLAlchemyBaseModel
from app.core.database import Base

class TaxRate(SQLAlchemyBaseModel, Base):
    __tablename__ = "tax_rates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), default="VAT")
    rate = Column(Float, nullable=False, default=15.0) # percentage, e.g. 15.0 for 15%
    
    country_code = Column(String(2), nullable=True, index=True) # e.g. "SA"
    region = Column(String(100), nullable=True) # e.g. "Riyadh" (Optional)
    
    priority = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    
    # Legacy alias support for PricingService
    @property
    def active(self):
        return self.is_active
    
    @active.setter
    def active(self, value):
        self.is_active = value

    def __repr__(self):
        return f"<TaxRate {self.name} {self.country_code}: {self.rate}>"
