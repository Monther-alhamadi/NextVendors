from passlib.context import CryptContext
from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import jwt
from .config import settings
import asyncio
import secrets

# Use PBKDF2-SHA256 for password hashing in this environment to avoid
# native bcrypt backend issues in some CI/Windows environments.
pwd_context = CryptContext(
    schemes=["pbkdf2_sha256"], pbkdf2_sha256__rounds=30000, deprecated="auto"
)


def get_password_hash(password: str) -> str:
    """Hash a password using the configured passlib context (PBKDF2-SHA256)."""
    return pwd_context.hash(password)


async def get_password_hash_async(password: str) -> str:
    """Non-blocking wrapper — runs CPU-bound hashing in a worker thread."""
    return await asyncio.to_thread(pwd_context.hash, password)


def needs_rehash(hashed_password: str) -> bool:
    """Return True if the stored hash needs to be upgraded to the current policy.

    This allows the application to transparently re-hash passwords on successful
    authentication if the hashing policy has been strengthened (e.g. increased
    iterations).
    """
    try:
        return pwd_context.needs_update(hashed_password)
    except Exception:
        # If passlib cannot identify the hash format, consider re-hashing.
        return True


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against the stored hash.

    If verification via passlib fails, fall back to a legacy sha256 comparison
    (constant-time) to keep existing dev/test fixtures working until migrated.
    """
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception:
        # Legacy fallback: constant-time compare of sha256 digests
        import hashlib
        import hmac

        sha = hashlib.sha256(plain_password.encode("utf-8")).hexdigest()
        return hmac.compare_digest(sha, hashed_password)


async def verify_password_async(plain_password: str, hashed_password: str) -> bool:
    """Non-blocking wrapper — runs CPU-bound verification in a worker thread."""
    return await asyncio.to_thread(verify_password, plain_password, hashed_password)


def create_access_token(subject: str, expires_delta: Optional[timedelta] = None) -> str:
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode = {"sub": str(subject), "exp": expire}
    encoded_jwt = jwt.encode(
        to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM
    )
    return encoded_jwt


def decode_access_token(token: str) -> dict:
    return jwt.decode(
        token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM]
    )


def create_csrf_token() -> str:
    """Create a short-lived CSRF token for the double-submit cookie pattern."""
    return secrets.token_urlsafe(32)
