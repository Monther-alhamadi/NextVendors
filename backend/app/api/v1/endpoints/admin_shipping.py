from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.api.v1 import schemas
from app.models.shipping_provider import ShippingProvider
from app.models.shipping_zone import ShippingZone
from app.api.v1.dependencies import require_role

router = APIRouter()

# --- Providers ---
@router.get("/providers", response_model=List[schemas.ShippingProviderResponse])
def list_providers(db: Session = Depends(get_db), _u = Depends(require_role("admin"))):
    return db.query(ShippingProvider).all()

@router.post("/providers", response_model=schemas.ShippingProviderResponse)
def create_provider(prov_in: schemas.ShippingProviderCreate, db: Session = Depends(get_db), _u = Depends(require_role("admin"))):
    db_prov = ShippingProvider(**prov_in.model_dump())
    db.add(db_prov)
    db.commit()
    db.refresh(db_prov)
    return db_prov

# --- Zones ---
@router.get("/zones", response_model=List[schemas.ShippingZoneResponse])
def list_zones(db: Session = Depends(get_db), _u = Depends(require_role("admin"))):
    return db.query(ShippingZone).all()

@router.post("/zones", response_model=schemas.ShippingZoneResponse)
def create_zone(zone_in: schemas.ShippingZoneCreate, db: Session = Depends(get_db), _u = Depends(require_role("admin"))):
    db_zone = ShippingZone(**zone_in.model_dump())
    db.add(db_zone)
    db.commit()
    db.refresh(db_zone)
    return db_zone

@router.put("/zones/{zone_id}", response_model=schemas.ShippingZoneResponse)
def update_zone(zone_id: int, zone_in: schemas.ShippingZoneCreate, db: Session = Depends(get_db), _u = Depends(require_role("admin"))):
    db_zone = db.get(ShippingZone, zone_id)
    if not db_zone:
        raise HTTPException(status_code=404, detail="Zone not found")
    
    for field, value in zone_in.model_dump().items():
        setattr(db_zone, field, value)
    
    db.commit()
    db.refresh(db_zone)
    return db_zone

@router.delete("/zones/{zone_id}")
def delete_zone(zone_id: int, db: Session = Depends(get_db), _u = Depends(require_role("admin"))):
    db_zone = db.get(ShippingZone, zone_id)
    if not db_zone:
        raise HTTPException(status_code=404, detail="Zone not found")
    db.delete(db_zone)
    db.commit()
    return {"status": "success"}
