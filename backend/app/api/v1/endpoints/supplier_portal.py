from fastapi import APIRouter, Depends, HTTPException, status, Form, File, UploadFile
from typing import List, Optional
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime
from app.core.database import get_db
from app.api.v1.dependencies import get_current_user
from app.models.user import User
from app.models.supplier import Supplier
from app.models.supplier_product import SupplierProduct
from app.models.product import Product

router = APIRouter(prefix="/supplier", tags=["supplier"])

# --- Schemas ---
class SupplierDashboardStats(BaseModel):
    total_products: int
    total_inventory: int
    total_sales: float = 0.0
    daily_sales: List[dict] = []

class SupplierProductUpdate(BaseModel):
    cost_price: Optional[float] = None
    inventory: Optional[int] = None
    low_stock_threshold: Optional[int] = None

class SupplierProductImage(BaseModel):
    url: str
    is_primary: bool = False

class SupplierProductCreate(BaseModel):
    name: str
    description: Optional[str] = None
    category: Optional[str] = None
    cost_price: float
    inventory: int
    sku_vendor: Optional[str] = None
    images: List[SupplierProductImage] = []
    status: str = "published"

class SupplierInfo(BaseModel):
    id: int
    name: str
    code: Optional[str] = None
    status: str
    description: Optional[str] = None
    logo_url: Optional[str] = None
    contact_email: Optional[str] = None
    phone: Optional[str] = None
    whatsapp_number: Optional[str] = None
    address: Optional[str] = None
    return_policy: Optional[str] = None
    shipping_policy: Optional[str] = None
    plan_name: Optional[str] = None
    plan_limit: Optional[int] = 0
    allow_direct_orders: bool = False
    preferred_settlement_method: str = "platform"

class SupplierUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    logo_url: Optional[str] = None
    contact_email: Optional[str] = None
    phone: Optional[str] = None
    whatsapp_number: Optional[str] = None
    address: Optional[str] = None
    return_policy: Optional[str] = None
    shipping_policy: Optional[str] = None
    allow_direct_orders: Optional[bool] = None
    preferred_settlement_method: Optional[str] = None

# --- Dependencies ---
def get_current_supplier(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Supplier:
    # Check if user owns a supplier profile
    supplier = db.query(Supplier).filter(Supplier.owner_id == current_user.id).first()
    if not supplier:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="User is not a registered supplier"
        )
    return supplier

# --- Endpoints ---

@router.get("/me", response_model=SupplierInfo)
def get_my_supplier_info(
    supplier: Supplier = Depends(get_current_supplier)
):
    return {
        "id": supplier.id,
        "name": supplier.name,
        "code": supplier.code,
        "status": supplier.status or "active",
        "description": supplier.description,
        "logo_url": supplier.logo_url,
        "contact_email": supplier.contact_email,
        "phone": supplier.phone,
        "whatsapp_number": supplier.whatsapp_number,
        "address": supplier.address,
        "return_policy": supplier.return_policy,
        "shipping_policy": supplier.shipping_policy,
        "plan_name": supplier.plan.name if supplier.plan else "N/A",
        "plan_limit": supplier.plan.max_products if supplier.plan else 0,
        "allow_direct_orders": bool(supplier.allow_direct_orders),
        "preferred_settlement_method": supplier.preferred_settlement_method or "platform"
    }

@router.post("/ads/request")
def request_ad_placement(
    data: dict, # { "image_url": "...", "target_url": "...", "placement": "homepage_hero", "cost": 50.0 }
    db: Session = Depends(get_db),
    supplier: Supplier = Depends(get_current_supplier)
):
    from app.services.ad_service import AdService
    ad_service = AdService(db)
    
    # Simple calculation for mock, in reality it relies on duration
    cost = data.get("cost", 50.0) 
    
    ad = ad_service.create_vendor_ad_request(
        vendor_id=supplier.id, 
        ad_data={
            "image_url": data.get("image_url"),
            "target_url": data.get("target_url"),
            "placement": data.get("placement", "homepage_hero"),
            "cost": cost
        }
    )
    return {"status": "submitted", "ad_id": ad.id, "cost": cost}

