import csv
import io
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
from app.models.order import Order
from app.models.order_item import OrderItem
from app.models.fulfillment_order import FulfillmentOrder
from app.models.wallet import WalletTransaction

class ExportService:
    def __init__(self, db: Session):
        self.db = db

    def generate_monthly_financial_csv(self, vendor_id: int, year: int, month: int) -> str:
        """Generates a CSV string for a vendor's monthly financial statement."""
        # This is a simplified version aggregating data for the month
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Header
        writer.writerow(["Financial Statement", f"{year}-{month:02d}", f"Vendor ID: {vendor_id}"])
        writer.writerow([])
        writer.writerow(["Date", "Description", "Type", "Gross Amount", "Platform Commission", "Net Earned"])
        
        # Query items for the month
        items = self.db.query(OrderItem).join(Order).filter(
            OrderItem.vendor_id == vendor_id,
            func.extract('year', Order.created_at) == year,
            func.extract('month', Order.created_at) == month
        ).all()
        
        total_gross = 0.0
        total_comm = 0.0
        total_net = 0.0
        
        for item in items:
            gross = item.unit_price * item.quantity
            comm = item.commission_amount
            net = gross - comm
            
            writer.writerow([
                item.order.created_at.strftime("%Y-%m-%d"),
                f"Order #{item.order_id} - Product #{item.product_id}",
                "SALE",
                f"{gross:.2f}",
                f"{comm:.2f}",
                f"{net:.2f}"
            ])
            
            total_gross += gross
            total_comm += comm
            total_net += net
            
        writer.writerow([])
        writer.writerow(["TOTALS", "", "", f"{total_gross:.2f}", f"{total_comm:.2f}", f"{total_net:.2f}"])
        
        return output.getvalue()

    def generate_admin_platform_csv(self, year: int, month: int) -> str:
        """Generates a platform-wide financial summary for the admin."""
        output = io.StringIO()
        writer = csv.writer(output)
        
        writer.writerow(["Platform Revenue Statement", f"{year}-{month:02d}"])
        writer.writerow([])
        writer.writerow(["Date", "Order ID", "Total GMV", "Total Commissions (Profit)", "Total Shipping"])
        
        orders = self.db.query(Order).filter(
            func.extract('year', Order.created_at) == year,
            func.extract('month', Order.created_at) == month
        ).all()
        
        sum_gmv = 0.0
        sum_profit = 0.0
        sum_ship = 0.0
        
        for order in orders:
            writer.writerow([
                order.created_at.strftime("%Y-%m-%d"),
                order.id,
                f"{order.total_amount:.2f}",
                f"{order.discount_total:.2f}", # Placeholder for profit logic if simplified
                f"{order.shipping_cost:.2f}"
            ])
            sum_gmv += order.total_amount
            sum_ship += order.shipping_cost
            
        writer.writerow([])
        writer.writerow(["TOTALS", "", f"{sum_gmv:.2f}", "", f"{sum_ship:.2f}"])
        
        return output.getvalue()
