from fastapi import Depends, HTTPException, status
from typing import Optional
from app.models.user import User
from app.api.v1.dependencies import get_current_user
from app.services.product_service import ProductService
from app.core.database import get_db
from sqlalchemy.orm import Session
from app.models.product import Product

def require_product_ownership(
    product_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Product:
    """
    Policy: Ensures the user owns the store that owns the product.
    Returns the product if authorized.
    """
    product = db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # If admin, bypass
    if user.role == "admin" or user.has_permission("manage_products"):
        return product

    # Check vendor ownership
    # User -> Suppliers -> Store -> Product
    # A user can have multiple suppliers/stores? Currently 1-to-1 supplier logic in my mind or 1-to-many?
    # User model has `suppliers` relationship.
    
    user_store_ids = []
    for s in user.suppliers:
        if s.store:
            user_store_ids.append(s.store.id)
            
    if product.store_id not in user_store_ids:
         raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="You do not have permission to edit this product."
        )
        
    return product