@router.get("/capabilities")
def get_my_capabilities(
    db: Session = Depends(get_db),
    supplier: Supplier = Depends(get_current_supplier)
):
    from app.services.capability_service import CapabilityService
    cap_service = CapabilityService(db)
    return cap_service.get_vendor_capabilities(supplier.id)

@router.put("/me", response_model=SupplierInfo)
def update_my_supplier_info(
    data: SupplierUpdate,
    db: Session = Depends(get_db),
    supplier: Supplier = Depends(get_current_supplier)
):
    update_data = data.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(supplier, key, value)
    
    db.commit()
    db.refresh(supplier)
    return get_my_supplier_info(supplier=supplier)

@router.get("/stats", response_model=SupplierDashboardStats)
def get_stats(
    db: Session = Depends(get_db),
    supplier: Supplier = Depends(get_current_supplier)
):
    from app.models.vendor_ledger import VendorLedger
    from sqlalchemy import func
    
    # 1. Basic Counts
    products = db.query(SupplierProduct).filter(SupplierProduct.supplier_id == supplier.id).all()
    total_products = len(products)
    total_inventory = sum(p.inventory for p in products)

    # 2. Daily sales aggregation
    sales_results = (
        db.query(
            func.date(VendorLedger.created_at).label("day"),
            func.sum(VendorLedger.amount).label("total")
        )
        .filter(VendorLedger.supplier_id == supplier.id, VendorLedger.amount > 0)
        .group_by(func.date(VendorLedger.created_at))
        .order_by(func.date(VendorLedger.created_at))
        .limit(30)
        .all()
    )
    
    # 3. Total Sales
    total_sales = (
        db.query(func.sum(VendorLedger.amount))
        .filter(VendorLedger.supplier_id == supplier.id, VendorLedger.amount > 0)
        .scalar()
    ) or 0.0

    # Build daily_sales list from query results
    daily_sales = [
        {"date": str(r.day), "total": float(r.total or 0)}
        for r in sales_results
    ]

    return {
        "total_products": total_products,
        "total_inventory": total_inventory,
        "total_sales": float(total_sales),
        "daily_sales": daily_sales
    }

@router.get("/products", response_model=List[dict])
def get_my_products(
    db: Session = Depends(get_db),
    supplier: Supplier = Depends(get_current_supplier)
):
    # Join with Product to get names
    results = (
        db.query(SupplierProduct, Product)
        .join(Product, SupplierProduct.product_id == Product.id)
        .filter(SupplierProduct.supplier_id == supplier.id)
        .all()
    )
    
    out = []
    for sp, p in results:
        # Get all images for carousel support
        imgs = [{
            "url": img.url,
            "is_primary": getattr(img, "is_primary", False),
            "position": getattr(img, "position", 0)
        } for img in p.images] if p.images else []
        
        out.append({
            "product_id": p.id,
            "name": p.name,
            "sku_vendor": sp.sku_vendor,
            "cost_price": sp.cost_price,
            "inventory": sp.inventory,
            "low_stock_threshold": sp.low_stock_threshold,
            "currency": sp.currency,
            "images": imgs,
            "image": next((i["url"] for i in imgs if i["is_primary"]), imgs[0]["url"] if imgs else None)
        })
    return out

