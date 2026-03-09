from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from app.core.database import get_db
from app.api.v1.dependencies import get_current_user, require_role
from app.models.user import User
from app.services.order_service import OrderService
from app.models.review import Review
from app.models.product import Product

router = APIRouter(prefix="/reviews", tags=["reviews"])

class ReviewCreate(BaseModel):
    product_id: int
    rating: float
    title: Optional[str] = ""
    content: Optional[str] = ""
class ReviewResponse(BaseModel):
    id: int
    product_id: int
    user_id: int
    rating: float
    title: Optional[str] = ""
    content: str
    vendor_reply: Optional[str] = None
    is_verified: bool = False
    
    class Config:
        from_attributes = True

class VendorReplyUpdate(BaseModel):
    vendor_reply: str

@router.post("/", response_model=ReviewResponse)
def create_review(
    review_in: ReviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Check Verified Purchase
    order_service = OrderService(db)
    is_verified = order_service.user_has_purchased(current_user.id, review_in.product_id)

    # 2. Check overlap (prevent spamming reviews?)
    existing = db.query(Review).filter(
        Review.user_id == current_user.id, 
        Review.product_id == review_in.product_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="You have already reviewed this product")

    # 3. Create Review
    review = Review(
        product_id=review_in.product_id,
        user_id=current_user.id,
        rating=review_in.rating,
        title=review_in.title,
        content=review_in.content,
        is_verified=is_verified
    )
    db.add(review)
    db.commit()
    db.refresh(review)
    return review

@router.get("/product/{product_id}", response_model=List[ReviewResponse])
def list_product_reviews(product_id: int, db: Session = Depends(get_db)):
    return db.query(Review).filter(Review.product_id == product_id).all()

@router.get("/all", response_model=List[ReviewResponse])
def list_all_reviews(
    db: Session = Depends(get_db),
    _u=Depends(require_role("admin"))
):
    return db.query(Review).all()

@router.delete("/{id}")
def delete_review(
    id: int,
    db: Session = Depends(get_db),
    _u=Depends(require_role("admin"))
):
    review = db.query(Review).filter(Review.id == id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    db.delete(review)
    db.commit()
    return {"status": "deleted"}

@router.get("/vendor", response_model=List[ReviewResponse])
def list_vendor_reviews(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("vendor"))
):
    """List all reviews for products owned by this vendor"""
    return db.query(Review)\
        .join(Product)\
        .filter(Product.supplier_id == current_user.id)\
        .all()

@router.patch("/{id}/reply", response_model=ReviewResponse)
def reply_to_review(
    id: int,
    reply_in: VendorReplyUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("vendor"))
):
    """Allow vendor to reply to a review on their product"""
    review = db.query(Review)\
        .join(Product)\
        .filter(Review.id == id, Product.supplier_id == current_user.id)\
        .first()
        
    if not review:
        raise HTTPException(status_code=404, detail="Review not found or not your product")
        
    review.vendor_reply = reply_in.vendor_reply
    db.commit()
    db.refresh(review)
    return review
