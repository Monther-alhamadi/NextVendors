from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.refresh_token_audit import RefreshTokenAudit
from app.models.audit_log import SystemAuditLog


class AuditService:
    def __init__(self, db: Session):
        self.db = db

    def list_audit_logs(
        self, limit: int = 50, offset: int = 0, user_id: Optional[int] = None
    ) -> List[SystemAuditLog]:
        q = self.db.query(SystemAuditLog).order_by(
            SystemAuditLog.created_at.desc()
        )
        if user_id:
            q = q.filter(SystemAuditLog.user_id == user_id)
        return q.limit(limit).offset(offset).all()

    def record_action(self, action: str, user_id: Optional[int], target_type: Optional[str] = None, target_id: Optional[str] = None, details: Optional[str] = None, ip: Optional[str] = None):
        """Record a system action for audit."""
        log = SystemAuditLog(
            user_id=user_id,
            action=action,
            target_type=target_type,
            target_id=target_id,
            details=details,
            ip_address=ip
        )
        self.db.add(log)
        self.db.commit()