@router.post("/products")
def create_supplier_product(
    name: str = Form(...),
    description: Optional[str] = Form(None),
    category: Optional[str] = Form(None),
    price: float = Form(...),
    inventory: int = Form(...),
    inventory_threshold: int = Form(5),
    sku: Optional[str] = Form(None),
    images: List[UploadFile] = File([]),
    db: Session = Depends(get_db),
    supplier: Supplier = Depends(get_current_supplier)
):
    from app.services.product_service import ProductService
    from app.services.vendor_service import VendorService
    from app.services.capability_service import CapabilityService
    from app.services.image_service import ImageService
    from app.core.config import settings

    cap_service = CapabilityService(db)
    vendor_service = VendorService(db)
    current_products_count = len(vendor_service.get_supplier_products(supplier.id))
    
    if not cap_service.check_can_add_product(supplier.id, current_products_count):
        raise HTTPException(status_code=403, detail="Product limit reached for your current subscription plan. Please upgrade to add more products.")

    image_dicts = []
    if images and len(images) > 0 and getattr(images[0], "filename", None):
        image_service = ImageService(
            allowed_map={"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp"},
            cloudinary_url=settings.CLOUDINARY_URL
        )
        for idx, file in enumerate(images):
            try:
                url = image_service.process_upload(file)
                image_dicts.append({
                    "url": url,
                    "is_primary": idx == 0
                })
            except Exception as e:
                raise HTTPException(status_code=400, detail=f"Failed to upload image: {e}")

    product_service = ProductService(db)
    
    # 1. Create the core Product
    product_data = {
        "name": name,
        "description": description,
        "category": category,
        "price": price,
        "status": "published",
        "images": image_dicts
    }
    
    product = product_service.create(product_data)
    
    # 2. Link to Supplier
    sp = SupplierProduct(
        supplier_id=supplier.id,
        product_id=product.id,
        cost_price=price,
        inventory=inventory,
        sku_vendor=sku,
        low_stock_threshold=inventory_threshold
    )
    db.add(sp)
    db.commit()
    
    return {"status": "created", "product_id": product.id}

@router.put("/products/{product_id}")
def update_my_product_stock(
    product_id: int,
    data: SupplierProductUpdate,
    db: Session = Depends(get_db),
    supplier: Supplier = Depends(get_current_supplier)
):
    sp = (
        db.query(SupplierProduct)
        .filter(
            SupplierProduct.supplier_id == supplier.id,
            SupplierProduct.product_id == product_id
        )
        .first()
    )
    if not sp:
        raise HTTPException(status_code=404, detail="Product not found in your catalog")
    
    if data.inventory is not None:
        sp.inventory = data.inventory
    if data.cost_price is not None:
        sp.cost_price = data.cost_price
    if data.low_stock_threshold is not None:
        sp.low_stock_threshold = data.low_stock_threshold
    
    db.commit()

    # --- Check for Low Stock Alert ---
    if sp.inventory <= sp.low_stock_threshold:
        from app.services.notification_service import NotificationService
        notif_service = NotificationService(db)
        notif_service.create_notification(
            user_id=supplier.owner_id,
            title="Low Stock Alert!",
            content=f"Product '{sp.product.name}' is running low on stock ({sp.inventory} left).",
            type="warning",
            link="/vendor/products"
        )

    return {"status": "updated"}

@router.get("/wallet", response_model=dict)
def get_my_wallet(
    db: Session = Depends(get_db),
    supplier: Supplier = Depends(get_current_supplier)
):
    from app.models.vendor_ledger import VendorLedger
    from sqlalchemy import func
    
    # Calculate Balance
    balance = (
        db.query(func.sum(VendorLedger.amount))
        .filter(VendorLedger.supplier_id == supplier.id)
        .scalar()
    ) or 0.0

    # Recent Transactions
    history = (
        db.query(VendorLedger)
        .filter(VendorLedger.supplier_id == supplier.id)
        .order_by(VendorLedger.created_at.desc())
        .limit(50)
        .all()
    )
    
    return {
        "balance": balance,
        "history": [
            {
                "id": h.id,
                "amount": h.amount,
                "type": h.transaction_type,
                "description": h.description,
                "created_at": h.created_at,
                "reference_id": h.reference_id
            } for h in history
        ]
    }

