from fastapi import APIRouter, Depends, Body, Request
from sqlalchemy.orm import Session
from typing import List, Union
from app.core.database import get_db
from app.api.v1.dependencies import get_current_user
from app.models.cart import Cart

router = APIRouter(prefix="/cart", tags=["cart"])


@router.get("/", response_model=List[dict])
def get_cart(db: Session = Depends(get_db), user=Depends(get_current_user)):
    # Return the stored cart items for the current user
    cart = db.query(Cart).filter(Cart.user_id == user.id).one_or_none()
    if not cart:
        return []
    return cart.items


@router.put("/", status_code=204)
def replace_cart(
    request: Request,
    items: Union[List[dict], dict] = Body(...),
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    # Replace or create the cart for the current user
    # Normalize payload: accept either {"items": [...]} or a bare list
    payload = items
    if isinstance(payload, dict) and "items" in payload:
        payload = payload.get("items")

    if not isinstance(payload, list):
        # If single item dict provided, wrap in list
        if isinstance(payload, dict):
            payload = [payload]
        else:
            raise ValueError("Invalid cart payload")

    cart = db.query(Cart).filter(Cart.user_id == user.id).one_or_none()
    if not cart:
        cart = Cart(user_id=user.id, items=payload)
        db.add(cart)
    else:
        cart.items = payload
    db.commit()
    return None
