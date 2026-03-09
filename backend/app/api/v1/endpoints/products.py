from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from typing import List
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.rate_limiter import limiter
from app.decorators.monitor import log_and_time
from app.core.cache import get_cache_ns, set_cache_ns
from app.core.config import settings
from app.services.product_service import ProductService
from app.api.v1.schemas import ProductCreate, ProductResponse
from app.api.v1.schemas import VariantCreate, VariantResponse
from app.api.v1.schemas import (
    VariationVariableCreate,
    VariationVariableResponse,
    VariationValueCreate,
    VariationValueResponse,
    VariationResultCreate,
    VariationResultResponse,
)
from app.api.v1.dependencies import require_role
from app.decorators.audit import audit
from app.decorators.sanitize import sanitize_inputs
import json
import hashlib

# from app.models.product import Product  # kept as reference - not required by endpoint handlers
from app.models.product_image import ProductImage
from app.models.supplier_product import SupplierProduct

router = APIRouter(prefix="/products", tags=["products"])

CACHE_NS = "products"


def _cache_key(*parts) -> str:
    """Build a short, deterministic cache key from query parameters."""
    raw = "|".join(str(p) for p in parts)
    return hashlib.md5(raw.encode()).hexdigest()


@router.get("/categories")
@limiter.limit("30/minute")
def list_categories(request: Request, db: Session = Depends(get_db)):
    """Return all distinct product categories that have at least one published, approved product."""
    # ── Cache check ──
    cache_key = "categories:all"
    cached = get_cache_ns(CACHE_NS, cache_key)
    if cached:
        try:
            return json.loads(cached)
        except Exception:
            pass

    from app.models.product import Product as ProductModel
    rows = (
        db.query(ProductModel.category)
        .filter(
            ProductModel.status == "published",
            ProductModel.moderation_status == "approved",
            ProductModel.category.isnot(None),
            ProductModel.category != "",
        )
        .distinct()
        .all()
    )
    result = [r[0] for r in rows if r[0]]

    # ── Cache store ──
    set_cache_ns(CACHE_NS, cache_key, json.dumps(result, default=str),
                 ttl=settings.CACHE_TTL_CATEGORIES)
    return result


@router.get("/")
@limiter.limit("30/minute")
@log_and_time
def list_products(
    request: Request,
    q: str = Query(None, description="Full-text search query"),
    category: str = Query(None, description="Filter by category name"),
    min_price: float = Query(None, ge=0, description="Minimum price"),
    max_price: float = Query(None, ge=0, description="Maximum price"),
    sort_by: str = Query("newest", description="Sort order: newest | price_asc | price_desc | popular"),
    in_stock: bool = Query(None, description="Only show products with inventory > 0"),
    supplier_id: int = Query(None, description="Filter by supplier"),
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db),
):
    """
    List published products with full filtering, sorting, and server-side pagination.
    Returns: { items: [...], total: int, page: int, pages: int }
    """
    # ── Cache check ──
    ck = _cache_key("list", q, category, min_price, max_price, sort_by,
                     in_stock, supplier_id, page, page_size)
    cached = get_cache_ns(CACHE_NS, ck)
    if cached:
        try:
            return json.loads(cached)
        except Exception:
            pass

    service = ProductService(db)
    result = service.filter_products(
        q=q,
        category=category,
        min_price=min_price,
        max_price=max_price,
        sort_by=sort_by,
        in_stock=in_stock,
        supplier_id=supplier_id,
        page=page,
        page_size=page_size,
    )

    # ── Cache store — serialize ORM objects safely ──
    set_cache_ns(CACHE_NS, ck, json.dumps(result, default=str),
                 ttl=settings.CACHE_TTL_CATALOG)
    return result


