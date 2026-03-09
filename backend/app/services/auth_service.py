from datetime import datetime, timedelta, timezone
import logging
from typing import Optional
from sqlalchemy.orm import Session
import secrets

from app.models.refresh_token import RefreshToken


class AuthService:
    def __init__(self, db: Session):
        self.db = db
        self.logger = logging.getLogger("auth_service")

    def create_refresh_token(
        self, user_id: int, expires_delta: Optional[timedelta] = None
    ) -> RefreshToken:
        expires = datetime.now(timezone.utc) + (expires_delta or timedelta(days=7))
        token = secrets.token_urlsafe(64)
        rt = RefreshToken(token=token, user_id=user_id, expires_at=expires)
        self.db.add(rt)
        self.db.commit()
        self.db.refresh(rt)
        return rt

    def validate_refresh_token(self, token: str) -> Optional[RefreshToken]:
        # we intentionally do not filter revoked here because we want to detect
        # attempts to use revoked tokens that were replaced (reuse detection)
        rt = self.db.query(RefreshToken).filter(RefreshToken.token == token).first()
        if not rt:
            return None
        # if token already revoked, and it was rotated (replaced_by set),
        # this indicates a reuse of old token -> revoke all sessions
        if rt.revoked:
            if rt.replaced_by_id is not None:
                # reuse of a revoked token detected — log and revoke all tokens
                try:
                    self.logger.warning(
                        "Refresh token reuse detected",
                        extra={"user_id": rt.user_id, "token_id": rt.id},
                    )
                except Exception:
                    # logging should never break logic
                    pass
                # persist an audit entry so this event is searchable in DB
                try:
                    from app.models.refresh_token_audit import RefreshTokenAudit

                    audit = RefreshTokenAudit(
                        user_id=rt.user_id,
                        token_id=rt.id,
                        event_type="reuse_detected",
                        detail="Rotated token used again",
                    )
                    self.db.add(audit)
                    self.db.commit()
                except Exception:
                    # don't blow up on DB audit creation failure — log and continue
                    try:
                        self.logger.exception("Failed to create refresh token audit")
                    except Exception:
                        pass
                self.revoke_all_tokens_for_user(rt.user_id)
            return None
        # Normalize stored expires_at to timezone-aware UTC for comparison
        token_expires = rt.expires_at
        try:
            if token_expires.tzinfo is None:
                token_expires = token_expires.replace(tzinfo=timezone.utc)
        except Exception:
            # In case rt.expires_at is not a datetime (shouldn't happen), treat as expired
            return None

        if token_expires < datetime.now(timezone.utc):
            return None
        return rt

    def revoke_refresh_token(self, token: str):
        q = self.db.query(RefreshToken).filter(RefreshToken.token == token)
        rt = q.first()
        if not rt:
            return False
        rt.revoked = True
        self.db.commit()
        return True

    def revoke_all_tokens_for_user(self, user_id: int):
        q = self.db.query(RefreshToken).filter(
            RefreshToken.user_id == user_id, RefreshToken.revoked.is_(False)
        )
        for token in q.all():
            token.revoked = True
        self.db.commit()
        return True

    def rotate_refresh_token(self, token: str):
        """Rotate an existing refresh token: revoke old token and create a new one."""
        rt = (
            self.db.query(RefreshToken)
            .filter(RefreshToken.token == token, RefreshToken.revoked.is_(False))
            .first()
        )
        if not rt:
            return None
        # revoke the old token
        # mark token revoked and link to replacement
        rt.revoked = True
        # create a new token for the same user
        new_token_val = secrets.token_urlsafe(64)
        expires = datetime.now(timezone.utc) + timedelta(days=7)
        new_rt = RefreshToken(
            token=new_token_val, user_id=rt.user_id, expires_at=expires
        )
        self.db.add(new_rt)
        self.db.commit()
        self.db.refresh(new_rt)
        # link the replaced token to the new token so reuse detection can act
        rt.replaced_by_id = new_rt.id
        self.db.commit()
        self.db.refresh(new_rt)
        return new_rt
