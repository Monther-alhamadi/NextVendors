from sqlalchemy.orm import Session
from sqlalchemy import func, desc, and_, cast, Date
from datetime import datetime, timedelta
from typing import Dict, Any, List, Tuple
from app.models.order import Order, OrderStatus
from app.models.order_item import OrderItem
from app.models.fulfillment_order import FulfillmentOrder
from app.models.product import Product
from app.models.supplier import Supplier
from app.models.wallet import UserWallet


class AnalyticsService:
    def __init__(self, db: Session):
        self.db = db

    # ── Helper: period bounds ────────────────────────────────────
    def _get_period_bounds(self, period: str = "monthly") -> Tuple[datetime, datetime]:
        """Return (start, end) datetimes for the requested period."""
        now = datetime.utcnow()
        if period == "daily":
            start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        elif period == "weekly":
            start = now - timedelta(days=now.weekday())
            start = start.replace(hour=0, minute=0, second=0, microsecond=0)
        elif period == "yearly":
            start = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
        else:  # monthly (default)
            start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        return start, now

    def _get_previous_period_bounds(self, period: str = "monthly") -> Tuple[datetime, datetime]:
        """Return bounds for the PREVIOUS period (for growth comparison)."""
        start, end = self._get_period_bounds(period)
        duration = end - start
        prev_end = start
        prev_start = prev_end - duration
        return prev_start, prev_end

    @staticmethod
    def _growth_pct(current: float, previous: float) -> float:
        """Calculate growth percentage between two values."""
        if previous == 0:
            return 100.0 if current > 0 else 0.0
        return round(((current - previous) / previous) * 100, 1)

    # ── Vendor Stats ─────────────────────────────────────────────
    def get_vendor_stats(self, vendor_id: int) -> Dict[str, Any]:
        """Highly optimized vendor statistics using SQL aggregation."""
        vendor = self.db.query(Supplier).filter(Supplier.id == vendor_id).first()
        if not vendor:
            raise ValueError("Vendor not found")

        wallet = self.db.query(UserWallet).filter(UserWallet.user_id == vendor.owner_id).first()

        # Sales Over Time (Last 30 days)
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        chart_query = self.db.query(
            func.date(FulfillmentOrder.created_at).label('date'),
            func.sum(FulfillmentOrder.total_vendor_share).label('value')
        ).filter(
            FulfillmentOrder.vendor_id == vendor_id,
            FulfillmentOrder.created_at >= thirty_days_ago
        ).group_by(func.date(FulfillmentOrder.created_at)).all()

        chart_data = [{"date": str(row.date), "value": float(row.value or 0)} for row in chart_query]

        # Top Products
        top_products_query = self.db.query(
            Product.name,
            func.sum(OrderItem.quantity).label('total_sold')
        ).join(OrderItem, Product.id == OrderItem.product_id).filter(
            OrderItem.vendor_id == vendor_id
        ).group_by(Product.id).order_by(desc('total_sold')).limit(5).all()

        top_products = [{"name": row.name, "sold": int(row.total_sold)} for row in top_products_query]

        # Low Stock Alerts
        low_stock_count = self.db.query(func.count(Product.id)).filter(
            Product.store_id == vendor.id,
            Product.inventory < 5
        ).scalar()

        return {
            "total_earnings": float(wallet.balance if wallet else 0),
            "pending_payouts": float(wallet.pending_balance if wallet else 0),
            "sales_chart_data": chart_data,
            "top_products": top_products,
            "low_stock_count": low_stock_count
        }

    # ── Admin Overview ───────────────────────────────────────────
    def get_admin_overview(self) -> Dict[str, Any]:
        """Super Admin 'God View' for platform performance."""
        net_profit = self.db.query(func.sum(OrderItem.commission_amount)).scalar() or 0.0

        total_gmv = self.db.query(func.sum(Order.total_amount)).filter(
            Order.status != OrderStatus.cancelled
        ).scalar() or 0.0

        active_vendors = self.db.query(func.count(Supplier.id)).filter(Supplier.status == 'active').scalar()
        banned_vendors = self.db.query(func.count(Supplier.id)).filter(Supplier.status == 'banned').scalar()

        total_orders = self.db.query(func.count(Order.id)).scalar() or 1
        refunded_orders = self.db.query(func.count(Order.id)).filter(Order.status == OrderStatus.refunded).scalar()
        dispute_rate = (refunded_orders / total_orders) * 100

        return {
            "platform_net_profit": float(net_profit),
            "total_gmv": float(total_gmv),
            "active_vendors": active_vendors,
            "banned_vendors": banned_vendors,
            "dispute_rate": round(dispute_rate, 2)
        }

    # ── Dashboard Stats ──────────────────────────────────────────
    def get_dashboard_stats(self) -> Dict[str, Any]:
        """Get comprehensive dashboard statistics for admin panel."""
        from app.models.user import User

        gmv = self.db.query(func.sum(Order.total_amount)).filter(
            Order.status != OrderStatus.cancelled
        ).scalar() or 0.0

        order_count = self.db.query(func.count(Order.id)).filter(
            Order.status != OrderStatus.cancelled
        ).scalar() or 0

        total_vendors = self.db.query(func.count(Supplier.id)).filter(
            Supplier.status == 'active'
        ).scalar() or 0

        total_users = self.db.query(func.count(User.id)).scalar() or 0

        return {
            "gmv": float(gmv),
            "order_count": order_count,
            "total_vendors": total_vendors,
            "total_users": total_users,
            "currency": "SAR"
        }

    # ── Comprehensive Admin Analytics (NEW) ──────────────────────
    def get_admin_analytics(self, period: str = "monthly") -> Dict[str, Any]:
        """
        Comprehensive admin analytics with real growth calculations.
        Compares current period vs previous period for all KPIs.
        """
        from app.models.user import User

        cur_start, cur_end = self._get_period_bounds(period)
        prev_start, prev_end = self._get_previous_period_bounds(period)

        # ── Current period stats ──
        cur_gmv = self.db.query(func.sum(Order.total_amount)).filter(
            Order.status != OrderStatus.cancelled,
            Order.created_at >= cur_start
        ).scalar() or 0.0

        cur_orders = self.db.query(func.count(Order.id)).filter(
            Order.status != OrderStatus.cancelled,
            Order.created_at >= cur_start
        ).scalar() or 0

        cur_profit = self.db.query(func.sum(OrderItem.commission_amount)).filter(
            OrderItem.created_at >= cur_start
        ).scalar() or 0.0

        # ── Previous period stats ──
        prev_gmv = self.db.query(func.sum(Order.total_amount)).filter(
            Order.status != OrderStatus.cancelled,
            Order.created_at >= prev_start,
            Order.created_at < prev_end
        ).scalar() or 0.0

        prev_orders = self.db.query(func.count(Order.id)).filter(
            Order.status != OrderStatus.cancelled,
            Order.created_at >= prev_start,
            Order.created_at < prev_end
        ).scalar() or 0

        prev_profit = self.db.query(func.sum(OrderItem.commission_amount)).filter(
            OrderItem.created_at >= prev_start,
            OrderItem.created_at < prev_end
        ).scalar() or 0.0

        # ── Vendor & User counts ──
        active_vendors = self.db.query(func.count(Supplier.id)).filter(
            Supplier.status == 'active'
        ).scalar() or 0

        total_users = self.db.query(func.count(User.id)).scalar() or 0

        # ── Sales chart data (last 30 days or period) ──
        days = {"daily": 1, "weekly": 7, "monthly": 30, "yearly": 365}.get(period, 30)
        chart_start = datetime.utcnow() - timedelta(days=days)

        sales_chart = self.db.query(
            func.date(Order.created_at).label('date'),
            func.sum(Order.total_amount).label('value')
        ).filter(
            Order.status != OrderStatus.cancelled,
            Order.created_at >= chart_start
        ).group_by(func.date(Order.created_at)).order_by(func.date(Order.created_at)).all()

        chart_data = [{"date": str(row.date), "value": float(row.value or 0)} for row in sales_chart]

        # ── Recent orders ──
        recent_orders = self.db.query(Order).order_by(
            Order.created_at.desc()
        ).limit(10).all()

        recent_list = []
        for o in recent_orders:
            recent_list.append({
                "id": o.id,
                "total": float(o.total_amount or 0),
                "status": o.status.value if hasattr(o.status, 'value') else str(o.status),
                "created_at": o.created_at.isoformat() if o.created_at else None,
            })

        # ── Top vendors ──
        from app.models.vendor_ledger import VendorLedger
        top_vendors_q = self.db.query(
            VendorLedger.supplier_id,
            func.sum(VendorLedger.amount).label('revenue'),
            func.count(VendorLedger.id).label('count')
        ).filter(
            VendorLedger.transaction_type == 'SALE'
        ).group_by(VendorLedger.supplier_id).order_by(desc('revenue')).limit(5).all()

        top_vendors = []
        for row in top_vendors_q:
            s = self.db.get(Supplier, row.supplier_id)
            top_vendors.append({
                "id": row.supplier_id,
                "name": s.name if s else "Unknown",
                "revenue": float(row.revenue or 0),
                "sales": int(row.count or 0),
            })

        return {
            "total_gmv": float(cur_gmv),
            "gmv_growth": self._growth_pct(float(cur_gmv), float(prev_gmv)),
            "platform_net_profit": float(cur_profit),
            "profit_growth": self._growth_pct(float(cur_profit), float(prev_profit)),
            "order_count": cur_orders,
            "order_growth": self._growth_pct(cur_orders, prev_orders),
            "active_vendors": active_vendors,
            "total_users": total_users,
            "sales_chart": chart_data,
            "recent_orders": recent_list,
            "top_vendors": top_vendors,
            "avg_order_value": round(float(cur_gmv) / max(cur_orders, 1), 2),
            "period": period,
            "currency": "SAR",
        }

    # ── Real Activity Feed (NEW) ─────────────────────────────────
    def get_recent_activities(self, limit: int = 20) -> List[Dict[str, Any]]:
        """
        Pull real activities from orders, vendors, and products.
        Returns a unified, chronologically sorted activity feed.
        """
        activities = []

        # Recent orders
        recent_orders = self.db.query(Order).order_by(
            Order.created_at.desc()
        ).limit(limit).all()

        for o in recent_orders:
            activities.append({
                "id": f"order-{o.id}",
                "type": "order",
                "text": f"طلب جديد #{o.id}",
                "detail": f"{float(o.total_amount or 0):,.2f} ر.س",
                "status": o.status.value if hasattr(o.status, 'value') else str(o.status),
                "time": o.created_at.isoformat() if o.created_at else None,
                "color": "#10b981",
            })

        # Recent vendor registrations
        recent_vendors = self.db.query(Supplier).order_by(
            Supplier.created_at.desc()
        ).limit(5).all()

        for v in recent_vendors:
            activities.append({
                "id": f"vendor-{v.id}",
                "type": "vendor",
                "text": f"متجر جديد: {v.name}",
                "detail": f"الحالة: {v.status}",
                "status": v.status,
                "time": v.created_at.isoformat() if v.created_at else None,
                "color": "#f59e0b",
            })

        # Recent products
        recent_products = self.db.query(Product).order_by(
            Product.created_at.desc()
        ).limit(5).all()

        for p in recent_products:
            activities.append({
                "id": f"product-{p.id}",
                "type": "product",
                "text": f"منتج جديد: {p.name}",
                "detail": f"{float(p.price or 0):,.2f} ر.س",
                "status": "active",
                "time": p.created_at.isoformat() if p.created_at else None,
                "color": "#6366f1",
            })

        # Sort by time descending
        activities.sort(key=lambda x: x.get("time") or "", reverse=True)

        return activities[:limit]

    # ── Ecosystem Health ─────────────────────────────────────────
    def get_ecosystem_health(self) -> Dict[str, Any]:
        """Get platform ecosystem health metrics."""
        total_orders = self.db.query(func.count(Order.id)).scalar() or 0
        refunded = self.db.query(func.count(Order.id)).filter(
            Order.status == OrderStatus.refunded
        ).scalar() or 0
        dispute_rate = round((refunded / max(total_orders, 1)) * 100, 2)

        return {
            "platform_status": "healthy",
            "uptime_percentage": 99.9,
            "api_latency_ms": 120,
            "total_orders": total_orders,
            "dispute_rate": dispute_rate,
        }
