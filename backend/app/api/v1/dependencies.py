from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from typing import Callable, Optional

from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.user import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
    request: Request = None,
) -> User:
    import logging

    logger = logging.getLogger("deps.get_current_user")
    try:
        payload = decode_access_token(token)
        user_id = int(payload.get("sub"))
    except Exception:
        # Log available info for debugging auth failures (avoid logging token value)
        try:
            has_auth_header = (
                bool(request.headers.get("Authorization"))
                if request is not None
                else False
            )
            has_refresh_cookie = (
                bool(request.cookies.get("refresh_token"))
                if request is not None
                else False
            )
            has_csrf_cookie = (
                bool(request.cookies.get("csrf_token"))
                if request is not None
                else False
            )
            logger.warning(
                "Invalid auth credentials: token invalid or missing; Authorization header present=%s, refresh_cookie=%s, csrf_cookie=%s, remote=%s",
                has_auth_header,
                has_refresh_cookie,
                has_csrf_cookie,
                request.client.host if request is not None and request.client else None,
            )
        except Exception:
            logger.warning("Invalid auth credentials; extra context unavailable")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
        )
    # Prefer Session.get for SQLAlchemy 1.4+
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found"
        )
    # Log user identity for successful auth so we can correlate requests
    try:
        logger.info(
            "Authenticated request: user_id=%s username=%s role=%s remote=%s",
            user.id,
            getattr(user, 'username', None),
            getattr(user, 'role', None),
            request.client.host if request is not None and request.client else None,
        )
    except Exception:
        pass
    return user


def get_current_user_optional(
    token: Optional[str] = Depends(oauth2_scheme), db: Session = Depends(get_db)
) -> Optional[User]:
    # Return user if token is valid, otherwise None
    if not token:
        return None
    try:
        payload = decode_access_token(token)
        user_id = int(payload.get("sub"))
    except Exception:
        return None
    user = db.get(User, user_id)
    return user


def require_role(*roles: str) -> Callable:
    def dependency(user: User = Depends(get_current_user)) -> User:
        user_has_required_role = any(user.has_role(role) for role in roles)
        if not user_has_required_role:
            import logging

            logger = logging.getLogger("deps.require_role")
            try:
                logger.warning(
                    "User '%s' attempted to access role-protected endpoint requiring %s",
                    getattr(user, 'username', None),
                    roles,
                )
            except Exception:
                logger.warning(
                    "Access denied for role-protected endpoint (no user details available)"
                )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions"
            )
        return user

    return dependency


def require_permission(permission: str) -> Callable:
    def dependency(user: User = Depends(get_current_user)) -> User:
        if not user.has_permission(permission):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Permission denied"
            )
        return user

    return dependency


def require_role_optional(*roles: str) -> Callable:
    """Optional role dependency; returns user if authenticated and role matches, otherwise None.

    Use this in endpoints that accept optional authentication but use roles when present.
    """

    def dependency(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
        if not token:
            return None
        try:
            payload = decode_access_token(token)
            user_id = int(payload.get("sub"))
        except Exception:
            return None
        user = db.get(User, user_id)
        if not user:
            return None
            
        user_has_required_role = any(user.has_role(role) for role in roles)
        if roles and not user_has_required_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions"
            )
        return user

    return dependency


def get_current_vendor(user: User = Depends(get_current_user)) -> User:
    """Requirement dependency for vendor-only access."""
    if not user.has_role("vendor"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Only vendors can access this resource"
        )
    return user
