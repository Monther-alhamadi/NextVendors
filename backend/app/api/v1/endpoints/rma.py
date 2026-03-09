from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api.v1 import dependencies as deps
from app.models.return_request import ReturnRequest
from app.api.v1.schemas import ReturnRequestCreate, ReturnRequestResponse
from app.models.user import User

router = APIRouter()

@router.post("/", response_model=ReturnRequestResponse)
def create_return_request(
    rma_in: ReturnRequestCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Create a new return request.
    """
    # Verify order belongs to user
    from app.models.order import Order
    order = db.query(Order).filter(Order.id == rma_in.order_id, Order.user_id == current_user.id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found or not owned by user")
    
    # Find matching order item
    target_item = None
    for item in order.items:
        if item.product_id == rma_in.product_id:
            target_item = item
            break
            
    if not target_item:
        raise HTTPException(status_code=400, detail="Product not found in this order")

    # Create RMA
    rma = ReturnRequest(
        user_id=current_user.id,
        order_id=rma_in.order_id,
        order_item_id=target_item.id,
        reason=rma_in.reason,
        status="pending",
        refund_amount=rma_in.amount
    )
    db.add(rma)
    db.commit()
    db.refresh(rma)
    
    # Ad-hoc fix for response schema: inject product_id from input since model might not have it directly on property
    rma.product_id = rma_in.product_id
    
    return rma

@router.get("/all", response_model=List[ReturnRequestResponse])
def list_all_rmas(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.require_role("admin")) # Admin only
):
    """
    List all return requests (Admin only).
    """
    results = db.query(ReturnRequest).all()
    # Populate product_id for response schema
    for r in results:
        if r.order_item:
            r.product_id = r.order_item.product_id
    return results

@router.get("/my", response_model=List[ReturnRequestResponse])
def list_my_rmas(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    List current user's return requests.
    """
    results = db.query(ReturnRequest).filter(ReturnRequest.user_id == current_user.id).all()
    for r in results:
        if r.order_item:
            r.product_id = r.order_item.product_id
    return results

@router.post("/{rma_id}/process", response_model=dict)
def process_rma_request(
    rma_id: int,
    action: dict, # {"action": "approve" | "reject"}
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.require_role("admin"))
):
    """
    Approve or Reject an RMA request.
    On approve: credit customer wallet + restock product inventory.
    """
    rma = db.query(ReturnRequest).filter(ReturnRequest.id == rma_id).first()
    if not rma:
        raise HTTPException(status_code=404, detail="RMA not found")
    
    act = action.get("action")
    if act == "approve":
        rma.status = "approved"

        # 1. Credit refund to customer's wallet
        if rma.refund_amount and rma.refund_amount > 0:
            from app.models.wallet import UserWallet
            wallet = db.query(UserWallet).filter(
                UserWallet.user_id == rma.user_id
            ).first()
            if wallet:
                wallet.balance = (wallet.balance or 0) + rma.refund_amount
            else:
                wallet = UserWallet(
                    user_id=rma.user_id,
                    balance=rma.refund_amount,
                    pending_balance=0,
                )
                db.add(wallet)

        # 2. Restock inventory
        if rma.order_item:
            from app.models.product import Product
            product = db.query(Product).filter(
                Product.id == rma.order_item.product_id
            ).first()
            if product and product.inventory is not None:
                product.inventory += rma.order_item.quantity

    elif act == "reject":
        rma.status = "rejected"
    else:
        raise HTTPException(status_code=400, detail="Invalid action")
    
    db.commit()
    return {
        "status": "ok",
        "new_status": rma.status,
        "refund_amount": float(rma.refund_amount or 0) if act == "approve" else 0,
    }

