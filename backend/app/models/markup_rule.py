"""
MarkupRule model — allows admins to configure flexible pricing margins.

Priority resolution (highest to lowest):
  1. product-level    → for a single product
  2. category-level   → for all products in a category
  3. supplier-level   → for all products from a supplier
  4. global           → fallback default (e.g. 20%)

The markup_service.py reads these rules and applies them when a supplier
product is listed or repriced.
"""

from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base


class MarkupRule(Base):
    __tablename__ = "markup_rules"

    id          = Column(Integer, primary_key=True, index=True)

    # Scope — at most one of these is set; the rest are NULL
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=True, index=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True, index=True)
    product_id  = Column(Integer, ForeignKey("products.id"), nullable=True, index=True)

    # If all three are NULL this is the global fallback rule
    is_global   = Column(Boolean, default=False, nullable=False)

    # Markup type: "percentage" or "fixed"
    markup_type = Column(String(20), default="percentage", nullable=False)

    # For percentage markup: 20 means +20%  →  price = cost * 1.20
    # For fixed markup:      5   means +5㊙️ →  price = cost + 5
    markup_value = Column(Float, default=20.0, nullable=False)

    # Optional: enforce a minimum sale price regardless of cost
    min_price   = Column(Float, nullable=True)

    is_active   = Column(Boolean, default=True)
    created_at  = Column(DateTime, default=datetime.utcnow)
    updated_at  = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships (optional, for convenience)
    supplier    = relationship("Supplier",  foreign_keys=[supplier_id], lazy="noload")
    product     = relationship("Product",   foreign_keys=[product_id],  lazy="noload")

    def __repr__(self):
        scope = (
            f"product={self.product_id}" if self.product_id else
            f"category={self.category_id}" if self.category_id else
            f"supplier={self.supplier_id}" if self.supplier_id else
            "global"
        )
        return f"<MarkupRule {self.id} [{scope}] {self.markup_type}={self.markup_value}>"
