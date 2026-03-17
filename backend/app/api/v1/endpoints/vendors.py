from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.vendor_service import VendorService
from app.models.user import User
from app.api.v1.dependencies import require_role, get_current_user

router = APIRouter(prefix="/vendors", tags=["vendors"])

from app.api.v1.schemas import VendorCreate, VendorResponse, SupplierProductLink, ProductResponse, VendorRegistration, VendorUpdate

@router.post("/register", response_model=VendorResponse)
def register_vendor(
    data: VendorRegistration,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = VendorService(db)
    try:
        return service.register_vendor(current_user.id, data.dict())
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/me", response_model=VendorResponse)
def update_my_vendor_profile(
    data: VendorUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = VendorService(db)
    # Find vendor owned by user
    from app.models.supplier import Supplier
    vendor = db.query(Supplier).filter(Supplier.owner_id == current_user.id).first()
    
    if not vendor:
        raise HTTPException(status_code=404, detail="You do not have a vendor profile")
        
    elite_fields = ["theme_color", "background_image_url", "store_ads", "announcement_text"]
    update_data = data.dict(exclude_unset=True)
    if any(field in update_data for field in elite_fields):
        from app.services.capability_service import CapabilityService
        cap_service = CapabilityService(db)
        if not cap_service.check_can_customize_store(vendor.id):
            raise HTTPException(status_code=403, detail="Store customization requires an Elite subscription update.")
            
    return service.update(vendor.id, update_data)

@router.get("/")
def list_vendors(
    db: Session = Depends(get_db),
    search: str = None,
    sort_by: str = "newest",
    category: str = None,
):
    from app.models.supplier import Supplier
    from app.models.vendor_follower import VendorFollower
    from sqlalchemy import func, desc

    query = db.query(Supplier).filter(Supplier.status == "active")

    # Search filter
    if search:
        query = query.filter(
            Supplier.name.ilike(f"%{search}%") | Supplier.description.ilike(f"%{search}%")
        )

    # Category filter (if vendor has a category field)
    if category:
        query = query.filter(Supplier.category == category)

    vendors = query.all()

    # Enrich with follower counts
    result = []
    for v in vendors:
        followers = db.query(func.count(VendorFollower.id)).filter(
            VendorFollower.supplier_id == v.id
        ).scalar() or 0
        result.append({
            "id": v.id,
            "name": v.name,
            "code": getattr(v, "code", None),
            "description": v.description,
            "logo_url": v.logo_url,
            "theme_color": getattr(v, "theme_color", None),
            "background_image_url": getattr(v, "background_image_url", None),
            "status": v.status,
            "is_verified": getattr(v, "is_verified", False),
            "followers_count": followers,
            "total_sales": getattr(v, "total_sales", 0),
            "rating": getattr(v, "rating", 0.0),
        })

    # Sort
    if sort_by == "followers":
        result.sort(key=lambda x: x.get("followers_count", 0), reverse=True)
    elif sort_by == "sales":
        result.sort(key=lambda x: x.get("total_sales", 0), reverse=True)
    elif sort_by == "rating":
        result.sort(key=lambda x: x.get("rating", 0.0), reverse=True)
    elif sort_by == "name":
        result.sort(key=lambda x: x.get("name", ""))
    # default "newest" is DB insertion order (already correct)

    return result

@router.get("/{id}")
def get_vendor_by_id(id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    from app.models.vendor_follower import VendorFollower
    service = VendorService(db)
    vendor = service.get_by_id(id)
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
        
    followers_count = db.query(VendorFollower).filter(VendorFollower.supplier_id == id).count()
    is_following = False
    if current_user:
        is_following = db.query(VendorFollower).filter(
            VendorFollower.supplier_id == id,
            VendorFollower.user_id == current_user.id
        ).first() is not None

    vendor_dict = {
        "id": vendor.id,
        "name": vendor.name,
        "code": vendor.code,
        "description": vendor.description,
        "logo_url": vendor.logo_url,
        "theme_color": vendor.theme_color,
        "background_image_url": vendor.background_image_url,
        "followers_count": followers_count,
        "is_following": is_following
    }
    return vendor_dict

@router.post("/{id}/follow", status_code=status.HTTP_201_CREATED)
def follow_store(id: int, db: Session = Depends(get_db), current_user: User = Depends(require_role("customer"))):
    from app.models.vendor_follower import VendorFollower
    from app.models.supplier import Supplier
    
    vendor = db.query(Supplier).get(id)
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
        
    existing_follow = db.query(VendorFollower).filter(
        VendorFollower.supplier_id == id,
        VendorFollower.user_id == current_user.id
    ).first()
    
    if existing_follow:
        return {"status": "following", "message": "Already following this store"}
        
    new_follow = VendorFollower(user_id=current_user.id, supplier_id=id)
    db.add(new_follow)
    db.commit()
    
    return {"status": "following"}

@router.delete("/{id}/unfollow")
def unfollow_store(id: int, db: Session = Depends(get_db), current_user: User = Depends(require_role("customer"))):
    from app.models.vendor_follower import VendorFollower
    
    follow_rec = db.query(VendorFollower).filter(
        VendorFollower.supplier_id == id,
        VendorFollower.user_id == current_user.id
    ).first()
    
    if follow_rec:
        db.delete(follow_rec)
        db.commit()
        
    return {"status": "unfollowed"}

@router.post("/", response_model=VendorResponse)
def create_vendor(
    vendor_in: VendorCreate,
    db: Session = Depends(get_db),
    _u=Depends(require_role("admin"))
):
    service = VendorService(db)
    # Check if exists
    if service.get_by_code(vendor_in.code):
        raise HTTPException(status_code=400, detail="Vendor code already exists. Please choose a unique code.")
    
    # Handle Owner Linkage
    owner_id = None
    if vendor_in.owner_email and str(vendor_in.owner_email).strip():
        from app.models.user import User
        user = db.query(User).filter(User.email == vendor_in.owner_email).first()
        if not user:
             raise HTTPException(status_code=400, detail=f"User with email {vendor_in.owner_email} not found")
        owner_id = user.id

    data = vendor_in.dict(exclude={"owner_email"})
    data["owner_id"] = owner_id
    
    return service.create(data)

@router.put("/{vendor_id}", response_model=VendorResponse)
def update_vendor(
    vendor_id: int,
    data: VendorUpdate,
    db: Session = Depends(get_db),
    _u=Depends(require_role("admin"))
):
    service = VendorService(db)
    return service.update(vendor_id, data.dict(exclude_unset=True))

@router.put("/{vendor_id}/status")
def update_vendor_status(
    vendor_id: int,
    status: str, # "active" or "rejected"
    db: Session = Depends(get_db),
    _u=Depends(require_role("admin"))
):
    service = VendorService(db)
    vendor = service.get_by_id(vendor_id)
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    
    # Update status
    vendor.status = status
    if status == "active":
        vendor.is_verified = True
    elif status == "rejected":
        vendor.is_verified = False
        
    db.commit()
    return {"status": "updated", "new_status": status, "is_verified": vendor.is_verified}

@router.post("/{vendor_id}/products/{product_id}", response_model=dict)
def link_product_to_vendor(
    vendor_id: int,
    product_id: int,
    link_in: SupplierProductLink,
    db: Session = Depends(get_db),
    _u=Depends(require_role("admin"))
):
    service = VendorService(db)
    try:
        link = service.link_product(
            supplier_id=vendor_id,
            product_id=product_id,
            cost_price=link_in.cost_price,
            inventory=link_in.inventory,
            currency=link_in.currency,
            sku_vendor=link_in.sku_vendor
        )
        return {"status": "ok", "inventory": link.inventory, "cost": link.cost_price}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{vendor_id}/products", response_model=List[dict]) 
# Ideally return a schema, but for now returning raw dict or customized response
def get_vendor_products(
    vendor_id: int,
    db: Session = Depends(get_db)
):
    service = VendorService(db)
    links = service.get_supplier_products(vendor_id)
    # Simple formatting
    out = []
    for link in links:
        out.append({
            "product_id": link.product_id,
            "product_name": link.product.name if link.product else "Unknown",
            "inventory": link.inventory,
            "cost_price": link.cost_price,
            "sku_vendor": link.sku_vendor
        })
    return out
