from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.api.v1 import schemas
from app.services.shipping_admin_service import ShippingAdminService
from app.api.v1.dependencies import require_role

router = APIRouter(prefix="/admin/logistics", tags=["logistics"])

@router.get("/providers", response_model=List[schemas.ShippingProviderResponse])
def list_providers(db: Session = Depends(get_db), _u=Depends(require_role("admin"))):
    service = ShippingAdminService(db)
    return service.list_providers()

@router.post("/providers", response_model=schemas.ShippingProviderResponse)
def create_provider(data: schemas.ShippingProviderCreate, db: Session = Depends(get_db), _u=Depends(require_role("admin"))):
    service = ShippingAdminService(db)
    return service.create_provider(data)

@router.put("/providers/{id}", response_model=schemas.ShippingProviderResponse)
def update_provider(id: int, data: dict, db: Session = Depends(get_db), _u=Depends(require_role("admin"))):
    service = ShippingAdminService(db)
    res = service.update_provider(id, data)
    if not res: raise HTTPException(status_code=404)
    return res

@router.get("/zones", response_model=List[schemas.ShippingZoneResponse])
def list_zones(db: Session = Depends(get_db), _u=Depends(require_role("admin"))):
    service = ShippingAdminService(db)
    return service.list_zones()

@router.post("/zones", response_model=schemas.ShippingZoneResponse)
def create_zone(data: schemas.ShippingZoneCreate, db: Session = Depends(get_db), _u=Depends(require_role("admin"))):
    service = ShippingAdminService(db)
    return service.create_zone(data)

@router.delete("/zones/{id}")
def delete_zone(id: int, db: Session = Depends(get_db), _u=Depends(require_role("admin"))):
    service = ShippingAdminService(db)
    if not service.delete_zone(id): raise HTTPException(status_code=404)
    return {"status": "deleted"}
