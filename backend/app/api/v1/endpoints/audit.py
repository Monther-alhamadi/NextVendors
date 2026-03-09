from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.api.v1.dependencies import require_role
from app.services.audit_service import AuditService
from pydantic import BaseModel
from datetime import datetime

router = APIRouter(prefix="/audit", tags=["audit"])

class AuditLogResponse(BaseModel):
    id: int
    user_id: Optional[int]
    action: str
    target_type: Optional[str]
    target_id: Optional[str]
    details: Optional[str]
    ip_address: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

@router.get("/", response_model=List[AuditLogResponse])
def get_audit_logs(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    user_id: Optional[int] = None,
    db: Session = Depends(get_db),
    _admin = Depends(require_role("admin"))
):
    service = AuditService(db)
    logs = service.list_audit_logs(limit=limit, offset=offset, user_id=user_id)
    return logs