@router.post("/", response_model=ProductResponse)
@audit("product.create")
@sanitize_inputs
def create_product(
    product_in: ProductCreate,
    request: Request,
    db: Session = Depends(get_db),
    _u=Depends(require_role("admin")),
):
    service = ProductService(db)
    # Pydantic v2: use `model_dump()` instead of deprecated `dict()`.
    # Keep a dict payload and let ProductService.create handle creating the
    # ORM instance and any related objects (images/categories). This prevents
    # passing unknown keyword arguments (e.g., `images`) to the Product
    # constructor which raises a TypeError on some SQLAlchemy versions.
    # Prevent default values (e.g., default-empty lists) from becoming keys in
    # the payload that could accidentally be passed to SQLAlchemy constructors.
    # Use exclude_unset & exclude_none to only include fields the client set.
    new_product_data = (
        product_in.model_dump(exclude_unset=True, exclude_none=True)
        if hasattr(product_in, "model_dump")
        else product_in.dict(exclude_unset=True, exclude_none=True)
    )
    import logging

    logger = logging.getLogger("endpoints.products")
    # Log contextual request info for debugging: avoid logging token values
    try:
        logger.info(
            "create_product request: remote=%s user=%s role=%s has_auth_header=%s has_csrf_header=%s has_refresh_cookie=%s",
            request.client.host if request and request.client else None,
            getattr(_u, 'username', None),
            getattr(_u, 'role', None),
            bool(request.headers.get('Authorization')),
            bool(request.headers.get('X-CSRF-Token')),
            bool(request.cookies.get('refresh_token')),
        )
    except Exception:
        logger.info("create_product request: context logging failed")
    logger.info("create_product payload keys: %s", list(new_product_data.keys()))
    try:
        created = service.create(new_product_data)
    except Exception as e:
        logger.exception(
            "Failed to create product: %s; payload=%s", e, new_product_data
        )
        # Surface a clearer error to client while keeping the stack trace in logs
        raise HTTPException(
            status_code=500,
            detail="Failed to create product; see server logs for details",
        )
    # include optional category and images (images come from Product.images relationship)
    images = [
        {
            "id": img.id,
            "url": img.url,
            "kind": getattr(img, "kind", "image"),
            "position": getattr(img, "position", 0),
            "public": getattr(img, "public", True),
        }
        for img in db.query(ProductImage)
        .filter(ProductImage.product_id == getattr(created, "id", None))
        .all()
    ]
    variants = [
        {
            "id": v.id,
            "product_id": v.product_id,
            "sku": v.sku,
            "name": v.name,
            "price": v.price,
            "inventory": v.inventory,
            "active": v.active,
        }
        for v in service.get_variants(getattr(created, "id", None))
    ]
    out = {
        "id": created.id,
        "name": created.name,
        "description": created.description,
        "price": created.price,
        "inventory": created.inventory,
        "category": getattr(created, "category", None),
        "images": images,
        "variants": variants,
    }
    return out


@router.put("/{product_id}", response_model=ProductResponse)
@audit("product.update")
@sanitize_inputs
def update_product(
    product_id: int,
    product_in: ProductCreate,
    db: Session = Depends(get_db),
    _u=Depends(require_role("admin")),
):
    import logging

    logger = logging.getLogger("endpoints.products")
    service = ProductService(db)
    new_product_data = (
        product_in.model_dump(exclude_unset=True, exclude_none=True)
        if hasattr(product_in, "model_dump")
        else product_in.dict(exclude_unset=True, exclude_none=True)
    )
    logger.info("update_product data: %s", new_product_data)
    updated = service.update(product_id, new_product_data)
    if not updated:
        raise HTTPException(status_code=404, detail="Product not found")
    logger.info(
        "updated product attrs: id=%s name=%s price=%s inventory=%s",
        getattr(updated, 'id', None),
        getattr(updated, 'name', None),
        getattr(updated, 'price', None),
        getattr(updated, 'inventory', None),
    )
    images = [
        {
            "id": img.id,
            "url": img.url,
            "kind": getattr(img, "kind", "image"),
            "position": getattr(img, "position", 0),
            "public": getattr(img, "public", True),
        }
        for img in db.query(ProductImage)
        .filter(ProductImage.product_id == getattr(updated, "id", None))
        .all()
    ]
    variants = [
        {
            "id": v.id,
            "product_id": v.product_id,
            "sku": v.sku,
            "name": v.name,
            "price": v.price,
            "inventory": v.inventory,
            "active": v.active,
        }
        for v in service.get_variants(getattr(updated, "id", None))
    ]
    return {
        "id": updated.id,
        "name": updated.name,
        "description": updated.description,
        "price": updated.price,
        "inventory": updated.inventory,
        "category": getattr(updated, "category", None),
        "images": images,
        "variants": variants,
    }


@router.delete("/{product_id}")
@audit("product.delete")
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    _u=Depends(require_role("admin")),
):
    service = ProductService(db)
    ok = service.delete(product_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"status": "ok"}


@router.get("/{product_id}", response_model=ProductResponse)
@limiter.limit("60/minute")
@log_and_time
def get_product(product_id: int, request: Request, db: Session = Depends(get_db)):
    service = ProductService(db)
    # Try Redis cached product details
    cached_key = f"{product_id}"
    if settings.REDIS_URL:
        cached = get_cache_ns("product", cached_key)
        if cached:
            import json

            return json.loads(cached)

    p = service.get_by_id(product_id)
    if not p:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Product not found"
        )
    # Build response dict to ensure images/variants metadata are included
    images = [
        {
            "id": img.id,
            "url": img.url,
            "kind": getattr(img, "kind", "image"),
            "position": getattr(img, "position", 0),
            "public": getattr(img, "public", True),
        }
        for img in db.query(ProductImage)
        .filter(ProductImage.product_id == getattr(p, "id", None))
        .all()
    ]
    variants = [
        {
            "id": v.id,
            "product_id": v.product_id,
            "sku": v.sku,
            "name": v.name,
            "price": v.price,
            "inventory": v.inventory,
            "active": v.active,
        }
        for v in service.get_variants(getattr(p, "id", None))
    ]
    supplier_links = [
        {
             "supplier_id": sp.supplier_id,
             "product_id": sp.product_id,
             "cost_price": sp.cost_price,
             "inventory": sp.inventory,
             "currency": sp.currency,
             "sku_vendor": sp.sku_vendor,
             "vendor_name": sp.supplier.name if sp.supplier else "Unknown",
             "whatsapp_number": sp.supplier.whatsapp_number if sp.supplier else None,
             "allow_direct_orders": getattr(sp.supplier, 'allow_direct_orders', False) if sp.supplier else False,
             "preferred_settlement_method": getattr(sp.supplier, 'preferred_settlement_method', 'platform') if sp.supplier else "platform"
        }
        for sp in db.query(SupplierProduct).filter(SupplierProduct.product_id == getattr(p, "id", None)).all()
    ]
    pdata = {
        "id": p.id,
        "name": p.name,
        "description": p.description,
        "price": p.price,
        "inventory": p.inventory,
        "category": getattr(p, "category", None),
        "images": images,
        "variants": variants,
        "supplier_products": supplier_links,
    }
    if settings.REDIS_URL and p:
        from datetime import datetime, date

        def _serialize_val(v):
            if isinstance(v, (datetime, date)):
                return v.isoformat()
            return v

        set_cache_ns("product", cached_key, pdata, ttl=180)
    return pdata


