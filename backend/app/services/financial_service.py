from sqlalchemy.orm import Session
from sqlalchemy import func, desc, and_
from datetime import datetime, timedelta
from typing import List, Dict, Any
from app.models.order import Order, OrderStatus
from app.models.order_item import OrderItem
from app.models.vendor_ledger import VendorLedger
from app.models.supplier import Supplier
from app.api.v1 import schemas

class FinancialService:
    def __init__(self, db: Session):
        self.db = db

    def get_period_bounds(self, period: str):
        now = datetime.utcnow()
        if period == "daily":
            start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        elif period == "weekly":
            start = now - timedelta(days=now.weekday())
            start = start.replace(hour=0, minute=0, second=0, microsecond=0)
        elif period == "monthly":
            start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        elif period == "yearly":
            start = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
        else: # Default 30 days
            start = now - timedelta(days=30)
        return start, now

    def get_financial_summary(self, period: str = "monthly") -> schemas.FinancialSummary:
        start, end = self.get_period_bounds(period)
        
        # GMV and Order Count
        order_stats = (
            self.db.query(
                func.sum(Order.total_amount).label('gmv'),
                func.count(Order.id).label('count')
            )
            .filter(Order.created_at >= start)
            .filter(Order.status != OrderStatus.cancelled)
            .first()
        )
        
        gmv = float(order_stats.gmv or 0.0)
        count = int(order_stats.count or 0)
        
        # Vendor Costs (Credits in Ledger)
        vendor_costs = (
            self.db.query(func.sum(VendorLedger.amount))
            .filter(VendorLedger.created_at >= start)
            .filter(VendorLedger.transaction_type == 'SALE')
            .scalar()
        ) or 0.0
        
        return schemas.FinancialSummary(
            gmv=gmv,
            vendor_costs=float(vendor_costs),
            platform_revenue=gmv - float(vendor_costs),
            order_count=count,
            period=period
        )

    def get_sales_chart_data(self, days: int = 30) -> List[schemas.TimeSeriesItem]:
        start = datetime.utcnow() - timedelta(days=days)
        
        query = (
            self.db.query(
                func.date(Order.created_at).label('date'),
                func.sum(Order.total_amount).label('value')
            )
            .filter(Order.created_at >= start)
            .filter(Order.status != OrderStatus.cancelled)
            .group_by(func.date(Order.created_at))
            .order_by(func.date(Order.created_at))
            .all()
        )
        
        return [schemas.TimeSeriesItem(date=str(row.date), value=float(row.value or 0)) for row in query]

    def get_top_performing_vendors(self, limit: int = 5) -> List[Dict[str, Any]]:
        query = (
            self.db.query(
                VendorLedger.supplier_id,
                func.sum(VendorLedger.amount).label('revenue'),
                func.count(VendorLedger.id).label('sales_count')
            )
            .filter(VendorLedger.transaction_type == 'SALE')
            .group_by(VendorLedger.supplier_id)
            .order_by(desc('revenue'))
            .limit(limit)
            .all()
        )
        
        results = []
        for row in query:
            s = self.db.get(Supplier, row.supplier_id)
            results.append({
                "id": row.supplier_id,
                "name": s.name if s else "Unknown",
                "revenue": float(row.revenue or 0),
                "sales": int(row.sales_count or 0)
            })
        return results
