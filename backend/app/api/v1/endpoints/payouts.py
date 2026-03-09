from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from app.core.database import get_db
from app.api.v1.dependencies import require_role
from app.models.vendor_ledger import VendorLedger
from app.models.supplier import Supplier
from app.services.vendor_service import VendorService

router = APIRouter(prefix="/payouts", tags=["payouts"])

# --- Schemas ---
class PayoutCreate(BaseModel):
    supplier_id: int
    amount: float
    description: Optional[str] = "Manual Payout"
    reference_id: Optional[str] = None

class LedgerEntryResponse(BaseModel):
    id: int
    amount: float
    transaction_type: str
    description: str
    created_at: datetime
    reference_id: Optional[str] = None
    supplier_name: Optional[str] = None

class VendorBalanceResponse(BaseModel):
    supplier_id: int
    supplier_name: str
    supplier_code: Optional[str] = None
    balance: float
    last_payout: Optional[datetime] = None

# --- Endpoints ---

@router.get("/ledger", response_model=List[LedgerEntryResponse])
def get_global_ledger(limit: int = 100, db: Session = Depends(get_db), _u=Depends(require_role("admin"))):
    """Admin: Get all financial events across the platform."""
    entries = db.query(VendorLedger).order_by(VendorLedger.created_at.desc()).limit(limit).all()
    # Manual map to include supplier name
    out = []
    for e in entries:
        s = db.get(Supplier, e.supplier_id)
        out.append({
            "id": e.id,
            "amount": e.amount,
            "transaction_type": e.transaction_type,
            "description": e.description,
            "created_at": e.created_at,
            "reference_id": e.reference_id,
            "supplier_name": s.name if s else "System"
        })
    return out

@router.get("/balances", response_model=List[VendorBalanceResponse])
def get_all_vendor_balances(
    db: Session = Depends(get_db),
    _u=Depends(require_role("admin"))
):
    """Admin: Get current balance for all vendors."""
    # Group by supplier and sum amount
    results = (
        db.query(
            VendorLedger.supplier_id, 
            func.sum(VendorLedger.amount).label("balance"),
            func.max(VendorLedger.created_at).label("last_active")
        )
        .group_by(VendorLedger.supplier_id)
        .all()
    )
    
    # Map results to response, including suppliers with 0 balance if needed or just active ones
    # For now, let's fetch all suppliers and map the balances
    all_suppliers = db.query(Supplier).all()
    balance_map = {r.supplier_id: r.balance for r in results}
    
    out = []
    for s in all_suppliers:
        bal = balance_map.get(s.id, 0.0)
        # Find last payout time if needed (simple query modification or separate query)
        out.append({
            "supplier_id": s.id,
            "supplier_name": s.name,
            "supplier_code": s.code,
            "balance": bal # Positive means we owe them
        })
    return out

@router.post("/", response_model=LedgerEntryResponse)
def record_payout(
    payout: PayoutCreate,
    db: Session = Depends(get_db),
    _u=Depends(require_role("admin"))
):
    """Admin: Record a payment to a vendor (Debit)."""
    if payout.amount <= 0:
        raise HTTPException(status_code=400, detail="Payout amount must be positive")

    # Create Debit Entry (Negative amount)
    entry = VendorLedger(
        supplier_id=payout.supplier_id,
        amount=-payout.amount, # Debit
        transaction_type="PAYOUT",
        description=payout.description,
        reference_id=payout.reference_id
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    
    return {
        "id": entry.id,
        "amount": entry.amount,
        "transaction_type": entry.transaction_type,
        "description": entry.description,
        "created_at": entry.created_at,
        "reference_id": entry.reference_id
    }

@router.post("/charge-subscription", dependencies=[Depends(require_role("admin"))])
def charge_subscription(
    supplier_id: int,
    db: Session = Depends(get_db)
):
    """Admin: Charge the monthly subscription fee to a vendor."""
    vendor = db.get(Supplier, supplier_id)
    if not vendor or not vendor.subscription_plan_id:
        raise HTTPException(status_code=400, detail="Vendor not found or not on a subscription plan")
    
    from app.models.subscription_plan import SubscriptionPlan
    plan = db.get(SubscriptionPlan, vendor.subscription_plan_id)
    if not plan:
        raise HTTPException(status_code=400, detail="Subscription plan not found")
    
    # Create Debit Entry
    entry = VendorLedger(
        supplier_id=supplier_id,
        amount=-plan.monthly_price,
        transaction_type="SUBSCRIPTION_FEE",
        description=f"Monthly Fee for {plan.name} plan"
    )
    db.add(entry)
    db.commit()
    return {"status": "charged", "amount": plan.monthly_price}

@router.get("/supplier/{supplier_id}", response_model=List[LedgerEntryResponse])
def get_supplier_ledger(
    supplier_id: int,
    db: Session = Depends(get_db),
    _u=Depends(require_role("admin"))
):
    """Admin: Get detailed ledger for a specific supplier."""
    entries = (
        db.query(VendorLedger)
        .filter(VendorLedger.supplier_id == supplier_id)
        .order_by(VendorLedger.created_at.desc())
        .limit(100)
        .all()
    )
    return entries

@router.get("/my-balance")
def get_my_vendor_balance(
    db: Session = Depends(get_db),
    current_user = Depends(require_role("supplier"))
):
    """Vendor: Get my own wallet balance and stats."""
    if not current_user.suppliers:
         return {
             "supplier_id": None,
             "name": "Unknown",
             "balance": 0.0,
             "pending": 0.0,
             "total_payouts": 0.0,
         }
    
    supplier = current_user.suppliers[0]
    
    # Calculate Balance
    balance = db.query(func.sum(VendorLedger.amount)).filter(VendorLedger.supplier_id == supplier.id).scalar() or 0.0
    
    # Calculate Total Payouts
    total_payouts = db.query(func.sum(VendorLedger.amount))\
        .filter(VendorLedger.supplier_id == supplier.id)\
        .filter(VendorLedger.transaction_type == "PAYOUT")\
        .scalar() or 0.0
        
    return {
        "supplier_id": supplier.id,
        "name": supplier.name,
        "balance": float(balance),
        "pending": 0.0, # Placeholder for future logic
        "total_payouts": abs(float(total_payouts))
    }
