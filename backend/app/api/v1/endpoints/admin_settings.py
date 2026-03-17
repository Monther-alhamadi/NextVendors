from typing import Any, Dict
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.setting import Setting
from app.models.user import User
from app.api.v1.dependencies import require_role, get_current_user
from app.services.security_service import SecurityService
from app.services.maintenance_service import MaintenanceService
from app.api.v1 import schemas
from app.decorators.audit import audit

router = APIRouter(prefix="/admin/settings", tags=["admin-settings"])

@router.get("")
def list_settings(db: Session = Depends(get_db), _admin=Depends(require_role("admin"))):
    settings = db.query(Setting).all()
    # Convert list to key-value dict for easier frontend consumption
    return {s.key: s.value for s in settings}

@router.put("")
@audit("admin.settings.update")
def update_settings(payload: Dict[str, Any], db: Session = Depends(get_db), _admin=Depends(require_role("admin"))):
    for key, value in payload.items():
        setting = db.query(Setting).filter(Setting.key == key).first()
        if setting:
            setting.value = str(value) # store everything as string
        else:
            # Create if not exists (upsert)
            setting = Setting(key=key, value=str(value), type="string")
            db.add(setting)
    
    db.commit()
    # Return updated full list
    return list_settings(db, _admin)

# Public config router (separate prefix usually, but defined here for grouping or imported elsewhere)
public_router = APIRouter(prefix="/public-config", tags=["public-config"])

@public_router.get("")
def get_public_config(db: Session = Depends(get_db)):
    # Expose only safe keys
    SAFE_KEYS = [
        "site_name", "currency", "maintenance_mode", "allow_registrations",
        "announcement_text", "announcement_active", "announcement_variant",
        "ad_rotation_interval"
    ]
    settings = db.query(Setting).filter(Setting.key.in_(SAFE_KEYS)).all()
    
    config = {s.key: s.value for s in settings}
    
    # Cast booleans and integers
    if "maintenance_mode" in config:
        config["maintenance_mode"] = config["maintenance_mode"].lower() == "true"
    if "allow_registrations" in config:
        config["allow_registrations"] = config["allow_registrations"].lower() == "true"
    if "announcement_active" in config:
        config["announcement_active"] = config["announcement_active"].lower() == "true"
        
    if "ad_rotation_interval" in config:
        try:
            config["ad_rotation_interval"] = int(config["ad_rotation_interval"])
        except ValueError:
            config["ad_rotation_interval"] = 5000
    else:
        config["ad_rotation_interval"] = 5000
        
    return config

# --- Maintenance & Health ---

@router.get("/health", response_model=schemas.SystemHealthResponse)
def get_health(
    db: Session = Depends(get_db),
    _u = Depends(require_role("admin"))
):
    service = MaintenanceService(db)
    return service.get_system_health()

@router.post("/backup")
def trigger_backup(
    db: Session = Depends(get_db),
    _u = Depends(require_role("admin"))
):
    service = MaintenanceService(db)
    path = service.perform_backup()
    return {"status": "success", "file": path}

# --- 2FA Security ---

@router.post("/2fa/setup", response_model=schemas.TwoFASecretResponse)
def setup_2fa(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = SecurityService(db)
    secret = service.generate_2fa_secret(current_user.id)
    uri = service.get_provisioning_uri(current_user.id)
    return {"secret": secret, "provisioning_uri": uri}

@router.post("/2fa/verify")
def verify_and_enable_2fa(
    data: schemas.TwoFAVerifyRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = SecurityService(db)
    if service.verify_2fa_code(current_user.id, data.code):
        service.enable_2fa(current_user.id)
        return {"status": "enabled"}
    raise HTTPException(status_code=400, detail="Invalid verification code")

@router.post("/2fa/disable")
def disable_2fa(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = SecurityService(db)
    service.disable_2fa(current_user.id)
    return {"status": "disabled"}
