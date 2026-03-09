from decimal import Decimal, ROUND_HALF_EVEN
from typing import Optional, Tuple
from app.models.tax_rate import TaxRate
from app.core.config import settings


class PricingService:
    """Service to compute pricing and tax for products."""

    def __init__(self, db):
        self.db = db

    def get_default_tax_rate(self) -> float:
        """Return the default tax rate as a decimal."""
        from app.services.tax_service import TaxService
        return TaxService(self.db).get_tax_rate()

    def get_tax_for_address(self, address: dict | None) -> float:
        """Return applicable tax rate percentage for a shipping address dict.
        
        NOTE: Returns value as percentage (e.g. 15.0) to match compute_line_price expectation.
        """
        from app.services.tax_service import TaxService
        country = address.get("country") if address else None
        region = address.get("region") or address.get("state") if address else None
        
        # TaxService returns decimal, we want percentage here for legacy compatibility
        return TaxService(self.db).get_tax_rate(country, region) * 100.0

    def create_tax_rate(
        self,
        name: str,
        rate: float,
        country: str | None = None,
        region: str | None = None,
        postal_code_pattern: str | None = None,
        priority: int = 0,
        override: bool = False,
        active: bool = True,
    ):
        tr = TaxRate(
            name=name,
            rate=float(rate),
            country=country,
            region=region,
            postal_code_pattern=postal_code_pattern,
            priority=int(priority),
            override=bool(override),
            active=bool(active),
        )
        self.db.add(tr)
        self.db.commit()
        return tr

    def get_tax_rate_by_id(self, tax_id: int) -> Optional[TaxRate]:
        try:
            return self.db.query(TaxRate).filter(TaxRate.id == int(tax_id)).first()
        except Exception:
            return None

    def update_tax_rate(self, tax_id: int, **fields) -> Optional[TaxRate]:
        tr = self.get_tax_rate_by_id(tax_id)
        if not tr:
            return None
        for k, v in fields.items():
            if hasattr(tr, k):
                setattr(tr, k, v)
        self.db.commit()
        return tr

    def delete_tax_rate(self, tax_id: int) -> bool:
        tr = self.get_tax_rate_by_id(tax_id)
        if not tr:
            return False
        try:
            self.db.delete(tr)
            self.db.commit()
            return True
        except Exception:
            return False

    def list_active_rates(self):
        try:
            return self.db.query(TaxRate).filter(TaxRate.active).all()
        except Exception:
            return []

    def get_tax_for_country(self, country: str) -> Optional[TaxRate]:
        try:
            return (
                self.db.query(TaxRate)
                .filter(TaxRate.country == country, TaxRate.active)
                .first()
            )
        except Exception:
            return None

    def quantize(self, value: float, places: int = 2) -> float:
        d = Decimal(str(value)).quantize(
            Decimal((0, (1,), -places)), rounding=ROUND_HALF_EVEN
        )
        return float(d)

    def compute_line_price(
        self,
        unit_price: float,
        quantity: int = 1,
        prices_include_tax: bool = False,
        tax_rate: Optional[float] = None,
    ) -> Tuple[float, float]:
        """Return (line_subtotal_excluding_tax, tax_amount)

        - unit_price: stored base price (assumed without discounts)
        - prices_include_tax: if True, unit_price already includes tax
        - tax_rate: percentage (e.g., 20.0)
        """
        if tax_rate is None:
            tax_rate = self.get_default_tax_rate()

        qty = int(quantity or 1)
        if prices_include_tax:
            # Extract tax portion from an inclusive price
            divisor = 1 + (float(tax_rate) / 100.0)
            net_unit = float(unit_price) / divisor
            tax_unit = float(unit_price) - net_unit
        else:
            net_unit = float(unit_price)
            tax_unit = net_unit * (float(tax_rate) / 100.0)

        subtotal = net_unit * qty
        tax_total = tax_unit * qty

        return (self.quantize(subtotal), self.quantize(tax_total))


__all__ = ["PricingService"]
