from typing import Optional, List, Any, Dict
from sqlalchemy.orm import Session
from app.services.crud_service import CRUDService
from app.models.order import Order, OrderStatus
import json
from sqlalchemy.orm import joinedload
from app.models.user import User
from sqlalchemy.orm import object_session
from app.models.order_item import OrderItem
from app.models.product import Product
from app.services.pricing_service import PricingService
from app.services.discount_service import DiscountService
from app.services.tax_service import TaxService
from app.services.shipping_service import ShippingService
from app.core.logging_config import get_logger

logger = get_logger("service.order")


class OrderService(CRUDService[Order]):
    def __init__(self, db: Session) -> None:
        super().__init__(db, Order)

    def get_by_id(self, id: int) -> Optional[Order]:
        # Eagerly load items to avoid lazy-loading after session closes
        try:
            return self.db.get(Order, id, options=[joinedload(Order.items)])
        except Exception:
            return self.db.query(Order).options(joinedload(Order.items)).get(id)

    def get_all(self) -> List[Order]:
        return self.db.query(Order).all()

    def create(self, obj: Order | dict | Any) -> Order:
        # Use generic create but preserve error logging
        try:
            return super().create(obj)
        except Exception:
            import traceback

            traceback.print_exc()
            raise

    def update(self, id: int, obj: Order | dict | Any) -> Optional[Order]:
        return super().update(id, obj)

    def delete(self, id: int) -> bool:
        return super().delete(id)

    def create_order(
        self,
        user_id: int,
        items: List[Dict[str, Any]],
        shipping_address: Dict[str, Any] | None,
        coupon_code: str | None = None,
        affiliate_id: int | None = None,
    ) -> Order:
        try:
            # Ensure the user exists and load it into the current session
            user = self.db.get(User, user_id)
            if not user:
                raise ValueError("User not found")
            
            # Create the order row
            order_values = {
                "user_id": user_id,
                "total_amount": 0.0,
                "status": OrderStatus.pending,
                "affiliate_id": affiliate_id,
                "shipping_address": (
                    json.dumps(shipping_address)
                    if shipping_address is not None
                    else None
                ),
            }
            res = self.db.execute(Order.__table__.insert().values(**order_values))
            
            order_id = None
            try:
                order_id = res.inserted_primary_key[0]
            except Exception:
                order_id = res.lastrowid if hasattr(res, "lastrowid") else None
            
            if not order_id:
                raise ValueError("Failed to create order")

            total = 0.0
            tax_total = 0.0
            discount_total = 0.0
            shipping_cost = 0.0

            pricing = PricingService(self.db)
            discounts = DiscountService(self.db)
            tax_svc = TaxService(self.db)
            ship_svc = ShippingService(self.db)

            # Resolve address for Tax/Shipping
            country_code = "SA" # Default
            region = None
            if shipping_address:
                # Expecting keys like 'country', 'region' or 'country_code'
                country_code = shipping_address.get("country_code") or shipping_address.get("country") or "SA"
                region = shipping_address.get("region") or shipping_address.get("state")

            # We will calculate shipping per vendor below during item processing

            # Get dynamic tax rate
            tax_rate_pct = tax_svc.get_tax_rate(country_code, region) * 100.0

            items_by_vendor = {}
            vendor_shares = {}
            vendor_weights = {}
            vendor_affiliate_comm = {}

            affiliate_commission_total = 0.0

            for i in items:
                # Protect against stray data types and use modern Session.get API
                try:
                    product_id = int(i["product_id"])
                except Exception:
                    product_id = i["product_id"]
                product = None
                try:
                    product = self.db.query(Product).filter(Product.id == product_id).with_for_update().first()
                except Exception:
                    # fallback for older SQLAlchemy versions or drivers
                    product = self.db.query(Product).get(product_id)
                
                if not product:
                    raise ValueError(f"Product #{product_id} not found")
                
                q = int(i["quantity"])

                # Prefer supplier stock if available
                try:
                    from app.services.inventory_service import InventoryService

                    inv_svc = InventoryService(self.db)
                    supplier_stock = inv_svc.find_supplier_for_product(
                        product.id, quantity=q
                    )
                except Exception:
                    supplier_stock = None

                if supplier_stock is None and product.inventory < q:
                    raise ValueError("Product out of stock")
                
                # Commission Logic
                commission_rate = 0.10 # Default
                billing_model = "commission"
                
                if supplier_stock:
                    from app.models.supplier import Supplier
                    vendor = self.db.get(Supplier, supplier_stock.supplier_id)
                    if vendor:
                        billing_model = getattr(vendor, "billing_model", "commission")
                        if vendor.commission_rate is not None:
                            commission_rate = vendor.commission_rate
                        
                        # Plan Override
                        if vendor.plan_id:
                            from app.models.vendor_plan import VendorPlan
                            plan = self.db.get(VendorPlan, vendor.plan_id)
                            if plan and plan.commission_rate is not None:
                                commission_rate = plan.commission_rate
                
                # Category Override
                try:
                    from app.models.category import Category
                    cat = self.db.query(Category).filter(Category.name == product.category).first()
                    if cat and cat.commission_rate is not None:
                        commission_rate = cat.commission_rate
                except Exception:
                    pass

                # If pure subscription, commission might be 0
                if billing_model == "subscription":
                    commission_rate = 0.0

                # Calculate Price and Tax (passing our dynamic tax_rate_pct)
                net_unit_price, line_tax = pricing.compute_line_price(
                    product.price, 
                    quantity=1, 
                    prices_include_tax=False,
                    tax_rate=tax_rate_pct
                )

                # Affiliate Per-Item Split
                item_affiliate_commission = 0.0
                if affiliate_id:
                    # Default: 5% from the vendor's share of net price
                    item_affiliate_commission = float(net_unit_price * q * 0.05)
                    affiliate_commission_total += item_affiliate_commission

                item_values = {
                    "order_id": order_id,
                    "product_id": product.id,
                    "quantity": q,
                    "unit_price": float(net_unit_price),
                    "commission_rate": float(commission_rate),
                    "commission_amount": float(net_unit_price * q * commission_rate),
                    "affiliate_commission": item_affiliate_commission
                }

                # Reseller Logic: Capture Source & Margin
                if supplier_stock:
                    item_values["vendor_id"] = supplier_stock.supplier_id
                    # Vendor Share = Net - Platform Commission - Affiliate Commission
                    item_values["cost_price"] = float((net_unit_price * q * (1 - commission_rate)) - item_affiliate_commission)
                else:
                    item_values["vendor_id"] = None
                    item_values["cost_price"] = 0.0

                if supplier_stock is not None:
                    inv_svc.decrement_supplier_stock(supplier_stock, q)
                else:
                    inv_svc.update_stock(product.id, -1 * q)
                
                self.db.execute(OrderItem.__table__.insert().values(**item_values))
                
                subtotal = float(item_values["quantity"]) * float(
                    item_values["unit_price"]
                )
                total += subtotal
                tax_total += float(line_tax) * float(item_values["quantity"])
                
                # Track totals per vendor for FulfillmentOrder
                v_id = item_values["vendor_id"]
                if v_id not in items_by_vendor:
                    items_by_vendor[v_id] = []
                    vendor_shares[v_id] = 0.0
                    vendor_weights[v_id] = 0.0
                    vendor_affiliate_comm[v_id] = 0.0
                
                items_by_vendor[v_id].append(item_values) # Store for later link
                vendor_shares[v_id] += item_values["cost_price"]
                vendor_weights[v_id] += (item_values["quantity"] * 1.0) # Assume 1.0kg per item
                vendor_affiliate_comm[v_id] += item_values["affiliate_commission"]

            # Apply coupon if provided
            if coupon_code:
                c = discounts.get_by_code(coupon_code)
                if c and discounts.validate_coupon_for_user(
                    c, total + tax_total + shipping_cost, user.id
                ):
                    discount_total = discounts.apply_coupon_to_total(
                        c, total + tax_total + shipping_cost
                    )
                    try:
                        discounts.record_redemption(c, user.id)
                    except Exception:
                        self.db.rollback()

            # Update the order row with the computed totals
            order_values_update = dict(
                total_amount=(total + tax_total + shipping_cost - discount_total),
                tax_total=tax_total,
                shipping_cost=shipping_cost,
                discount_total=discount_total,
                affiliate_commission=affiliate_commission_total
            )
            self.db.execute(
                Order.__table__.update()
                .where(Order.__table__.c.id == order_id)
                .values(**order_values_update)
            )
            logger.debug("updated order total %s, affiliate comm %s", total, affiliate_commission_total)
            # Attempt commit
            self.db.commit()
            # To avoid returning instances bound to this session (which can
            # cause detached-instance surprises for callers), load the order
            # again using a fresh session and return that mapped instance.
            try:
                from app.core.database import SessionLocal

                with SessionLocal() as s2:
                    try:
                        fresh = s2.get(
                            Order, order_id, options=[joinedload(Order.items)]
                        )
                    except Exception:
                        fresh = s2.query(Order).get(order_id)
                    if not fresh:
                        # Could be a separate DB in tests (in-memory); fall back to current session
                        pass
                    
            except Exception:
                # fallback: return a minimal dict representation if re-query fails
                logger.exception(
                    "failed to re-query fresh order, falling back to current session"
                )

            # Reseller Logic: Split Order into Fulfillment Orders by Vendor
            from app.models.fulfillment_order import FulfillmentOrder
            
            # 1. Fetch created items to link them (already Grouped in items_by_vendor)
            # We need the actual OrderItem objects with IDs
            db_items = self.db.query(OrderItem).filter(OrderItem.order_id == order_id).all()
            
            # Map db items to their vendor for linking
            vendor_to_item_ids = {}
            for db_item in db_items:
                v_id = db_item.vendor_id
                if v_id not in vendor_to_item_ids:
                    vendor_to_item_ids[v_id] = []
                vendor_to_item_ids[v_id].append(db_item)

            # 2. Calculate shipping per vendor and total order shipping
            total_shipping_cost = 0.0
            vendor_shipping = {}
            for v_id, weight in vendor_weights.items():
                v_ship = ship_svc.calculate_shipping_cost(country_code, weight)
                vendor_shipping[v_id] = v_ship
                total_shipping_cost += v_ship

            # 3. Create Fulfillment Orders (Sub-Orders) + Notify Suppliers
            for v_id, items_list in vendor_to_item_ids.items():
                if v_id is None:
                    continue  # Platform items without a supplier

                fo = FulfillmentOrder(
                    order_id=order_id,
                    vendor_id=v_id,
                    status="pending",
                    total_vendor_share=vendor_shares.get(v_id, 0.0),
                    total_shipping_cost=vendor_shipping.get(v_id, 0.0),
                    total_affiliate_commission=vendor_affiliate_comm.get(v_id, 0.0),
                )
                self.db.add(fo)
                self.db.flush()  # Get fo.id

                for item in items_list:
                    item.fulfillment_order_id = fo.id

                # ── Supplier Notification ─────────────────────────────────
                # Fire-and-forget: notify the supplier so they see the new
                # dropshipping order in their dashboard immediately.
                try:
                    from app.models.notification import Notification
                    from app.models.supplier import Supplier

                    supplier = self.db.get(Supplier, v_id)
                    if supplier and supplier.user_id:
                        item_count = len(items_list)
                        notif = Notification(
                            user_id=supplier.user_id,
                            type="new_fulfillment_order",
                            title="طلب دروب شيبينج جديد",
                            message=(
                                f"لديك طلب جديد #{fo.id} يحتوي على "
                                f"{item_count} منتج. قيمة الطلب: "
                                f"{vendor_shares.get(v_id, 0.0):.2f}"
                            ),
                            data={"fulfillment_order_id": fo.id, "order_id": order_id},
                            is_read=False,
                        )
                        self.db.add(notif)
                        logger.info(
                            "Sent fulfillment notification to supplier %s for FO #%s",
                            v_id,
                            fo.id,
                        )
                except Exception as notify_err:
                    # Never let notification failure break the order
                    logger.warning(
                        "Failed to send supplier notification for FO #%s: %s",
                        getattr(fo, "id", "?"),
                        notify_err,
                    )

            # Update the order row with the final computed shipping
            order_values_update = dict(
                total_amount=(total + tax_total + total_shipping_cost - discount_total),
                tax_total=tax_total,
                shipping_cost=total_shipping_cost,
                discount_total=discount_total,
            )
            self.db.execute(
                Order.__table__.update()
                .where(Order.__table__.c.id == order_id)
                .values(**order_values_update)
            )

            # Final Commit for the entire order creation process
            self.db.commit()
            
            return self.get_by_id(order_id)
        except Exception:
            import traceback

            traceback.print_exc()
            try:
                ids = [
                    (type(v).__name__, getattr(v, "id", None), object_session(v))
                    for v in list(self.db.identity_map.values())
                ]
                logger.debug("identity_map entries on exception: %r", ids)
            except Exception:
                pass
            raise

    def get_user_orders(
        self, user_id: int, limit: int = 50, offset: int = 0
    ) -> List[Order]:
        """Return orders placed by a specific user with pagination."""
        # Eagerly load order items to prevent detached instance errors when
        # the response is serialized after the DB session is closed.
        return (
            self.db.query(Order)
            .options(joinedload(Order.items))
            .filter(Order.user_id == user_id)
            .order_by(Order.created_at.desc())
            .offset(offset)
            .limit(limit)
            .all()
        )

    def calculate_order_preview(
        self,
        items_in: List[Dict[str, Any]],
        shipping_address: Dict[str, Any] | None,
        coupon_code: str | None = None,
    ) -> Dict[str, Any]:
        """Calculate order totals (subtotal, shipping, tax, discount) without creating an order."""
        total = 0.0
        tax_total = 0.0
        discount_total = 0.0
        shipping_cost = 0.0

        pricing = PricingService(self.db)
        discounts = DiscountService(self.db)
        tax_svc = TaxService(self.db)
        ship_svc = ShippingService(self.db)

        # Resolve address for Tax/Shipping
        country_code = "SA"
        region = None
        if shipping_address:
            country_code = shipping_address.get("country_code") or shipping_address.get("country") or "SA"
            region = shipping_address.get("region") or shipping_address.get("state")

        tax_rate_pct = tax_svc.get_tax_rate(country_code, region) * 100.0

        # Group items by vendor to calculate shipping properly
        items_by_vendor = {}
        for i in items_in:
            from app.models.product import Product
            product = self.db.get(Product, int(i["product_id"]))
            if not product: continue
            
            q = int(i["quantity"])
            
            # Find closest vendor (simplified logic for preview)
            try:
                from app.services.inventory_service import InventoryService
                inv_svc = InventoryService(self.db)
                supplier_stock = inv_svc.find_supplier_for_product(product.id, quantity=q)
                vendor_id = supplier_stock.supplier_id if supplier_stock else None
            except:
                vendor_id = None

            if vendor_id not in items_by_vendor:
                items_by_vendor[vendor_id] = 0.0
            
            # Assume 1.0kg per item for weight calculation in shipping
            items_by_vendor[vendor_id] += (q * 1.0)

            # Price calculation
            net_unit_price, line_tax = pricing.compute_line_price(
                product.price, 
                quantity=1, 
                prices_include_tax=False,
                tax_rate=tax_rate_pct
            )
            total += float(net_unit_price) * q
            tax_total += float(line_tax) * q

        # Calculate Shipping per vendor
        for v_id, weight in items_by_vendor.items():
            if v_id:
                cost = ship_svc.calculate_shipping(v_id, country_code, weight)
                shipping_cost += float(cost)

        # Apply coupon
        if coupon_code:
            c = discounts.get_by_code(coupon_code)
            if c and discounts.validate_coupon_for_user(c, total + tax_total + shipping_cost, 0): # 0 for anonymous/any user
                discount_total = discounts.apply_coupon_to_total(c, total + tax_total + shipping_cost)

        return {
            "subtotal": total,
            "shipping_cost": shipping_cost,
            "tax_total": tax_total,
            "discount_total": discount_total,
            "total_amount": total + tax_total + shipping_cost - discount_total,
            "currency": "SAR"
        }

    def get_admin_orders(
        self, 
        limit: int = 50, 
        offset: int = 0,
        status: Optional[str] = None,
        user_id: Optional[int] = None,
        vendor_id: Optional[int] = None,
        date_from: Optional[str] = None,
        date_to: Optional[str] = None
    ) -> List[Order]:
        """Return all orders with optional advanced filtering for administrative use."""
        query = self.db.query(Order).options(joinedload(Order.items))
        
        if status:
            query = query.filter(Order.status == status)
        if user_id:
            query = query.filter(Order.user_id == user_id)
        if vendor_id:
            # Filter orders that contain at least one item from this vendor
            query = query.filter(Order.items.any(OrderItem.vendor_id == vendor_id))
        if date_from:
            query = query.filter(Order.created_at >= date_from)
        if date_to:
            query = query.filter(Order.created_at <= date_to)
            
        return query.order_by(Order.created_at.desc()).offset(offset).limit(limit).all()

    def calculate_totals(self, order_id: int) -> float:
        order = self.get_by_id(order_id)
        if not order:
            raise ValueError("Order not found")
        return order.calculate_total()

    def process_payment(
        self, order_id: int, provider: str, amount: float
    ) -> dict[str, Any]:
        order = self.get_by_id(order_id)
        if not order:
            raise ValueError("Order not found")
        if amount < order.total_amount:
            raise ValueError("Insufficient payment")
        order.update_status(OrderStatus.paid)
        self.db.commit()
        return {"status": "paid", "order_id": order_id}

    def update_order_status(self, order_id: int, status: OrderStatus) -> Order:
        order = self.get_by_id(order_id)
        if not order:
            raise ValueError("Order not found")
        
        # State Machine Validation
        current = order.status
        if status == current:
            return order
            
        # Basic validation rules
        if current == OrderStatus.completed:
            raise ValueError("Cannot change status of a completed order")
        
        if status == OrderStatus.completed and current != OrderStatus.delivered:
            raise ValueError("Order must be Delivered before it can be marked as Completed")
        
        # Update status
        order.update_status(status)
        
        # Fintech Logic: Handle Escrow (Pending Balance)
        if status == OrderStatus.paid:
            from app.services.wallet_service import WalletService
            from app.models.vendor_ledger import VendorLedger
            
            try:
                # Use FulfillmentOrders to identify vendor shares including shipping
                for fo in order.fulfillment_orders:
                    # 1. Record in Ledger for historical tracking
                    total_amount = float(fo.total_vendor_share) + float(fo.total_shipping_cost)
                    
                    credit_entry = VendorLedger(
                        supplier_id=int(fo.vendor_id),
                        amount=total_amount,
                        transaction_type="SALE",
                        reference_id=str(order.id),
                        description=f"Payment for Order #{order.id} (Sub-Order #{fo.id}) - Escrow"
                    )
                    self.db.add(credit_entry)
                    
                    # 2. Add to Wallet's Pending Balance
                    from app.models.supplier import Supplier
                    vendor = self.db.get(Supplier, fo.vendor_id)
                    if vendor and vendor.owner_id:
                        WalletService.add_to_pending(
                            self.db,
                            user_id=vendor.owner_id,
                            amount=total_amount,
                            description=f"Payment for Order #{order.id} (Escrow)",
                            reference_id=str(order.id)
                        )
                
                # 3. Handle Affiliate Commission
                if order.affiliate_id and order.affiliate_commission > 0:
                    from app.models.affiliate import Affiliate
                    aff = self.db.get(Affiliate, order.affiliate_id)
                    if aff:
                        WalletService.add_to_pending(
                            self.db,
                            user_id=aff.user_id,
                            amount=float(order.affiliate_commission),
                            description=f"Affiliate Commission for Order #{order.id} (Escrow)",
                            reference_id=str(order.id),
                            reference_type="affiliate_commission"
                        )

            except Exception as e:
                logger.error(f"Failed to process fintech logic for paid order {order.id}: {e}")
                
        # Fintech Logic: Release Escrow (Distribute Funds - Global Fallback)
        if status == OrderStatus.completed:
            # Note: Preferred path is independent release via update_fulfillment_status.
            # This is a fallback to ensure funds are released if the main order is completed.
            for fo in order.fulfillment_orders:
                if fo.status != "delivered": # Avoid double release
                    self.update_fulfillment_status(fo.id, "delivered")

        # Audit Record
        try:
            from app.services.audit_service import AuditService
            audit_svc = AuditService(self.db)
            audit_svc.record_action(
                action="UPDATE_ORDER_STATUS",
                user_id=None, # System or current user if available
                target_type="order",
                target_id=str(order.id),
                details=f"Status changed to {status}"
            )
        except Exception:
            logger.exception("Failed to record audit log")

        self.db.commit()
        self.db.refresh(order)
        return order

    def update_fulfillment_status(self, fo_id: int, status: str) -> bool:
        """Update a Sub-Order status and trigger independent fund distribution."""
        from app.models.fulfillment_order import FulfillmentOrder
        fo = self.db.get(FulfillmentOrder, fo_id)
        if not fo:
            raise ValueError("FulfillmentOrder not found")
        
        fo.status = status
        self.db.add(fo)
        
        # Independent Fund Release Logic
        if status == "delivered": 
            # Release funds when marked delivered as per patch.
            self.distribute_funds(fo_id)
        
        self.db.commit()
        return True

    def distribute_funds(self, fo_id: int):
        """Executes when a Sub-Order is marked as delivered."""
        from app.models.fulfillment_order import FulfillmentOrder
        from app.models.supplier import Supplier
        from app.services.wallet_service import WalletService
        
        fo = self.db.get(FulfillmentOrder, fo_id)
        if not fo: return
        
        vendor = self.db.get(Supplier, fo.vendor_id)
        if vendor and vendor.owner_id:
            # Move both product share and shipping cost to available
            total_release = float(fo.total_vendor_share) + float(fo.total_shipping_cost)
            
            WalletService.confirm_pending_to_available(
                self.db,
                user_id=vendor.owner_id,
                amount=total_release,
                description=f"Independent release for Sub-Order #{fo.id} (Order #{fo.order_id})",
                reference_id=f"FO-{fo.id}"
            )
            logger.info(f"Released {total_release} to vendor {vendor.owner_id} for Sub-Order {fo.id}")
            
            # --- Release Affiliate Commission ---
            if fo.order and fo.order.affiliate_id and fo.total_affiliate_commission > 0:
                from app.models.affiliate import Affiliate
                aff = self.db.get(Affiliate, fo.order.affiliate_id)
                if aff:
                    WalletService.confirm_pending_to_available(
                        self.db,
                        user_id=aff.user_id,
                        amount=float(fo.total_affiliate_commission),
                        description=f"Affiliate release for Sub-Order #{fo.id} (Order #{fo.order_id})",
                        reference_id=f"FO-{fo.id}-AFF"
                    )
                    logger.info(f"Released {fo.total_affiliate_commission} to affiliate {aff.user_id} for Sub-Order {fo.id}")

    def user_has_purchased(self, user_id: int, product_id: int) -> bool:
        """Check if user has a completed/paid order containing the product."""
        # ... logic ...
        return exists is not None

    def refund_order(self, order_id: int) -> bool:
        """Fully refund an order, reversing all financial transactions and restocking inventory."""
        from app.models.order import OrderStatus
        from app.models.vendor_ledger import VendorLedger
        from app.services.wallet_service import WalletService
        from app.models.fulfillment_order import FulfillmentOrder
        from app.models.supplier import Supplier
        from app.models.affiliate import Affiliate

        order = self.get_by_id(order_id)
        if not order:
            raise ValueError("Order not found")
        
        if order.status == OrderStatus.cancelled or order.status == "refunded":
            raise ValueError("Order is already cancelled or refunded")

        # 1. Financial Reversal
        try:
            # Reversal for each Vendor
            for fo in order.fulfillment_orders:
                vendor = self.db.get(Supplier, fo.vendor_id)
                if not vendor or not vendor.owner_id: continue
                
                # Reverse Vendor Share
                total_to_reverse = float(fo.total_vendor_share) + float(fo.total_shipping_cost)
                
                # Reverse Ledger
                debit_entry = VendorLedger(
                    supplier_id=int(fo.vendor_id),
                    amount=-total_to_reverse,
                    transaction_type="REFUND",
                    reference_id=str(order.id),
                    description=f"Refund for Order #{order.id} (Sub-Order #{fo.id})"
                )
                self.db.add(debit_entry)
                
                # Deduct from Wallet (Check available first, then pending)
                # This is a bit complex: if funds were released, deduct available. Else deduct pending.
                if fo.status == "delivered":
                    # Was already released to available
                    WalletService.confirm_pending_to_available(
                        self.db, 
                        user_id=vendor.owner_id, 
                        amount=-total_to_reverse, 
                        description=f"Refund Reversal for Order #{order.id}",
                        reference_id=str(order.id)
                    )
                else:
                    # Still in pending
                    WalletService.add_to_pending(
                        self.db, 
                        user_id=vendor.owner_id, 
                        amount=-total_to_reverse, 
                        description=f"Refund Reversal (Escrow) for Order #{order.id}",
                        reference_id=str(order.id)
                    )
                
                # Correct status
                fo.status = "cancelled"
            
            # Reversal for Affiliate
            if order.affiliate_id and order.affiliate_commission > 0:
                aff = self.db.get(Affiliate, order.affiliate_id)
                if aff:
                    # Same logic: if order was completed, funds might be in available. 
                    # For simplicity, if order is refunded, we always try to recoup.
                    # In a real system, we'd check if specific sub-orders were delivered.
                    WalletService.add_to_pending(
                        self.db,
                        user_id=aff.user_id,
                        amount=-float(order.affiliate_commission),
                        description=f"Affiliate Commission Reversal for Order #{order.id}",
                        reference_id=str(order.id)
                    )

        except Exception as e:
            logger.error(f"Failed financial reversal for refund {order.id}: {e}")
            raise ValueError(f"Financial reversal failed: {e}")

        # 2. Inventory Restocking
        from app.services.inventory_service import InventoryService
        inv_svc = InventoryService(self.db)
        for item in order.items:
            # If item had a vendor/supplier_stock, try to restock there
            if item.vendor_id:
                from app.models.supplier_product import SupplierProduct
                sp = self.db.query(SupplierProduct).filter(
                    SupplierProduct.supplier_id == item.vendor_id,
                    SupplierProduct.product_id == item.product_id
                ).first()
                if sp:
                    sp.inventory += item.quantity
                    self.db.add(sp)
            else:
                inv_svc.update_stock(item.product_id, item.quantity)

        # 3. Update Order Status
        order.update_status("refunded")
        self.db.commit()
        return True

    def create_hybrid_order(
        self,
        user_id: int,
        product_id: int,
        supplier_id: int,
        quantity: int,
        price: float
    ) -> Order:
        """Create a direct WhatsApp order (PENDING_AGREEMENT). Reserves stock and creates an order reference."""
        try:
            # Create the order row
            order_values = {
                "user_id": user_id,
                "total_amount": float(price * quantity),
                "status": OrderStatus.pending,
                "shipping_address": None
            }
            res = self.db.execute(Order.__table__.insert().values(**order_values))
            
            order_id = res.inserted_primary_key[0] if res.inserted_primary_key else (res.lastrowid if hasattr(res, "lastrowid") else None)
            if not order_id:
                raise ValueError("Failed to create order")

            product = self.db.query(Product).filter(Product.id == product_id).with_for_update().first()
            if not product:
                raise ValueError(f"Product #{product_id} not found")

            # Check and reserve stock
            from app.services.inventory_service import InventoryService
            inv_svc = InventoryService(self.db)
            supplier_stock = inv_svc.find_supplier_for_product(product.id, quantity=quantity)
            
            if supplier_stock and supplier_stock.supplier_id == supplier_id:
                inv_svc.decrement_supplier_stock(supplier_stock, quantity)
            elif product.inventory >= quantity:
                inv_svc.update_stock(product.id, -1 * quantity)
            else:
                raise ValueError("Product out of stock or insufficient quantity")

            from app.models.supplier import Supplier
            supplier = self.db.get(Supplier, supplier_id)
            if not supplier:
                raise ValueError("Supplier not found")
                
            settlement = getattr(supplier, "preferred_settlement_method", "platform")
            commission_rate = getattr(supplier, "commission_rate", 0.10)
            commission_amount = 0.0
            
            if settlement == "post_billing":
                commission_amount = float(price * quantity * commission_rate)
            elif settlement == "pay_per_lead":
                commission_amount = 5.0 # Fixed charge per lead/WhatsApp click
                
            item_values = {
                "order_id": order_id,
                "product_id": product.id,
                "quantity": quantity,
                "unit_price": float(price),
                "commission_rate": float(commission_rate) if settlement == "post_billing" else 0.0,
                "commission_amount": commission_amount,
                "affiliate_commission": 0.0,
                "vendor_id": supplier_id,
                "cost_price": float(price * quantity) - commission_amount
            }
            self.db.execute(OrderItem.__table__.insert().values(**item_values))
            
            # Record Ledger Charge for Post Billing / Pay Per Lead
            if commission_amount > 0:
                from app.models.vendor_ledger import VendorLedger
                from datetime import datetime
                charge = VendorLedger(
                    supplier_id=supplier_id,
                    amount=-commission_amount, # Deduct
                    transaction_type="COMMISSION_DIRECT",
                    description=f"Direct WhatsApp Order #{order_id} commission",
                    reference_id=str(order_id),
                    created_at=datetime.utcnow()
                )
                self.db.add(charge)
            
            
            # Create fulfillment order for vendor
            from app.models.fulfillment_order import FulfillmentOrder, FulfillmentStatus
            from app.models.fulfillment_order_item import FulfillmentOrderItem
            
            fo_values = {
                "order_id": order_id,
                "vendor_id": supplier_id,
                "status": FulfillmentStatus.pending,
                "subtotal": float(price * quantity),
                "tracking_number": None
            }
            fo_res = self.db.execute(FulfillmentOrder.__table__.insert().values(**fo_values))
            fo_id = fo_res.inserted_primary_key[0] if fo_res.inserted_primary_key else None
            
            if fo_id:
                self.db.execute(FulfillmentOrderItem.__table__.insert().values(
                    fulfillment_order_id=fo_id,
                    product_id=product.id,
                    quantity=quantity,
                    cost_price=float(price * quantity)
                ))

            self.db.commit()
            return self.get_by_id(order_id)
        except Exception as e:
            self.db.rollback()
            raise e

    def user_has_purchased(self, user_id: int, product_id: int) -> bool:
        """Check if a user has a paid/completed order containing the given product."""
        # Check standard orders
        from app.models.order_item import OrderItem
        from app.models.order import Order
        
        has_order = self.db.query(OrderItem).join(Order).filter(
            Order.user_id == user_id,
            OrderItem.product_id == product_id,
            Order.status.in_(["paid", "processing", "shipped", "delivered", "completed", "pending"])
        ).first()

        return has_order is not None
