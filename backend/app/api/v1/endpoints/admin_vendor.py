from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.api.v1.dependencies import get_current_user, get_db, require_permission
from app.services.admin_vendor_service import AdminVendorService
from app.models.user import User
from pydantic import BaseModel

router = APIRouter()

class KYCReviewRequest(BaseModel):
    vendor_id: int
    approved: bool
    rejection_reason: str = None

class BanRequest(BaseModel):
    ban: bool

@router.get("/stats")
def get_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("manage_vendors"))
):
    return AdminVendorService.get_vendor_stats(db)

@router.post("/kyc/review")
def review_kyc(
    request: KYCReviewRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("manage_vendors"))
):
    if request.approved:
        return AdminVendorService.approve_kyc(db, request.vendor_id, current_user.id)
    else:
        if not request.rejection_reason:
            raise HTTPException(status_code=400, detail="Rejection reason required")
        return AdminVendorService.reject_kyc(db, request.vendor_id, request.rejection_reason, current_user.id)

@router.post("/{vendor_id}/ban")
def ban_vendor(
    vendor_id: int,
    request: BanRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("manage_vendors"))
):
    return AdminVendorService.toggle_ban(db, vendor_id, request.ban, current_user.id)

@router.get("/{vendor_id}/audit-logs")
def get_vendor_audit_logs(
    vendor_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("manage_vendors"))
):
    from app.models.audit_log import SystemAuditLog
    logs = db.query(SystemAuditLog).filter(
        SystemAuditLog.target_type == "vendor",
        SystemAuditLog.target_id == str(vendor_id)
    ).order_by(SystemAuditLog.created_at.desc()).all()
    return logs

@router.get("/ads")
def list_vendor_ads(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("manage_vendors"))
):
    from app.services.ad_service import AdService
    return AdService(db).get_all_admin_ads()

class AdStatusUpdate(BaseModel):
    status: str
    is_paid: bool = None

@router.put("/ads/{ad_id}/status")
def update_ad_status(
    ad_id: int,
    data: AdStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("manage_vendors"))
):
    from app.services.ad_service import AdService
    ad = AdService(db).update_ad_status(ad_id, status=data.status, is_paid=data.is_paid)
    if not ad:
        raise HTTPException(status_code=404, detail="Ad request not found")
    return ad
