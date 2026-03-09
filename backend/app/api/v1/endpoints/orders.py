from fastapi import APIRouter, Depends, HTTPException, Request, Body
from typing import List
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.v1.schemas import OrderCreate, OrderResponse, OrderPreviewRequest, OrderPreviewResponse
from app.api.v1.dependencies import get_current_user
from app.core.rate_limiter import limiter
from app.decorators.monitor import log_and_time
from app.decorators.audit import audit
from app.decorators.sanitize import sanitize_inputs
from app.services.order_service import OrderService

router = APIRouter(prefix="/orders", tags=["orders"])


@router.post("/calculate-preview", response_model=OrderPreviewResponse)
def calculate_preview(
    payload: OrderPreviewRequest,
    db: Session = Depends(get_db),
):
    """Get real-time calculation for checkout without creating an order."""
    service = OrderService(db)
    try:
        preview = service.calculate_order_preview(
            items_in=[item.dict() for item in payload.items],
            shipping_address=payload.shipping_address,
            coupon_code=payload.coupon_code,
        )
        return preview
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.post("/", response_model=OrderResponse)
@log_and_time
@audit("order.create")
@limiter.limit("10/minute")
@sanitize_inputs
def create_order(
    request: Request,
    payload: dict = Body(...),
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    """Accept raw payload so we can normalize legacy `address` string into
    `shipping_address` dict before validating with `OrderCreate`.
    """
    # Normalize address field: if `shipping_address` absent but `address` is
    # present as a string, convert it to a minimal dict.
    if payload.get("shipping_address") is None and "address" in payload:
        addr = payload.get("address")
        if isinstance(addr, str):
            payload["shipping_address"] = {"line1": addr}
        elif isinstance(addr, dict):
            payload["shipping_address"] = addr

    # Validate/construct OrderCreate using pydantic
    try:
        # pydantic v2 model validation entrypoint
        order_in = (
            OrderCreate.model_validate(payload)
            if hasattr(OrderCreate, "model_validate")
            else OrderCreate(**payload)
        )
    except Exception as exc:
        raise HTTPException(status_code=422, detail=str(exc))

    service = OrderService(db)
    try:
        order = service.create_order(
            user_id=user.id,
            items=[
                item.model_dump() if hasattr(item, "model_dump") else item.dict()
                for item in order_in.items
            ],
            shipping_address=order_in.shipping_address,
            coupon_code=getattr(order_in, "coupon_code", None),
            affiliate_id=getattr(order_in, "affiliate_id", None),
        )
        # Send confirmation email
        try:
            from app.services.email_service import send_order_confirmation_email
            import threading
            threading.Thread(
                target=send_order_confirmation_email, 
                args=(user.email, str(order.id), float(order.total_amount))
            ).start()
        except Exception as e:
            import logging
            logging.getLogger(__name__).error(f"Failed to queue order confirmation email: {e}")

        return order
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.post("/hybrid")
@log_and_time
@audit("order.hybrid_create")
@limiter.limit("10/minute")
@sanitize_inputs
def create_hybrid_order(
    request: Request,
    payload: dict = Body(...),
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    """Create a Direct WhatsApp Order (Reserves inventory & returns reference)."""
    try:
        from app.api.v1.schemas import HybridOrderCreate
        order_in = HybridOrderCreate(**payload)
    except Exception as exc:
        raise HTTPException(status_code=422, detail=str(exc))

    service = OrderService(db)
    try:
        order = service.create_hybrid_order(
            user_id=user.id,
            product_id=order_in.product_id,
            supplier_id=order_in.supplier_id,
            quantity=order_in.quantity,
            price=order_in.price
        )
        return {"order_id": order.id, "status": order.status}
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.get("/{order_id}", response_model=OrderResponse)
@log_and_time
@limiter.limit("20/minute")
def get_order(
    order_id: int,
    request: Request,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    service = OrderService(db)
    order = service.get_by_id(order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    # Ensure users can only fetch their own orders (or admin can fetch any)
    if order.user_id != user.id and user.role != "admin":
        raise HTTPException(status_code=403, detail="Access denied")
    return order


@router.get("/", response_model=List[OrderResponse])
@log_and_time
@limiter.limit("20/minute")
def list_orders(
    request: Request,
    limit: int = 20,
    offset: int = 0,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    """Return a paginated list of orders for the current user.

    Admins can pass `limit` and `offset` as query parameters; non-admin users
    only get their own orders.
    """
    service = OrderService(db)
    orders = service.get_user_orders(user_id=user.id, limit=limit, offset=offset)
    return orders
