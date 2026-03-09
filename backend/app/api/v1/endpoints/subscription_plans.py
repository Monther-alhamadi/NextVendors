from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.api.v1 import schemas
from app.models.subscription_plan import SubscriptionPlan
from app.api.v1.dependencies import require_role

router = APIRouter()

@router.get("/", response_model=List[schemas.SubscriptionPlanResponse])
def list_plans(db: Session = Depends(get_db)):
    """List all subscription plans."""
    return db.query(SubscriptionPlan).filter(SubscriptionPlan.is_active == True).all()

@router.post("/", response_model=schemas.SubscriptionPlanResponse, dependencies=[Depends(require_role("admin"))])
def create_plan(plan_in: schemas.SubscriptionPlanCreate, db: Session = Depends(get_db)):
    """Create a new subscription plan (Admin only)."""
    db_plan = SubscriptionPlan(**plan_in.model_dump())
    db.add(db_plan)
    db.commit()
    db.refresh(db_plan)
    return db_plan

@router.put("/{plan_id}", response_model=schemas.SubscriptionPlanResponse, dependencies=[Depends(require_role("admin"))])
def update_plan(plan_id: int, plan_in: schemas.SubscriptionPlanCreate, db: Session = Depends(get_db)):
    """Update a subscription plan (Admin only)."""
    db_plan = db.get(SubscriptionPlan, plan_id)
    if not db_plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    for field, value in plan_in.model_dump().items():
        setattr(db_plan, field, value)
    
    db.commit()
    db.refresh(db_plan)
    return db_plan