# --- Supplier Order Management (Fullfilment) ---

class FulfillmentOrderResponse(BaseModel):
    id: int
    order_id: int
    status: str
    created_at: datetime
    tracking_number: Optional[str]
    items: List[dict]
    # We could include shipping address here if privacy allows
    shipping_address: Optional[dict] = None

@router.get("/orders", response_model=List[FulfillmentOrderResponse])
def get_my_fulfillment_orders(
    db: Session = Depends(get_db),
    supplier: Supplier = Depends(get_current_supplier)
):
    from app.models.fulfillment_order import FulfillmentOrder
    from sqlalchemy.orm import joinedload
    
    orders = (
        db.query(FulfillmentOrder)
        .options(joinedload(FulfillmentOrder.items).joinedload(OrderItem.product))
        .options(joinedload(FulfillmentOrder.order))
        .filter(FulfillmentOrder.vendor_id == supplier.id)
        .order_by(FulfillmentOrder.created_at.desc())
        .all()
    )
    
    out = []
    for fo in orders:
        items_data = []
        for item in fo.items:
            # Safely get product name if available
            p_name = "Unknown Product"
            img = None
            # Need to query product if not eager loaded properly or rely on relationship
            # OrderItem has get_product() but here we use eager load
            # Re-query if product info not present (depends on relationships)
            prod = db.query(Product).get(item.product_id)
            if prod:
                p_name = prod.name
                if prod.images:
                    img = prod.images[0].url
            
            items_data.append({
                "product_name": p_name,
                "quantity": item.quantity,
                "sku_vendor": "??", # Add field to OrderItem or query SupplierProduct?
                "image": img
            })
            
        out.append({
            "id": fo.id,
            "order_id": fo.order_id,
            "status": fo.status,
            "created_at": fo.created_at,
            "tracking_number": fo.tracking_number,
            "items": items_data,
            "shipping_address": fo.order.shipping_address if fo.order else None
        })
    return out

class FulfillmentUpdate(BaseModel):
    status: str # shipped, delivered
    tracking_number: Optional[str] = None

@router.put("/orders/{fo_id}")
def update_fulfillment_order(
    fo_id: int,
    data: FulfillmentUpdate,
    db: Session = Depends(get_db),
    supplier: Supplier = Depends(get_current_supplier)
):
    from app.services.order_service import OrderService
    from app.models.fulfillment_order import FulfillmentOrder
    
    fo = db.get(FulfillmentOrder, fo_id)
    if not fo or fo.vendor_id != supplier.id:
        raise HTTPException(status_code=404, detail="Order not found")
        
    service = OrderService(db)
    
    # Update tracking number first
    if data.tracking_number:
        fo.tracking_number = data.tracking_number
        db.add(fo)
        db.flush()
        
    try:
        service.update_fulfillment_status(fo_id, data.status)
        return {"status": "updated"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/subscribe/{plan_id}")
def switch_plan(
    plan_id: int,
    db: Session = Depends(get_db),
    supplier: Supplier = Depends(get_current_supplier)
):
    from app.models.vendor_plan import VendorPlan
    from app.models.vendor_ledger import VendorLedger
    
    plan = db.query(VendorPlan).get(plan_id)
    if not plan or not plan.is_active:
        raise HTTPException(status_code=404, detail="Plan not found or inactive")
        
    # 1. Billing - Charge the monthly fee immediately for the current month
    if plan.monthly_price > 0:
        charge = VendorLedger(
            supplier_id=supplier.id,
            amount=-plan.monthly_price, # Debit
            transaction_type="SUBSCRIPTION",
            description=f"Subscription fee for {plan.name} plan",
            created_at=datetime.utcnow()
        )
        db.add(charge)
    
    # 2. Update Plan
    supplier.plan_id = plan.id
    db.commit()
    
    return {"status": "success", "message": f"Successfully subscribed to {plan.name}"}
