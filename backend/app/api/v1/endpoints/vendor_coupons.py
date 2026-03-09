from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.database import get_db
from app.api.v1.dependencies import get_current_user
from app.models.user import User
from app.services.discount_service import DiscountService
from app.services.vendor_service import VendorService

router = APIRouter(prefix="/vendor/affiliate-coupons", tags=["vendor-coupons"])

class CouponCreate(BaseModel):
    code: str
    amount: float
    amount_type: str = "fixed" # fixed or percentage
    min_order_amount: Optional[float] = None
    expires_at: Optional[datetime] = None
    marketer_name: Optional[str] = None # Affiliate name

class CouponResponse(BaseModel):
    id: int
    code: str
    amount: float
    amount_type: str
    active: bool
    used_count: int
    marketer_name: Optional[str]
    model_config = {"from_attributes": True}

@router.get("/", response_model=List[CouponResponse])
def list_my_coupons(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Find vendor for this user
    vs = VendorService(db)
    # Assuming user can own multiple vendors, or we pick the first one for current context
    # ideally we should pass header 'X-Vendor-ID'. For now assume 1:1 or pick first.
    # We will pick the first confirmed vendor owned by user.
    stmt = vs.db.query(vs.model).filter(vs.model.owner_id == current_user.id).limit(1)
    vendor = stmt.first()
    
    if not vendor:
        raise HTTPException(status_code=403, detail="User is not a vendor")
        
    ds = DiscountService(db)
    return ds.list_coupons(supplier_id=vendor.id)

@router.post("/", response_model=CouponResponse)
def create_coupon(
    data: CouponCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    vs = VendorService(db)
    stmt = vs.db.query(vs.model).filter(vs.model.owner_id == current_user.id).limit(1)
    vendor = stmt.first()
    
    if not vendor:
        raise HTTPException(status_code=403, detail="User is not a vendor")
        
    ds = DiscountService(db)
    # Check uniqueness? DB constraints handle it, but we can check specifically for this vendor namespace if needed.
    # Actually code is unique globally in current model.
    existing = ds.get_by_code(data.code)
    if existing:
         raise HTTPException(status_code=400, detail="Coupon code already taken")
         
    coupon = ds.create_coupon(
        code=data.code,
        amount=data.amount,
        amount_type=data.amount_type,
        min_order_amount=data.min_order_amount,
        expires_at=data.expires_at,
        marketer_name=data.marketer_name,
        supplier_id=vendor.id,
        active=True
    )
    return coupon

@router.delete("/{id}")
def delete_coupon(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    vs = VendorService(db)
    stmt = vs.db.query(vs.model).filter(vs.model.owner_id == current_user.id).limit(1)
    vendor = stmt.first()
    if not vendor:
        raise HTTPException(status_code=403, detail="Not a vendor")

    ds = DiscountService(db)
    coupon = ds.get_by_id(id)
    if not coupon:
        raise HTTPException(status_code=404, detail="Coupon not found")
        
    if coupon.supplier_id != vendor.id:
        raise HTTPException(status_code=403, detail="Not your coupon")
        
    ds.delete_coupon(id)
    return {"status": "deleted"}
