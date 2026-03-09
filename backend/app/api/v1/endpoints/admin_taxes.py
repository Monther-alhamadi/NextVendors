from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.api.v1 import schemas
from app.models.tax_rate import TaxRate
from app.api.v1.dependencies import require_role

router = APIRouter()

@router.get("/", response_model=List[schemas.TaxRateResponse])
def list_tax_rates(db: Session = Depends(get_db), _u = Depends(require_role("admin"))):
    return db.query(TaxRate).all()

@router.post("/", response_model=schemas.TaxRateResponse)
def create_tax_rate(rate_in: schemas.TaxRateCreate, db: Session = Depends(get_db), _u = Depends(require_role("admin"))):
    db_rate = TaxRate(**rate_in.model_dump())
    db.add(db_rate)
    db.commit()
    db.refresh(db_rate)
    return db_rate

@router.put("/{rate_id}", response_model=schemas.TaxRateResponse)
def update_tax_rate(rate_id: int, rate_in: schemas.TaxRateUpdate, db: Session = Depends(get_db), _u = Depends(require_role("admin"))):
    db_rate = db.get(TaxRate, rate_id)
    if not db_rate:
        raise HTTPException(status_code=404, detail="Tax rate not found")
    
    update_data = rate_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_rate, field, value)
    
    db.commit()
    db.refresh(db_rate)
    return db_rate

@router.delete("/{rate_id}")
def delete_tax_rate(rate_id: int, db: Session = Depends(get_db), _u = Depends(require_role("admin"))):
    db_rate = db.get(TaxRate, rate_id)
    if not db_rate:
        raise HTTPException(status_code=404, detail="Tax rate not found")
    db.delete(db_rate)
    db.commit()
    return {"status": "success"}
