"""
MarkupService — resolves and applies profit margins for supplier products.

Priority (highest → lowest):
  1. Product-level rule  (product_id == product.id)
  2. Category-level rule (category_id == product.category_id)
  3. Supplier-level rule (supplier_id == supplier_product.supplier_id)
  4. Global fallback     (is_global == True)

Usage:
    svc = MarkupService(db)
    price = svc.apply_markup(cost_price=100, product_id=5, supplier_id=2)
    # → 120.0  (20% default markup)
"""

from typing import Optional
from sqlalchemy.orm import Session
from app.models.markup_rule import MarkupRule


class MarkupService:
    def __init__(self, db: Session) -> None:
        self.db = db

    # ─────────────────────────────────────────────────────────────────────
    # Public API
    # ─────────────────────────────────────────────────────────────────────

    def apply_markup(
        self,
        cost_price: float,
        *,
        product_id: int | None = None,
        category_id: int | None = None,
        supplier_id: int | None = None,
    ) -> float:
        """
        Return the sale price after applying the best matching markup rule.
        Falls back to 20% if no active rule is found.
        """
        rule = self._resolve_rule(product_id, category_id, supplier_id)
        return self._compute_price(cost_price, rule)

    def get_effective_rule(
        self,
        product_id: int | None = None,
        category_id: int | None = None,
        supplier_id: int | None = None,
    ) -> MarkupRule | None:
        """Expose the winning rule for inspection (e.g. admin preview)."""
        return self._resolve_rule(product_id, category_id, supplier_id)

    # ─────────────────────────────────────────────────────────────────────
    # Internals
    # ─────────────────────────────────────────────────────────────────────

    def _resolve_rule(
        self,
        product_id: int | None,
        category_id: int | None,
        supplier_id: int | None,
    ) -> MarkupRule | None:
        """Return the highest-priority active rule, or None for global default."""
        q = self.db.query(MarkupRule).filter(MarkupRule.is_active == True)

        # 1. Product-level
        if product_id is not None:
            rule = q.filter(MarkupRule.product_id == product_id).first()
            if rule:
                return rule

        # 2. Category-level
        if category_id is not None:
            rule = q.filter(
                MarkupRule.category_id == category_id,
                MarkupRule.product_id.is_(None),
            ).first()
            if rule:
                return rule

        # 3. Supplier-level
        if supplier_id is not None:
            rule = q.filter(
                MarkupRule.supplier_id == supplier_id,
                MarkupRule.product_id.is_(None),
                MarkupRule.category_id.is_(None),
            ).first()
            if rule:
                return rule

        # 4. Global fallback
        global_rule = q.filter(MarkupRule.is_global == True).first()
        return global_rule  # May be None → caller uses hardcoded 20%

    def _compute_price(self, cost: float, rule: MarkupRule | None) -> float:
        """Apply a markup rule to a cost price, returning the sale price."""
        if rule is None:
            # Fallback: 20% percentage markup
            return round(cost * 1.20, 2)

        if rule.markup_type == "fixed":
            price = cost + rule.markup_value
        else:
            # "percentage"
            price = cost * (1 + rule.markup_value / 100)

        # Enforce minimum price floor
        if rule.min_price is not None:
            price = max(price, rule.min_price)

        return round(price, 2)
