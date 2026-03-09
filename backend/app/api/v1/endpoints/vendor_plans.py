from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.api.v1 import schemas
from app.models.vendor_plan import VendorPlan
from app.api.v1.dependencies import require_role

router = APIRouter()

@router.get("/", response_model=List[schemas.VendorPlanResponse])
def list_vendor_plans(db: Session = Depends(get_db)):
    """List all vendor plans."""
    return db.query(VendorPlan).all()

@router.post("/", response_model=schemas.VendorPlanResponse, dependencies=[Depends(require_role("admin"))])
def create_vendor_plan(plan_in: schemas.VendorPlanCreate, db: Session = Depends(get_db)):
    """Create a new vendor plan (Admin only)."""
    existing = db.query(VendorPlan).filter_by(name=plan_in.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Plan with this name already exists")
        
    db_plan = VendorPlan(**plan_in.model_dump())
    db.add(db_plan)
    db.commit()
    db.refresh(db_plan)
    return db_plan

@router.put("/{plan_id}", response_model=schemas.VendorPlanResponse, dependencies=[Depends(require_role("admin"))])
def update_vendor_plan(plan_id: int, plan_in: schemas.VendorPlanUpdate, db: Session = Depends(get_db)):
    """Update a vendor plan (Admin only)."""
    db_plan = db.get(VendorPlan, plan_id)
    if not db_plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    update_data = plan_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_plan, field, value)
    
    db.commit()
    db.refresh(db_plan)
    return db_plan

@router.delete("/{plan_id}", response_model=dict, dependencies=[Depends(require_role("admin"))])
def delete_vendor_plan(plan_id: int, db: Session = Depends(get_db)):
    """Delete a vendor plan."""
    db_plan = db.get(VendorPlan, plan_id)
    if not db_plan:
        raise HTTPException(status_code=404, detail="Plan not found")
        
    if db_plan.suppliers:
         raise HTTPException(status_code=400, detail="Cannot delete plan currently assigned to suppliers.")
    
    db.delete(db_plan)
    db.commit()
    return {"status": "success", "message": "Plan deleted"}