# Variant endpoints
@router.get("/{product_id}/variants", response_model=List[VariantResponse])
def list_variants(product_id: int, db: Session = Depends(get_db)):
    service = ProductService(db)
    return service.get_variants(product_id)


@router.post("/{product_id}/variants", response_model=VariantResponse)
@audit("product.variant.create")
def create_variant(
    product_id: int,
    variant_in: VariantCreate,
    db: Session = Depends(get_db),
    _u=Depends(require_role("admin")),
):
    service = ProductService(db)
    try:
        pv = service.create_variant(
            product_id,
            (
                variant_in.model_dump()
                if hasattr(variant_in, "model_dump")
                else variant_in.dict()
            ),
        )
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to create variant")
    return pv


@router.put("/{product_id}/variants/{variant_id}", response_model=VariantResponse)
@audit("product.variant.update")
def update_variant(
    product_id: int,
    variant_id: int,
    variant_in: VariantCreate,
    db: Session = Depends(get_db),
    _u=Depends(require_role("admin")),
):
    service = ProductService(db)
    pv = service.update_variant(
        variant_id,
        (
            variant_in.model_dump()
            if hasattr(variant_in, "model_dump")
            else variant_in.dict()
        ),
    )
    if not pv:
        raise HTTPException(status_code=404, detail="Variant not found")
    return pv


@router.delete("/{product_id}/variants/{variant_id}")
@audit("product.variant.delete")
def delete_variant(
    product_id: int,
    variant_id: int,
    db: Session = Depends(get_db),
    _u=Depends(require_role("admin")),
):
    service = ProductService(db)
    ok = service.delete_variant(variant_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Variant not found")
    return {"status": "ok"}


# Variation variable endpoints
@router.get(
    "/{product_id}/variation_variables", response_model=List[VariationVariableResponse]
)
def list_variation_variables(product_id: int, db: Session = Depends(get_db)):
    service = ProductService(db)
    return service.get_variation_variables(product_id)


@router.post(
    "/{product_id}/variation_variables", response_model=VariationVariableResponse
)
@audit("product.variation_variable.create")
def create_variation_variable(
    product_id: int,
    var_in: VariationVariableCreate,
    db: Session = Depends(get_db),
    _u=Depends(require_role("admin")),
):
    service = ProductService(db)
    try:
        pv = service.create_variation_variable(
            product_id,
            var_in.model_dump() if hasattr(var_in, "model_dump") else var_in.dict(),
        )
    except Exception:
        raise HTTPException(
            status_code=500, detail="Failed to create variation variable"
        )
    return pv


@router.post(
    "/variation_variables/{variable_id}/values", response_model=VariationValueResponse
)
@audit("product.variation_value.create")
def create_variation_value(
    variable_id: int,
    val_in: VariationValueCreate,
    db: Session = Depends(get_db),
    _u=Depends(require_role("admin")),
):
    service = ProductService(db)
    try:
        vv = service.create_variation_value(
            variable_id,
            val_in.model_dump() if hasattr(val_in, "model_dump") else val_in.dict(),
        )
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to create variation value")
    return vv


@router.post("/{product_id}/variation_results", response_model=VariationResultResponse)
@audit("product.variation_result.set")
def set_variation_result(
    product_id: int,
    indata: VariationResultCreate,
    db: Session = Depends(get_db),
    _u=Depends(require_role("admin")),
):
    service = ProductService(db)
    try:
        pvr = service.set_variation_result(
            product_id, indata.mapping, indata.result_product_id
        )
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to set variation result")
    return pvr


@router.post("/{product_id}/resolve_variation")
def resolve_variation(product_id: int, indata: dict, db: Session = Depends(get_db)):
    service = ProductService(db)
    mapped = indata.get("mapping") if isinstance(indata, dict) else None
    if not mapped:
        raise HTTPException(status_code=400, detail="mapping required")
    res = service.resolve_variation_result(product_id, mapped)
    if not res:
        raise HTTPException(status_code=404, detail="No matching variation result")
    return {"id": res.id, "name": res.name, "price": res.price}
