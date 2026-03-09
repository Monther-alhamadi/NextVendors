from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.api.v1.schemas import OrderResponse
from app.api.v1.dependencies import require_role
from app.services.order_service import OrderService
from app.models.order import OrderStatus

router = APIRouter(prefix="/admin/orders", tags=["admin-orders"])

@router.get("/", response_model=List[OrderResponse])
def list_admin_orders(
    status: Optional[str] = Query(None),
    user_id: Optional[int] = Query(None),
    vendor_id: Optional[int] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    limit: int = Query(50),
    offset: int = Query(0),
    db: Session = Depends(get_db),
    _admin=Depends(require_role("admin"))
):
    """List all orders with advanced filtering for platform administrators."""
    service = OrderService(db)
    return service.get_admin_orders(
        limit=limit,
        offset=offset,
        status=status,
        user_id=user_id,
        vendor_id=vendor_id,
        date_from=date_from,
        date_to=date_to
    )

@router.post("/bulk-status")
def bulk_update_order_status(
    order_ids: List[int],
    status: str,
    db: Session = Depends(get_db),
    _admin=Depends(require_role("admin"))
):
    """Update the status of multiple orders at once."""
    service = OrderService(db)
    try:
        new_status = OrderStatus(status)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid status: {status}")
    
    updated_count = 0
    for oid in order_ids:
        try:
            service.update_order_status(oid, new_status)
            updated_count += 1
        except Exception as e:
            # Continue with others but log error
            pass
            
    return {"message": f"Successfully updated {updated_count} orders to {status}"}
@router.post("/{order_id}/refund")
def refund_order(
    order_id: int,
    db: Session = Depends(get_db),
    _admin=Depends(require_role("admin"))
):
    """Fully refund an order, reverse financial splits, and restock inventory."""
    service = OrderService(db)
    try:
        success = service.refund_order(order_id)
        return {"message": "Order successfully refunded", "success": success}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
