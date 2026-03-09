from fastapi import APIRouter, Depends, Query, HTTPException, Request
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date, timedelta
from typing import List, Dict, Any

from app.core.database import get_db
from app.models.coupon import Coupon
from app.models.affiliate_stats import AffiliateStats
from app.api.v1.dependencies import get_current_user

from app.models.affiliate import Affiliate
from app.models.wallet import UserWallet

router = APIRouter(prefix="/affiliate", tags=["affiliate"])

@router.get("/me/stats")
def get_my_affiliate_stats(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get stats for the current logged-in user as an affiliate."""
    affiliate = db.query(Affiliate).filter(Affiliate.user_id == current_user.id).first()
    if not affiliate:
        raise HTTPException(status_code=404, detail="Affiliate profile not found")
    
    wallet = db.query(UserWallet).filter(UserWallet.user_id == current_user.id).first()
    
    return {
        "referral_code": affiliate.referral_code,
        "total_clicks": affiliate.total_clicks,
        "total_conversions": affiliate.total_conversions,
        "total_earnings": affiliate.total_earnings,
        "available_balance": wallet.balance if wallet else 0.0,
        "pending_balance": wallet.pending_balance if wallet else 0.0,
        "currency": "SAR"
    }

@router.post("/track")
def track_visit(code: str = Query(...), db: Session = Depends(get_db)):
    """
    Public endpoint to track a visit from a referral link.
    """
    # 1. Find coupon/code
    coupon = db.query(Coupon).filter(Coupon.code == code).first()
    if not coupon:
        # We don't error out on invalid codes to prevent enumeration, just ignore
        return {"status": "ignored"}
        
    # 2. Get today's stats record or create
    today = date.today()
    stats = db.query(AffiliateStats).filter(
        AffiliateStats.coupon_id == coupon.id,
        AffiliateStats.date == today
    ).first()
    
    if not stats:
        stats = AffiliateStats(coupon_id=coupon.id, date=today, visits=0, unique_visitors=0)
        db.add(stats)
    
    # 3. Increment
    stats.visits += 1
    # Simple unique check could go here (e.g. cookie check), for now simple increment
    db.commit()
    return {"status": "ok"}

@router.get("/dashboard")
def get_affiliate_dashboard(
    period: str = "7d", 
    db: Session = Depends(get_db), 
    current_user = Depends(get_current_user)
):
    """
    Get affiliate stats for the logged-in vendor.
    """
    # 1. Get vendor products/coupons
    # Assuming user is partial owner of some supplier or we look up their supplier
    if not current_user.suppliers:
        return []
        
    supplier_id = current_user.suppliers[0].id # simplified for single supplier
    
    # 2. Date range
    today = date.today()
    start_date = today - timedelta(days=7)
    if period == "30d":
        start_date = today - timedelta(days=30)
        
    # 3. Query stats joined with coupons owned by this supplier
    results = db.query(
        AffiliateStats.date,
        func.sum(AffiliateStats.visits).label("total_visits"),
        func.sum(AffiliateStats.unique_visitors).label("total_unique")
    ).join(Coupon, Coupon.id == AffiliateStats.coupon_id)\
     .filter(Coupon.supplier_id == supplier_id)\
     .filter(AffiliateStats.date >= start_date)\
     .group_by(AffiliateStats.date)\
     .order_by(AffiliateStats.date)\
     .all()
     
    return [
        {"date": str(r.date), "visits": r.total_visits, "unique": r.total_unique}
        for r in results
    ]
