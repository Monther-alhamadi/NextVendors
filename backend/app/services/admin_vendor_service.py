from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.supplier import Supplier
from app.models.kyc import KYCDocument, KYCStatus
from app.models.store import Store
from app.models.audit_log import SystemAuditLog
import json

class AdminVendorService:
    @staticmethod
    def get_vendor_stats(db: Session):
        # Placeholder for complex aggregation
        total_vendors = db.query(Supplier).count()
        pending_kyc = db.query(Supplier).filter(Supplier.kyc_status == "pending").count()
        # total_gmv = db.query(func.sum(Order.total)).scalar()
        return {
            "total_vendors": total_vendors,
            "pending_kyc": pending_kyc,
            "total_gmv": 0.0 # Implement with Order query later
        }

    @staticmethod
    def approve_kyc(db: Session, vendor_id: int, admin_id: int):
        vendor = db.query(Supplier).filter(Supplier.id == vendor_id).first()
        if not vendor:
            raise HTTPException(status_code=404, detail="Vendor not found")
        
        old_status = vendor.kyc_status
        vendor.kyc_status = KYCStatus.APPROVED
        vendor.is_verified = True
        
        # Verify store if exists
        if vendor.store:
            vendor.store.is_verified = True
        
        # Log
        log = SystemAuditLog(
            user_id=admin_id,
            action="APPROVE_KYC",
            target_type="vendor",
            target_id=str(vendor_id),
            previous_value=json.dumps({"kyc_status": old_status}),
            new_value=json.dumps({"kyc_status": "approved"})
        )
        db.add(log)
        db.commit()
        db.refresh(vendor)
        return vendor

    @staticmethod
    def reject_kyc(db: Session, vendor_id: int, reason: str, admin_id: int):
        vendor = db.query(Supplier).filter(Supplier.id == vendor_id).first()
        if not vendor:
            raise HTTPException(status_code=404, detail="Vendor not found")
            
        old_status = vendor.kyc_status
        vendor.kyc_status = KYCStatus.REJECTED
        vendor.is_verified = False
        if vendor.store:
            vendor.store.is_verified = False
        
        # Log rejection
        log = SystemAuditLog(
            user_id=admin_id,
            action="REJECT_KYC",
            target_type="vendor",
            target_id=str(vendor_id),
            details=f"Reason: {reason}",
            previous_value=json.dumps({"kyc_status": old_status}),
            new_value=json.dumps({"kyc_status": "rejected"})
        )
        db.add(log)
        db.commit()
        return vendor

    @staticmethod
    def toggle_ban(db: Session, vendor_id: int, ban: bool, admin_id: int):
        vendor = db.query(Supplier).filter(Supplier.id == vendor_id).first()
        if not vendor:
            raise HTTPException(status_code=404, detail="Vendor not found")
            
        vendor.is_banned = ban
        if ban:
            vendor.status = "inactive"
            if vendor.store:
                vendor.store.is_active = False
        
        log = SystemAuditLog(
            user_id=admin_id,
            action="BAN_VENDOR" if ban else "UNBAN_VENDOR",
            target_type="vendor",
            target_id=str(vendor_id),
            new_value=json.dumps({"is_banned": ban})
        )
        db.add(log)
        db.commit()
        return vendor
