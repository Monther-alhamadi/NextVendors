from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.api.v1.dependencies import require_role
from app.services.wallet_service import WalletService
from pydantic import BaseModel
from datetime import datetime

router = APIRouter(prefix="/admin/payouts", tags=["admin-payouts"])

class PayoutResponse(BaseModel):
    id: int
    user_id: int
    amount: float
    status: str
    method: str
    details: Optional[dict] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class RejectRequest(BaseModel):
    reason: Optional[str] = None

@router.get("/", response_model=List[PayoutResponse])
def list_payouts(
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    _admin=Depends(require_role("admin"))
):
    """List all vendor/affiliate payout requests."""
    return WalletService.list_payout_requests(db, status=status)

@router.post("/{payout_id}/approve", response_model=PayoutResponse)
def approve_payout(
    payout_id: int,
    db: Session = Depends(get_db),
    _admin=Depends(require_role("admin"))
):
    """Approve a payout request and mark it as completed."""
    try:
        return WalletService.approve_payout(db, payout_id)
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{payout_id}/reject", response_model=PayoutResponse)
def reject_payout(
    payout_id: int,
    request: RejectRequest,
    db: Session = Depends(get_db),
    _admin=Depends(require_role("admin"))
):
    """Reject a payout request and return funds to user balance."""
    try:
        return WalletService.reject_payout(db, payout_id, reason=request.reason)
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
