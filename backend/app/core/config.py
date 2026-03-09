from typing import Optional
from pydantic_settings import BaseSettings
from pydantic import ConfigDict, model_validator, EmailStr
import os
import secrets
import logging
import warnings


class Settings(BaseSettings):
    APP_NAME: str = "ecommerce-store"
    DEBUG: bool = False
    API_V1_STR: str = "/api/v1"
    DATABASE_URL: str = "sqlite:///./test.db"
    # SECURITY: Must be set via JWT_SECRET_KEY env var in production.
    # A random key is generated for dev mode only.
    JWT_SECRET_KEY: str = ""
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24
    # When True, cookies for session/refresh tokens will be set with the Secure flag
    SESSION_COOKIE_SECURE: bool = False
    # Redis URL used for rate limiting and caching.
    # Default is None so tests/local dev without Redis still work.
    # In Docker, set via REDIS_URL env var (e.g. redis://redis:6379/0).
    REDIS_URL: Optional[str] = None
    # Cache TTL settings (seconds)
    CACHE_TTL_CATALOG: int = 300       # Product catalog cache: 5 min
    CACHE_TTL_CATEGORIES: int = 600    # Category list cache: 10 min
    CACHE_TTL_SESSION: int = 3600      # Session/auth cache: 1 hour
    REDIS_MAX_CONNECTIONS: int = 20    # Connection pool size
    # Optional CDN/asset base URL (used to populate CSP and in frontend build)
    ASSETS_BASE_URL: Optional[str] = None
    # Cookie settings
    SESSION_COOKIE_SAMESITE: str = "lax"
    SESSION_COOKIE_DOMAIN: Optional[str] = None
    AUTO_CREATE_DB: bool = False
    # Default tax rate percentage to use when no TaxRate record is present
    DEFAULT_TAX_RATE: float = 0.0
    # Comma-separated list of allowed front-end origins for CORS when running
    # the frontend on a different origin (e.g. Vite dev server). Example:
    # FRONTEND_URLS=http://127.0.0.1:3000,http://localhost:3000
    FRONTEND_URLS: Optional[str] = None
    # Email (SMTP) Configuration
    SMTP_TLS: bool = True
    SMTP_PORT: Optional[int] = None
    SMTP_HOST: Optional[str] = None
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    EMAILS_FROM_EMAIL: Optional[EmailStr] = None
    EMAILS_FROM_NAME: Optional[str] = None

    # Dropshipping (CJ API)
    # SECURITY: CJ API key must be set via CJDROPSHIPPING_API_KEY env var.
    CJDROPSHIPPING_API_KEY: str = ""

    # Social
    GOOGLE_CLIENT_ID: Optional[str] = None

    # Feature flags
    # Enable Raptor mini preview (set to true to enable globally)
    ENABLE_RAPTOR_MINI: bool = True
    # Only instruct Pydantic to load an env_file when one exists in the
    # current working directory. Avoids the "Config file '.env' not found"
    # warning when running without an .env file mounted (e.g. CI or some
    # Docker configurations where env vars are provided via the environment).
    _env_file = ".env" if os.path.exists(".env") else None
    model_config = ConfigDict(env_file=_env_file)


def _create_settings() -> Settings:
    """Create settings with security validation."""
    s = Settings()
    _insecure_defaults = ("", "super-secret-key", "secret", "changeme")
    if s.JWT_SECRET_KEY in _insecure_defaults:
        if s.DEBUG:
            # Auto-generate a random key for development convenience
            s.JWT_SECRET_KEY = secrets.token_urlsafe(64)
            warnings.warn(
                "JWT_SECRET_KEY not set — using random key (dev only). "
                "Set JWT_SECRET_KEY env var for production.",
                stacklevel=2,
            )
        else:
            raise RuntimeError(
                "SECURITY ERROR: JWT_SECRET_KEY is not configured. "
                "Set a strong random value via the JWT_SECRET_KEY environment variable."
            )
    return s


settings = _create_settings()
