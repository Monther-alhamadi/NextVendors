from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.analytics_service import AnalyticsService
from app.api.v1.dependencies import require_role, get_current_user
from app.api.v1 import schemas
from app.models.user import User
from app.models.supplier import Supplier

from app.services.financial_service import FinancialService as FinancialBI

router = APIRouter(prefix="/analytics", tags=["analytics"])


# ═══════════════════════════════════════════════════════════════
#  ADMIN ANALYTICS — Comprehensive with real growth %
# ═══════════════════════════════════════════════════════════════

@router.get("/admin")
def get_admin_analytics(
    period: str = Query("monthly", regex="^(daily|weekly|monthly|yearly)$"),
    db: Session = Depends(get_db),
    _u=Depends(require_role("admin")),
):
    """
    Comprehensive admin analytics with real growth calculations.
    Returns: GMV, profit, order count, growth %, sales chart, 
    recent orders, top vendors.
    """
    service = AnalyticsService(db)
    return service.get_admin_analytics(period)


@router.get("/admin/activity")
def get_admin_activity_feed(
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    _u=Depends(require_role("admin")),
):
    """Real activity feed from orders, vendors, and products."""
    service = AnalyticsService(db)
    return service.get_recent_activities(limit)


# ═══════════════════════════════════════════════════════════════
#  VENDOR DASHBOARD
# ═══════════════════════════════════════════════════════════════

@router.get("/vendor/dashboard")
def get_vendor_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Return real vendor dashboard data: earnings, charts, top products,
    recent activities, and low stock alerts.
    """
    vendor = db.query(Supplier).filter(Supplier.owner_id == current_user.id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="No vendor profile found for this user")

    service = AnalyticsService(db)
    stats = service.get_vendor_stats(vendor.id)

    # Active orders count
    from app.models.fulfillment_order import FulfillmentOrder
    from sqlalchemy import func
    active_orders = db.query(func.count(FulfillmentOrder.id)).filter(
        FulfillmentOrder.vendor_id == vendor.id,
        FulfillmentOrder.status.in_(["pending", "processing", "shipped"]),
    ).scalar() or 0

    # Recent activities (last 10 fulfillment orders)
    recent = (
        db.query(FulfillmentOrder)
        .filter(FulfillmentOrder.vendor_id == vendor.id)
        .order_by(FulfillmentOrder.created_at.desc())
        .limit(10)
        .all()
    )
    activities = []
    for fo in recent:
        activities.append({
            "id": fo.id,
            "type": "order",
            "text": f"طلب #{fo.order_id}",
            "status": fo.status,
            "amount": float(fo.total_vendor_share or 0),
            "time": fo.created_at.isoformat() if fo.created_at else None,
        })

    return {
        **stats,
        "active_orders": active_orders,
        "recent_activities": activities,
        "store_name": vendor.name,
    }


# ═══════════════════════════════════════════════════════════════
#  EXISTING ENDPOINTS (kept for backward compat)
# ═══════════════════════════════════════════════════════════════

@router.get("/dashboard")
def get_dashboard_metrics(db: Session = Depends(get_db), _u=Depends(require_role("admin"))):
    service = AnalyticsService(db)
    return service.get_dashboard_stats()


@router.get("/reports/financial", response_model=schemas.FinancialSummary)
def get_financial_report(
    period: str = "monthly",
    db: Session = Depends(get_db),
    _u=Depends(require_role("admin")),
):
    service = FinancialBI(db)
    return service.get_financial_summary(period)


@router.get("/reports/charts", response_model=List[schemas.TimeSeriesItem])
def get_chart_data(
    days: int = 30,
    db: Session = Depends(get_db),
    _u=Depends(require_role("admin")),
):
    service = FinancialBI(db)
    return service.get_sales_chart_data(days)


@router.get("/reports/vendors")
def get_vendor_performance(
    limit: int = 5,
    db: Session = Depends(get_db),
    _u=Depends(require_role("admin")),
):
    service = FinancialBI(db)
    return service.get_top_performing_vendors(limit)


@router.get("/ecosystem")
def get_ecosystem_health(
    db: Session = Depends(get_db),
    _u=Depends(require_role("admin")),
):
    service = AnalyticsService(db)
    return service.get_ecosystem_health()
