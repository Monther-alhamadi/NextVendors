from sqlalchemy.orm import Session
from app.models.tax_rate import TaxRate
from app.core.config import settings

class TaxService:
    def __init__(self, db: Session):
        self.db = db

    def get_tax_rate(self, country_code: str | None = None, region: str | None = None) -> float:
        """Find the applicable tax rate as a decimal (e.g. 0.15).
        
        Priority:
        1. Region + Country
        2. Country (global in country)
        3. Store Global (country is null/any)
        4. settings.DEFAULT_TAX_RATE
        """
        # 1. Try region-specific
        if country_code and region:
            rate = self.db.query(TaxRate).filter(
                TaxRate.country_code == country_code,
                TaxRate.region == region,
                TaxRate.is_active == True
            ).first()
            if rate:
                return float(rate.rate) / 100.0
        
        # 2. Try country-wide
        if country_code:
            rate = self.db.query(TaxRate).filter(
                TaxRate.country_code == country_code,
                TaxRate.is_active == True
            ).first()
            if rate:
                return float(rate.rate) / 100.0
            
        # 3. Try global (null country)
        global_rate = self.db.query(TaxRate).filter(
            TaxRate.country_code == None,
            TaxRate.is_active == True
        ).order_by(TaxRate.priority.desc()).first()
        
        if global_rate:
            return float(global_rate.rate) / 100.0
            
        # 4. Fallback to settings (ensure it's a decimal)
        default_rate = float(getattr(settings, "DEFAULT_TAX_RATE", 0.0))
        # If settings value is > 1.0, assume it's a percentage (legacy fix)
        if default_rate > 1.0:
            return default_rate / 100.0
        return default_rate

    def calculate_tax(self, amount: float, country_code: str | None = None, region: str | None = None) -> float:
        rate = self.get_tax_rate(country_code, region)
        return amount * rate
