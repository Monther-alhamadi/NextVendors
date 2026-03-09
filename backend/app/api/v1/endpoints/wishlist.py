from fastapi import APIRouter, Depends, Body, Request
from typing import List, Union
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.v1.dependencies import get_current_user
from app.models.wishlist import Wishlist

router = APIRouter(prefix="/wishlist", tags=["wishlist"])


@router.get("/", response_model=List[dict])
def get_wishlist(db: Session = Depends(get_db), user=Depends(get_current_user)):
    w = db.query(Wishlist).filter(Wishlist.user_id == user.id).one_or_none()
    if not w:
        return []
    return w.items


@router.post("/", status_code=204)
def replace_wishlist(
    request: Request,
    items: Union[List[dict], dict] = Body(...),
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    # Normalize payload: accept either {"items": [...]} or a bare list or single item
    payload = items
    if isinstance(payload, dict) and "items" in payload:
        payload = payload.get("items")

    if not isinstance(payload, list):
        if isinstance(payload, dict):
            payload = [payload]
        else:
            raise ValueError("Invalid wishlist payload")

    w = db.query(Wishlist).filter(Wishlist.user_id == user.id).one_or_none()
    if not w:
        w = Wishlist(user_id=user.id, items=payload)
        db.add(w)
    else:
        w.items = payload
    db.commit()
    return None


@router.delete("/", status_code=204)
def clear_wishlist(db: Session = Depends(get_db), user=Depends(get_current_user)):
    w = db.query(Wishlist).filter(Wishlist.user_id == user.id).one_or_none()
    if w:
        db.delete(w)
        db.commit()
    return None
