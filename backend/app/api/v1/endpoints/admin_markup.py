"""
Admin Markup Rules — CRUD endpoints for managing profit margin rules.

These rules are consumed by MarkupService to determine the sale price
for supplier products. Rules follow a 4-level priority:
  product > category > supplier > global
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from datetime import datetime

from app.core.database import get_db
from app.api.v1.dependencies import require_role
from app.decorators.audit import audit
from app.models.markup_rule import MarkupRule
from app.services.markup_service import MarkupService

router = APIRouter(prefix="/admin/markup-rules", tags=["admin-markup"])


# ─────────────────────────────────────────────────────────────────────────────
# LIST
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/")
def list_markup_rules(
    supplier_id: Optional[int] = None,
    category_id: Optional[int] = None,
    product_id:  Optional[int] = None,
    is_global:   Optional[bool] = None,
    db: Session = Depends(get_db),
    _admin=Depends(require_role("admin")),
):
    """List all markup rules with optional filters."""
    q = db.query(MarkupRule)

    if supplier_id is not None:
        q = q.filter(MarkupRule.supplier_id == supplier_id)
    if category_id is not None:
        q = q.filter(MarkupRule.category_id == category_id)
    if product_id is not None:
        q = q.filter(MarkupRule.product_id == product_id)
    if is_global is not None:
        q = q.filter(MarkupRule.is_global == is_global)

    return q.order_by(MarkupRule.id).all()


# ─────────────────────────────────────────────────────────────────────────────
# PREVIEW
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/preview")
def preview_markup(
    cost_price:  float,
    product_id:  Optional[int] = None,
    category_id: Optional[int] = None,
    supplier_id: Optional[int] = None,
    db: Session = Depends(get_db),
    _admin=Depends(require_role("admin")),
):
    """
    Preview the computed sale price for a given cost price and context.
    Useful to test rules before publishing.
    """
    svc = MarkupService(db)
    sale_price = svc.apply_markup(
        cost_price,
        product_id=product_id,
        category_id=category_id,
        supplier_id=supplier_id,
    )
    rule = svc.get_effective_rule(product_id, category_id, supplier_id)
    return {
        "cost_price":  cost_price,
        "sale_price":  sale_price,
        "margin":      round(sale_price - cost_price, 2),
        "margin_pct":  round((sale_price - cost_price) / cost_price * 100, 1),
        "applied_rule": {
            "id":           rule.id if rule else None,
            "type":         rule.markup_type if rule else "percentage",
            "value":        rule.markup_value if rule else 20.0,
            "scope":        (
                f"product={rule.product_id}" if rule and rule.product_id else
                f"category={rule.category_id}" if rule and rule.category_id else
                f"supplier={rule.supplier_id}" if rule and rule.supplier_id else
                "global (default 20%)"
            ),
        },
    }


# ─────────────────────────────────────────────────────────────────────────────
# CREATE
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/")
@audit("admin.markup_rule.create")
def create_markup_rule(
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
    _admin=Depends(require_role("admin")),
):
    """
    Create a markup rule.

    Example payload:
    ```json
    {
      "markup_type": "percentage",
      "markup_value": 25,
      "supplier_id": 3
    }
    ```
    Omit supplier_id / category_id / product_id and set is_global=true for a
    global fallback rule.
    """
    valid_fields = {c.name for c in MarkupRule.__table__.columns}
    data = {k: v for k, v in payload.items() if k in valid_fields}
    rule = MarkupRule(**data)
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return rule


# ─────────────────────────────────────────────────────────────────────────────
# UPDATE
# ─────────────────────────────────────────────────────────────────────────────

@router.put("/{rule_id}")
@audit("admin.markup_rule.update")
def update_markup_rule(
    rule_id: int,
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
    _admin=Depends(require_role("admin")),
):
    rule = db.query(MarkupRule).filter(MarkupRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Markup rule not found")

    payload.pop("id", None)
    payload["updated_at"] = datetime.utcnow()
    valid_fields = {c.name for c in MarkupRule.__table__.columns}
    for k, v in payload.items():
        if k in valid_fields:
            setattr(rule, k, v)

    db.commit()
    db.refresh(rule)
    return rule


# ─────────────────────────────────────────────────────────────────────────────
# DELETE
# ─────────────────────────────────────────────────────────────────────────────

@router.delete("/{rule_id}")
@audit("admin.markup_rule.delete")
def delete_markup_rule(
    rule_id: int,
    db: Session = Depends(get_db),
    _admin=Depends(require_role("admin")),
):
    rule = db.query(MarkupRule).filter(MarkupRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Markup rule not found")
    db.delete(rule)
    db.commit()
    return {"status": "ok", "deleted_id": rule_id}
