from sqlalchemy.orm import Session
from app.models.return_request import ReturnRequest, ReturnStatus, ReturnReason
from app.models.order import Order, OrderStatus
from app.models.order_item import OrderItem
from decimal import Decimal
from typing import Optional, List
from datetime import datetime
from app.models.supplier_product import SupplierProduct
from app.models.vendor_ledger import VendorLedger

class ReturnService:
    def __init__(self, db: Session):
        self.db = db

    def create_request(self, order_id: int, item_id: int, reason: str, notes: str = None) -> ReturnRequest:
        # Validate order exists
        order = self.db.query(Order).get(order_id)
        if not order:
            raise ValueError("Order not found")
            
        # Validate item belongs to order
        item = self.db.query(OrderItem).get(item_id)
        if not item or item.order_id != order_id:
            raise ValueError("Invalid order item")

        # Check if already requested? (Optional validation)

        rr = ReturnRequest(
            order_id=order_id,
            order_item_id=item_id,
            reason=reason,
            status=ReturnStatus.PENDING,
            refund_amount=item.subtotal, # Default to full refund
            admin_notes=notes
        )
        self.db.add(rr)
        self.db.commit()
        self.db.refresh(rr)
        return rr

    def process_request(self, request_id: int, action: str, admin_notes: str = None):
        """
        action: 'approve' or 'reject'
        """
        rr = self.db.query(ReturnRequest).get(request_id)
        if not rr:
            raise ValueError("Request not found")
        
        if rr.status != ReturnStatus.PENDING:
            raise ValueError("Request already processed")

        rr.admin_notes = admin_notes or rr.admin_notes

        if action == "reject":
            rr.status = ReturnStatus.REJECTED
            self.db.commit()
            return rr

        if action == "approve":
            # LOGIC ENGINE
            item = rr.order_item
            vendor_id = item.vendor_id
            
            # 1. Financial Reversal (Debit Vendor)
            # If the order was PAID, the vendor likely got credit. We need to reverse it.
            # Credit was: (Retail - Cost) usually, or Cost depending on model. 
            # In our current model, we credited the Vendor Ledger when order was PAID.
            # We need to DEBIT the vendor account to return funds to platform -> Customer.
            
            # Cost Price Reversal? 
            # If we paid vendor X, we take back X.
            # If item is DAMAGED, Vendor loses item AND money.
            # If item is CHANGED_MIND, Vendor gets item back, but loses sale money.
            
            # Simplified: We just Reverse the original CREDIT transaction if possible, 
            # OR we just Debit the 'refund_amount' (retail) if the platform bore the cost?
            # Actually, standard dropship: 
            # Sale: +$100 Retail (Platform). -$80 Cost (owed to Vendor). Profit $20.
            # Vendor Payout: $80.
            
            # Refund: -$100 to Customer.
            # We need to recoup $80 from Vendor. Platform loses $20 profit.
            
            amount_to_debit_vendor = item.cost_price if item.cost_price else 0
            
            if vendor_id:
                ledger = VendorLedger(
                    supplier_id=vendor_id,
                    amount=-abs(amount_to_debit_vendor), # DEBIT
                    transaction_type="REFUND",
                    reference_id=str(rr.id),
                    description=f"Refund for Item #{item.id} ({rr.reason})"
                )
                self.db.add(ledger)

            # 2. Inventory Logic
            if rr.reason == ReturnReason.DAMAGED:
                # Discard item. Do NOT increment stock.
                # Vendor loses the physical item + the money. 
                pass
            else:
                # CHANGED_MIND, WRONG_ITEM etc. -> Restock
                # Find SupplierProduct
                # We need to find the specific SupplierProduct linkage. 
                # OrderItem stores vendor_id, product_id.
                if vendor_id:
                    sp = self.db.query(SupplierProduct).filter(
                        SupplierProduct.supplier_id == vendor_id,
                        SupplierProduct.product_id == item.product_id
                    ).first()
                    if sp:
                        sp.inventory += item.quantity
                        self.db.add(sp)

            rr.status = ReturnStatus.COMPLETED
            self.db.commit()
            return rr
