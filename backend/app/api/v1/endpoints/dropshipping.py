from fastapi import APIRouter, Depends, HTTPException, Query
from app.api.v1.dependencies import get_current_vendor
from app.models.user import User
from app.services.cj_dropshipping_service import cj_service
from app.services.product_service import ProductService
from app.core.database import get_db
from sqlalchemy.orm import Session
from app.api.v1.schemas import ProductCreate

router = APIRouter()

@router.get("/search")
async def search_dropshipping_products(
    keyword: str = Query(..., min_length=2),
    page: int = 1,
    limit: int = 20,
    current_vendor: User = Depends(get_current_vendor)
):
    """
    Search for dropshipping products on the supplier network (CJ Dropshipping).
    """
    try:
        results = await cj_service.search_products(keyword, pageNum=page, pageSize=limit)
        return {"success": True, "data": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/details/{product_id}")
async def get_dropshipping_product_details(
    product_id: str,
    current_vendor: User = Depends(get_current_vendor)
):
    """
    Get the full details of a dropshipping product.
    """
    try:
        details = await cj_service.get_product_details(product_id)
        return {"success": True, "data": details}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/import/{product_id}")
async def import_dropshipping_product(
    product_id: str,
    suggested_retail_price: float,
    current_vendor: User = Depends(get_current_vendor),
    db: Session = Depends(get_db)
):
    """
    Imports a dropshipping product directly into the vendor's catalog.
    Translate CJ fields into our platform's Product schema.
    """
    try:
        # 1. Fetch details from CJ
        cj_product = await cj_service.get_product_details(product_id)
        if not cj_product:
            raise HTTPException(status_code=404, detail="Product not found on supplier network.")
            
        # 2. Map fields to our local ProductCreate schema
        # Fallback to defaults to prevent validation crashes
        name_en = cj_product.get("productNameEn", cj_product.get("productName", "Imported Product"))
        
        product_data = ProductCreate(
            name=name_en, # Using English name, vendor can edit to Arabic later
            description=cj_product.get("description", "Imported Dropshipping Product"),
            price=suggested_retail_price,  # The price the vendor wants to sell it at
            stock=999, # Assume unlimited for dropshipping
            category_id=None, # Vendor should assign later or we assign a generic one
            images=[cj_product.get("productImage")] if cj_product.get("productImage") else [],
            is_active=True # Make it live immediately (or false if we want them to review)
        )
        
        # 3. Create the product via our existing product service
        # Note: We tag it with a vendor_id and potentially a supplier_product_id if we modify the schema
        # For now, we just create it as a regular product owned by this vendor.
        service = ProductService(db)
        new_product = service.create(
            obj=product_data, 
            user_id=current_vendor.id
        )
        
        return {"success": True, "message": "Product imported successfully", "product_id": new_product.id}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
