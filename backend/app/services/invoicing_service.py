from sqlalchemy.orm import Session
from typing import Dict, Any, List
from app.models.order import Order
from app.models.order_item import OrderItem
from app.models.supplier import Supplier

class InvoicingService:
    def __init__(self, db: Session):
        self.db = db

    def generate_customer_invoice_data(self, order_id: int) -> Dict[str, Any]:
        """Generate data for a customer invoice."""
        order = self.db.get(Order, order_id)
        if not order:
            raise ValueError("Order not found")
        
        items_data = []
        for item in order.items:
            product = item.get_product()
            items_data.append({
                "product_name": product.name if product else f"Product #{item.product_id}",
                "quantity": item.quantity,
                "unit_price": item.unit_price,
                "subtotal": item.subtotal
            })
            
        return {
            "invoice_number": f"INV-{order.id}-{order.created_at.strftime('%Y%m%d')}",
            "date": order.created_at.isoformat(),
            "customer_id": order.user_id,
            "shipping_address": order.shipping_address,
            "items": items_data,
            "subtotal": sum(i.subtotal for i in order.items),
            "tax_total": order.tax_total,
            "shipping_cost": order.shipping_cost,
            "discount_total": order.discount_total,
            "total_amount": order.total_amount,
            "status": order.status
        }

    def generate_vendor_settlement_report(self, order_id: int, vendor_id: int) -> Dict[str, Any]:
        """Generate a settlement report for a specific vendor for an order."""
        order = self.db.get(Order, order_id)
        vendor = self.db.get(Supplier, vendor_id)
        
        if not order or not vendor:
            raise ValueError("Order or Vendor not found")
            
        vendor_items = [item for item in order.items if item.vendor_id == vendor_id]
        
        items_data = []
        vendor_total_gross = 0.0
        vendor_total_commission = 0.0
        
        for item in vendor_items:
            product = item.get_product()
            items_data.append({
                "product_name": product.name if product else f"Product #{item.product_id}",
                "quantity": item.quantity,
                "unit_price": item.unit_price,
                "gross_subtotal": item.subtotal,
                "commission_rate": item.commission_rate,
                "commission_amount": item.commission_amount,
                "net_share": item.subtotal - item.commission_amount
            })
            vendor_total_gross += item.subtotal
            vendor_total_commission += item.commission_amount
            
        return {
            "report_id": f"SETTLE-{order.id}-{vendor_id}",
            "order_id": order_id,
            "vendor_name": vendor.name,
            "date": order.created_at.isoformat(),
            "items": items_data,
            "total_gross": vendor_total_gross,
            "total_commission": vendor_total_commission,
            "total_net_share": vendor_total_gross - vendor_total_commission,
            "order_status": order.status
        }
