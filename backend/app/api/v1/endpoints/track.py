from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.affiliate import Affiliate

router = APIRouter(prefix="/track", tags=["tracking"])

@router.get("/ref/{code}")
def track_affiliate_visit(code: str, db: Session = Depends(get_db)):
    """
    Public endpoint to track an affiliate visit.
    GET /api/v1/track/ref/{code}
    """
    affiliate = db.query(Affiliate).filter(
        Affiliate.referral_code == code,
        Affiliate.is_active == True
    ).first()
    
    if not affiliate:
        # Return success: false or similar if not found, but don't error
        return {"success": False, "message": "Invalid code"}
    
    # Increment clicks
    affiliate.total_clicks += 1
    db.commit()
    
    return {
        "success": True,
        "affiliate_id": affiliate.id,
        "referral_code": affiliate.referral_code
    }
