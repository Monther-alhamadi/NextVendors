"""Cleaned FastAPI application entrypoint.

This module exposes a single `app` instance for the project. It follows
Clean Code principles: small functions, meaningful names, centralized
startup and error handling, and type hints where useful.
"""

from typing import Dict, Any, Optional
from contextlib import asynccontextmanager

import importlib
import io
import os
import sys
import time
import uuid
import logging
import tempfile
from pathlib import Path

# Robust module resolution for the 'app' package at runtime.
_backend_dir = Path(__file__).resolve().parent
if str(_backend_dir) not in sys.path:
    sys.path.insert(0, str(_backend_dir))

try:
    import app  # noqa: F401
except (ImportError, ModuleNotFoundError):
    try:
        # Fallback for when backend is treated as a sub-package
        from backend import app as app
    except ImportError:
        pass

from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.requests import Request
from starlette.responses import JSONResponse

from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.api.v1.endpoints import (
    auth,
    products,
    orders,
    vendors,
    supplier_portal,
    analytics,
    rma,
    admin_users,
    admin_orders,
    messaging,
    notifications,
    subscription_plans,
    shipping_admin,
    support,
    admin_cache,
    logs,
    audit as audit_endpoint,
)
from app.api.v1.endpoints import cart as cart_router
from app.api.v1.endpoints import wishlist as wishlist_router
from app.api.v1.endpoints import notifications as notifications_router
from app.api.v1.endpoints import supplier_portal as supplier_router
from app.api.v1.endpoints import payouts as payouts_router
from app.api.v1.endpoints import rma as rma_router
from app.api.v1.endpoints import analytics as analytics_router
from app.core.cache_control_middleware import CacheControlMiddleware
from app.core.config import settings
from app.core.logging_config import get_logger, init_logging
from app.core.monitoring import init_monitoring
from app.core.middleware import SecurityHeadersMiddleware
from app.core.rate_limiter import limiter
from app.core.database import get_db
from sqlalchemy.orm import Session
from app.decorators.audit import audit
from app.api.v1.dependencies import require_role
from app.decorators.security import require_csrf


APP_TITLE = "Ecommerce Store API"

# Allowed image mime types -> normalized extension mapping
ALLOWED_IMAGE_MIME_MAP: Dict[str, str] = {
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/gif": ".gif",
    "image/webp": ".webp",
}


def create_app() -> FastAPI:
    init_logging()
    logger = get_logger(__name__)

    class StartupManager:
        """Encapsulate startup/shutdown tasks for clarity and testability."""

        def __init__(self, app: FastAPI, logger: logging.Logger) -> None:
            self.app = app
            self.logger = logger

        async def startup(self) -> None:
            # record start time for health checks
            self.app.state.started_at = time.time()
            _import_models_for_metadata(self.logger)
            _init_monitoring_safe(self.app, self.logger)
            _maybe_init_db(self.app, self.logger)
            # Log cookie settings at startup to aid debugging of cross-origin auth
            try:
                self.logger.info(
                    "SESSION_COOKIE_SAMESITE=%s SESSION_COOKIE_SECURE=%s",
                    settings.SESSION_COOKIE_SAMESITE,
                    settings.SESSION_COOKIE_SECURE,
                )
            except Exception:
                pass

        async def shutdown(self) -> None:
            # placeholder for graceful shutdown work
            self.logger.debug("Application shutdown complete")

    # Use ASGI lifespan for startup/shutdown to avoid deprecated on_event
    @asynccontextmanager
    async def _lifespan(app: FastAPI):
        mgr = StartupManager(app, logger)
        try:
            await mgr.startup()
            yield
        finally:
            try:
                await mgr.shutdown()
            except Exception:
                logger.exception("Error during shutdown")

    app = FastAPI(title=APP_TITLE, lifespan=_lifespan)
    app.state.enable_raptor_mini = bool(settings.ENABLE_RAPTOR_MINI)
    logger.info("Raptor mini feature enabled: %s", app.state.enable_raptor_mini)

    _register_static(app)
    _register_middlewares(app)
    _register_routers(app)
    _register_exception_handlers(app)

    return app


def _register_static(app: FastAPI) -> None:
    static_dir = os.path.join(os.path.dirname(__file__), "static")
    uploads_dir = os.path.join(static_dir, "uploads")
    os.makedirs(uploads_dir, exist_ok=True)
    app.mount("/static", StaticFiles(directory=static_dir), name="static")


def _register_routers(app: FastAPI) -> None:
    logger = get_logger(__name__)
    app.include_router(auth.router, prefix="/api/v1")
    app.include_router(products.router, prefix="/api/v1")
    app.include_router(vendors.router, prefix="/api/v1")
    app.include_router(supplier_router.router, prefix="/api/v1")
    app.include_router(payouts_router.router, prefix="/api/v1")
    app.include_router(rma_router.router, prefix="/api/v1")
    app.include_router(orders.router, prefix="/api/v1")
    from app.api.v1.endpoints import admin_payouts
    app.include_router(admin_payouts.router, prefix="/api/v1")
    try:
        app.include_router(audit_endpoint.router, prefix="/api/v1")
    except Exception as e:
        logger.error(f"Failed to include audit router: {e}")

    app.include_router(admin_orders.router, prefix="/api/v1")

    try:
        app.include_router(admin_cache.router, prefix="/api/v1")
    except Exception as e:
        logger.error(f"Failed to include admin_cache router: {e}")

    try:
        app.include_router(logs.router, prefix="/api/v1")
    except Exception as e:
        logger.error(f"Failed to include logs router: {e}")
    app.include_router(cart_router.router, prefix="/api/v1")
    app.include_router(wishlist_router.router, prefix="/api/v1")
    app.include_router(analytics_router.router, prefix="/api/v1")
    app.include_router(notifications_router.router, prefix="/api/v1")
    app.include_router(support.router, prefix="/api/v1")
    
    # Messaging
    from app.api.v1.endpoints import messaging
    app.include_router(messaging.router, prefix="/api/v1")

    # CMS and Banners (Legacy content)
    from app.api.v1.endpoints import admin_content
    app.include_router(admin_content.router, prefix="/api/v1")

    # Admin Markup Rules — flexible pricing margins for dropshipping
    from app.api.v1.endpoints import admin_markup
    app.include_router(admin_markup.router, prefix="/api/v1")

    # Vendor Coupons
    from app.api.v1.endpoints import vendor_coupons
    app.include_router(vendor_coupons.router, prefix="/api/v1")
    
    # Reviews
    from app.api.v1.endpoints import reviews
    app.include_router(reviews.router, prefix="/api/v1")
    app.include_router(notifications.router, prefix="/api/v1/notifications", tags=["notifications"])
    app.include_router(subscription_plans.router, prefix="/api/v1/subscription-plans", tags=["subscriptions"])

    # Module 3: Vendor Plans
    from app.api.v1.endpoints import vendor_plans
    app.include_router(vendor_plans.router, prefix="/api/v1/vendor-plans", tags=["vendor-plans"])

    # RMA
    from app.api.v1.endpoints import rma
    app.include_router(rma.router, prefix="/api/v1/rma", tags=["rma"])

    # Payments (Simulation)
    from app.api.v1.endpoints import payments
    app.include_router(payments.router, prefix="/api/v1/payments", tags=["payments"])

    # Dropshipping Integration (CJ)
    from app.api.v1.endpoints import dropshipping
    app.include_router(dropshipping.router, prefix="/api/v1/dropshipping", tags=["dropshipping"])

    # Admin user router
    from app.api.v1.endpoints import admin_users, admin_rbac

    app.include_router(admin_users.router, prefix="/api/v1")
    app.include_router(admin_rbac.router, prefix="/api/v1")
    
    # Module 1: Admin Vendor Management
    from app.api.v1.endpoints import admin_vendor, wallet, vendor_plans, admin_taxes, admin_shipping
    app.include_router(admin_vendor.router, prefix=f"{settings.API_V1_STR}/admin/vendors", tags=["admin-vendors"])
    app.include_router(wallet.router, prefix=f"{settings.API_V1_STR}/wallet", tags=["wallet"])
    app.include_router(vendor_plans.router, prefix=f"{settings.API_V1_STR}/vendor-plans", tags=["vendor-plans"])
    app.include_router(admin_taxes.router, prefix=f"{settings.API_V1_STR}/admin/taxes", tags=["admin-taxes"])
    app.include_router(admin_shipping.router, prefix=f"{settings.API_V1_STR}/admin/shipping", tags=["admin-shipping"])

    # Admin tools (importer, tasks, reports)
    try:
        from app.api.v1.endpoints import admin_tools

        if getattr(admin_tools, "router", None) is not None:
            app.include_router(admin_tools.router, prefix="/api/v1")
    except Exception:
        try:
            _logger = get_logger(__name__)
            _logger.debug("admin_tools router not registered")
        except Exception:
            pass
    # Public config endpoint for runtime flags (e.g. raptor_mini_enabled)
    # Replaced by admin_settings public router
    # from app.api.v1.endpoints import public_config
    # app.include_router(public_config.router)
    # Admin pricing endpoints (taxes, coupons)
    try:
        from app.api.v1.endpoints import admin_pricing

        if getattr(admin_pricing, "router", None) is not None:
            app.include_router(admin_pricing.router, prefix="/api/v1")
    except Exception:
        # If admin_pricing cannot be imported (test envs), skip it
        try:
            _logger = get_logger(__name__)
            _logger.debug("admin_pricing router not registered")
        except Exception:
            pass

    # Modern CMS (Pages & Widgets builder)
    try:
        from app.api.v1.endpoints import cms
        app.include_router(cms.router, prefix="/api/v1")
        app.include_router(cms.admin_router, prefix="/api/v1")
    except Exception as e:
        logger.error(f"Failed to include modern CMS routers: {e}")

    # Admin settings endpoints
    try:
        from app.api.v1.endpoints import admin_settings
        app.include_router(admin_settings.router, prefix="/api/v1")
        # Override the existing public config if possible or merge
        # For now, we mount it as well, assuming it doesn't conflict or we removed the old one.
        # Check if /api/v1/public-config is already taken. The old one was in public_config.py
        # We will assume this replaces or supplements it.
        app.include_router(admin_settings.public_router, prefix="/api/v1") 
    except Exception:
        pass
        
    # Affiliate endpoints (Phase 21)
    try:
        from app.api.v1.endpoints import affiliate, track
        app.include_router(affiliate.router, prefix="/api/v1")
        app.include_router(track.router, prefix="/api/v1")
    except Exception:
        pass


def _register_middlewares(app: FastAPI) -> None:
    # Build allow_origins from settings. When FRONTEND_URLS is provided it will
    # be used (comma-separated list). When DEBUG is enabled include common
    # frontend dev origins so cookies/sessions work in local dev when the
    # frontend runs on a different port (Vite dev server).
    origins = []
    if settings.FRONTEND_URLS:
        origins = [u.strip() for u in settings.FRONTEND_URLS.split(",") if u.strip()]
    if settings.DEBUG:
        for u in [
            "http://127.0.0.1:3000",
            "http://localhost:3000",
            "http://127.0.0.1:5173",
            "http://localhost:5173",
        ]:
            if u not in origins:
                origins.append(u)
    # SECURITY: Never fall back to '*' — require explicit FRONTEND_URLS in production.
    if not origins:
        try:
            logger = get_logger(__name__)
            logger.warning(
                "CORS: No allowed origins configured. Set FRONTEND_URLS env var. "
                "Cross-origin requests will be blocked."
            )
        except Exception:
            pass

    # Log the configured origins to make debugging CORS issues easier
    try:
        logger = get_logger(__name__)
        logger.info("CORS allowed origins: %s", origins)
    except Exception:
        pass

    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    assets_url = settings.ASSETS_BASE_URL or "https://static.example.com"
    # SECURITY: Tighten CSP. Allow 'unsafe-inline' only for styles if needed, 
    # but never for scripts in a strict policy.
    csp_policy = (
        f"default-src 'self'; "
        f"script-src 'self'; "
        f"style-src 'self' 'unsafe-inline'; "
        f"img-src 'self' data: {assets_url}; "
        f"font-src 'self' data:; "
        f"connect-src 'self';"
    )
    app.add_middleware(
        SecurityHeadersMiddleware,
        csp=csp_policy,
    )
    app.add_middleware(CacheControlMiddleware, max_age=86400)
    app.add_middleware(GZipMiddleware, minimum_size=1000)

    app.state.limiter = limiter


def _register_exception_handlers(app: FastAPI) -> None:
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

    def _starlette_to_http(_: Request, exc: StarletteHTTPException) -> JSONResponse:
        return JSONResponse(status_code=exc.status_code, content={"detail": str(exc)})

    def _validation_to_http(_: Request, exc: RequestValidationError) -> JSONResponse:
        try:
            errors = exc.errors()
            # Pydantic v2 includes 'input' in errors which might be bytes
            # We need to sanitize it before JSON serialization
            for err in errors:
                if "input" in err and isinstance(err["input"], bytes):
                    try:
                        err["input"] = err["input"].decode("utf-8", errors="replace")
                    except Exception:
                        err["input"] = str(err["input"])
        except Exception:
            errors = str(exc)

        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={"detail": errors},
        )

    app.add_exception_handler(StarletteHTTPException, _starlette_to_http)
    app.add_exception_handler(RequestValidationError, _validation_to_http)


def _import_models_for_metadata(logger) -> None:
    try:
        import app.models  # noqa: F401
    except Exception:
        try:
            from backend.app import models as _m  # noqa: F401
        except Exception:
            logger.debug("Could not import models package at startup; continuing")


def _init_monitoring_safe(app: FastAPI, logger) -> None:
    try:
        init_monitoring(app)
    except Exception as e:
        # Avoid printing a stack trace in development no-op failures
        # (e.g. uvicorn's reloader causing middleware addition errors).
        logger.debug("Monitoring initialization failed: %s", e)


def _ensure_schema_migrations(db, logger):
    """
    Emergency schema fix for missing columns/tables that Alembic didn't catch 
    or when running in simple sqlite mode without migration scripts.
    """
    try:
        from sqlalchemy import text
        # 1. Fix missing is_suspended in users
        try:
            db.execute(text("SELECT is_suspended FROM users LIMIT 1"))
        except Exception:
            # OperationalError if column missing
            logger.info("Auto-migration: Adding is_suspended column to users table")
            # SQLite does not support IF NOT EXISTS for columns in standard SQL, 
            # but the try/except block handles it.
            try:
                db.execute(text("ALTER TABLE users ADD COLUMN is_suspended BOOLEAN DEFAULT 0"))
                db.commit()
            except Exception as e:
                logger.warning(f"Migration add column failed (maybe already exists?): {e}")
                db.rollback()

        # 2. Fix missing banners table
        try:
            db.execute(text("SELECT id FROM banners LIMIT 1"))
        except Exception:
            logger.info("Auto-migration: Creating banners table")
            try:
                db.execute(text("""
                    CREATE TABLE IF NOT EXISTS banners (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        title VARCHAR(255),
                        subtitle VARCHAR(512),
                        image_url VARCHAR(1024) NOT NULL,
                        link_url VARCHAR(1024),
                        position INTEGER DEFAULT 0,
                        is_active BOOLEAN DEFAULT 1,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                    )
                """))
                db.commit()
            except Exception as e:
                logger.warning(f"Migration create banners failed: {e}")
                db.rollback()

        # 2.5 Fix missing system_audit_logs table
        try:
            db.execute(text("SELECT id FROM system_audit_logs LIMIT 1"))
        except Exception:
            logger.info("Auto-migration: Creating system_audit_logs table")
            try:
                db.execute(text("""
                    CREATE TABLE IF NOT EXISTS system_audit_logs (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        user_id INTEGER,
                        action VARCHAR(100) NOT NULL,
                        target_type VARCHAR(50),
                        target_id VARCHAR(100),
                        details TEXT,
                        ip_address VARCHAR(45),
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY(user_id) REFERENCES users(id)
                    )
                """))
                db.commit()
            except Exception as e:
                logger.warning(f"Migration create system_audit_logs failed: {e}")
                db.rollback()

        # 2.6 Fix missing vendor_ledger table
        try:
            db.execute(text("SELECT id FROM vendor_ledger LIMIT 1"))
        except Exception:
            logger.info("Auto-migration: Creating vendor_ledger table")
            try:
                db.execute(text("""
                    CREATE TABLE IF NOT EXISTS vendor_ledger (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        supplier_id INTEGER NOT NULL,
                        amount FLOAT NOT NULL,
                        transaction_type VARCHAR(50) NOT NULL,
                        reference_id VARCHAR(100),
                        description VARCHAR(255),
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY(supplier_id) REFERENCES suppliers(id)
                    )
                """))
                db.commit()
            except Exception as e:
                logger.warning(f"Migration create vendor_ledger failed: {e}")
                db.rollback()

        # 3. Fix missing system_settings table
        try:
            db.execute(text("SELECT id FROM system_settings LIMIT 1"))
        except Exception:
            logger.info("Auto-migration: Creating system_settings table")
            try:
                db.execute(text("""
                    CREATE TABLE IF NOT EXISTS system_settings (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        key VARCHAR(50) UNIQUE NOT NULL,
                        value TEXT,
                        type VARCHAR(20) DEFAULT 'string',
                        description VARCHAR(255),
                        updated_at DATETIME
                    )
                """))
                # Seed default settings
                db.execute(text("""
                    INSERT INTO system_settings (key, value, type, description) VALUES
                    ('site_name', 'My E-Commerce Store', 'string', 'The name of the store'),
                    ('currency', 'USD', 'string', 'Default currency code'),
                    ('maintenance_mode', 'false', 'boolean', 'Enable maintenance mode'),
                    ('allow_registrations', 'true', 'boolean', 'Allow new vendors to register')
                """))
                db.commit()
            except Exception as e:
                logger.warning(f"Migration create system_settings failed: {e}")
                db.rollback()

        # 4. Fix missing affiliate_stats table
        try:
            db.execute(text("SELECT id FROM affiliate_stats LIMIT 1"))
        except Exception:
            logger.info("Auto-migration: Creating affiliate_stats table")
            try:
                db.execute(text("""
                    CREATE TABLE IF NOT EXISTS affiliate_stats (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        coupon_id INTEGER NOT NULL,
                        date DATE NOT NULL,
                        visits INTEGER DEFAULT 0,
                        unique_visitors INTEGER DEFAULT 0,
                        UNIQUE(coupon_id, date),
                        FOREIGN KEY(coupon_id) REFERENCES coupons(id)
                    )
                """))
                db.commit()
            except Exception as e:
                logger.warning(f"Migration create affiliate_stats failed: {e}")
                db.rollback()

        # 5. Fix missing is_read column in messages (Phase 22)
        try:
            db.execute(text("ALTER TABLE messages ADD COLUMN is_read BOOLEAN DEFAULT 0"))
            db.commit()
        except Exception:
            db.rollback()

        # 6. Ensure is_verified exists in reviews (Phase 23)
        try:
            db.execute(text("ALTER TABLE reviews ADD COLUMN is_verified BOOLEAN DEFAULT 0"))
            db.commit()
        except Exception:
            db.rollback()

        # 7. Add 2FA columns to users table
        try:
            db.execute(text("ALTER TABLE users ADD COLUMN totp_secret VARCHAR(32)"))
            db.commit()
        except Exception:
            db.rollback()

        try:
            db.execute(text("ALTER TABLE users ADD COLUMN is_2fa_enabled BOOLEAN DEFAULT 0"))
            db.commit()
        except Exception:
            db.rollback()

        # 8. Add missing columns to suppliers table
        supplier_cols = [
            ("verification_document_url", "VARCHAR(512)"),
            ("billing_model", "VARCHAR(50) DEFAULT 'commission'"),
            ("subscription_plan_id", "INTEGER"),
            ("is_dropshipping", "BOOLEAN DEFAULT 0"),
            ("api_connector_code", "VARCHAR(50)"),
            ("api_config", "JSON"),
            ("contact_email", "VARCHAR(255)"),
            ("phone", "VARCHAR(50)"),
            ("whatsapp_number", "VARCHAR(50)"),
            ("address", "VARCHAR(512)"),
            ("return_policy", "VARCHAR(2048)"),
            ("shipping_policy", "VARCHAR(2048)"),
            ("allow_direct_orders", "BOOLEAN DEFAULT 0"),
            ("preferred_settlement_method", "VARCHAR(50) DEFAULT 'platform'")
        ]
        for col_name, col_type in supplier_cols:
            try:
                db.execute(text(f"ALTER TABLE suppliers ADD COLUMN {col_name} {col_type}"))
                db.commit()
            except Exception:
                db.rollback()

        # 8.2 Add missing OTP columns to users table
        otp_cols = [
            ("otp_code", "VARCHAR(6)"),
            ("otp_expires_at", "DATETIME"),
            ("otp_failed_attempts", "INTEGER DEFAULT 0"),
            ("otp_last_sent_at", "DATETIME"),
            ("is_verified", "BOOLEAN DEFAULT 0")
        ]
        for col_name, col_type in otp_cols:
            try:
                db.execute(text(f"ALTER TABLE users ADD COLUMN {col_name} {col_type}"))
                db.commit()
            except Exception:
                db.rollback()

        # 8.3 Fix missing user_wallets table and columns
        try:
            db.execute(text("SELECT id FROM user_wallets LIMIT 1"))
        except Exception:
            logger.info("Auto-migration: Creating user_wallets table")
            db.execute(text("""
                CREATE TABLE IF NOT EXISTS user_wallets (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER UNIQUE NOT NULL,
                    currency VARCHAR(3) DEFAULT 'USD',
                    balance FLOAT DEFAULT 0.0,
                    pending_balance FLOAT DEFAULT 0.0,
                    loyalty_points INTEGER DEFAULT 0,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY(user_id) REFERENCES users(id)
                )
            """))
            db.commit()

        # 8.4 Ensure pending_balance exists (emergency fix for crash)
        try:
            db.execute(text("SELECT pending_balance FROM user_wallets LIMIT 1"))
        except Exception:
            try:
                db.execute(text("ALTER TABLE user_wallets ADD COLUMN pending_balance FLOAT DEFAULT 0.0"))
                db.commit()
            except Exception:
                db.rollback()

        # 8.5 Fix missing wallet_transactions table
        try:
            db.execute(text("SELECT id FROM wallet_transactions LIMIT 1"))
        except Exception:
            logger.info("Auto-migration: Creating wallet_transactions table")
            db.execute(text("""
                CREATE TABLE IF NOT EXISTS wallet_transactions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    wallet_id INTEGER NOT NULL,
                    amount FLOAT NOT NULL,
                    transaction_type VARCHAR(20) NOT NULL,
                    reference_id VARCHAR(100),
                    reference_type VARCHAR(50),
                    description VARCHAR(255),
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY(wallet_id) REFERENCES user_wallets(id)
                )
            """))
            db.commit()

        # 8.6 Fix missing columns in support_tickets table
        support_ticket_cols = [
            ("order_id", "INTEGER"),
            ("category", "VARCHAR(100)")
        ]
        for col_name, col_type in support_ticket_cols:
            try:
                db.execute(text(f"ALTER TABLE support_tickets ADD COLUMN {col_name} {col_type}"))
                db.commit()
                logger.info(f"Auto-migration: Added {col_name} to support_tickets")
            except Exception:
                db.rollback()

        # 9. Fix missing columns in products table (Robust)
        logger.info("Auto-migration: Checking products table for missing columns...")
        product_cols = [
            ("seo_title", "VARCHAR(255)"),
            ("seo_description", "VARCHAR(512)"),
            ("status", "VARCHAR(50) DEFAULT 'published'"),
            ("vendor_notes", "VARCHAR(512)")
        ]
        for col_name, col_type in product_cols:
            try:
                # Try to select the column to see if it exists
                try:
                     db.execute(text(f"SELECT {col_name} FROM products LIMIT 1"))
                except Exception:
                    # If select fails, assume column is missing and try to add it
                    logger.info(f"Adding missing column to products: {col_name}")
                    db.execute(text(f"ALTER TABLE products ADD COLUMN {col_name} {col_type}"))
                    db.commit()
                    logger.info(f"Successfully added column: {col_name}")
            except Exception as e:
                logger.warning(f"Failed to check/add column {col_name}: {e}")
                db.rollback()

        # 10. Fix missing columns in order_items
        logger.info("Auto-migration: Checking order_items table for missing columns...")
        order_item_cols = [
            ("vendor_id", "INTEGER"),
            ("cost_price", "FLOAT DEFAULT 0.0"),
            ("commission_rate", "FLOAT DEFAULT 0.0"),
            ("commission_amount", "FLOAT DEFAULT 0.0"),
            ("fulfillment_order_id", "INTEGER")
        ]
        for col_name, col_type in order_item_cols:
            try:
                try:
                    db.execute(text(f"SELECT {col_name} FROM order_items LIMIT 1"))
                except Exception:
                    logger.info(f"Adding missing column to order_items: {col_name}")
                    db.execute(text(f"ALTER TABLE order_items ADD COLUMN {col_name} {col_type}"))
                    db.commit()
            except Exception as e:
                logger.warning(f"Failed to check/add column {col_name} to order_items: {e}")
                db.rollback()

    except Exception as e:
        logger.error(f"Schema migration helper failed: {e}")


def _maybe_init_db(app: FastAPI, logger) -> None:
    if not (settings.DEBUG or settings.AUTO_CREATE_DB):
        return

    try:
        from app.core.database import init_db, SessionLocal # type: ignore
        from app.services.user_service import UserService # type: ignore

        init_db()
        
        # Run auto-migrations
        if settings.DEBUG:
            db_mig = SessionLocal()
            _ensure_schema_migrations(db_mig, logger)
            db_mig.close()
            
            db = SessionLocal()
            svc = UserService(db)
            from app.models.user import User # type: ignore

            existing = db.query(User).filter(User.username == "devadmin").first()
            if not existing:
                svc.register_user(
                    username="devadmin",
                    email="devadmin@example.com",
                    password="password",
                )
                user = db.query(User).filter(User.username == "devadmin").first()
                if user:
                    user.role = "admin"
                    db.commit()
            db.close()
    except Exception:
        logger.exception("Auto DB init failed")


# --- Utility endpoints -------------------------------------------------


def _allowed_image_extensions() -> Dict[str, str]:
    # kept for backwards-compatibility but prefer module-level constant
    return ALLOWED_IMAGE_MIME_MAP.copy()


def _detect_image_extension(
    data: bytes, content_type: str, allowed: Dict[str, str]
) -> Optional[str]:
    """Detect a conservative image extension from raw bytes or fallback to content_type.

    Returns a leading-dot extension (e.g. '.png') when recognized and allowed,
    otherwise returns None.
    """
    if not data:
        return None

    # PNG
    if data.startswith(b"\x89PNG\r\n\x1a\n"):
        return ".png"

    # JPEG (SOI marker)
    if data.startswith(b"\xff\xd8\xff"):
        return ".jpg"

    # GIF
    if data.startswith(b"GIF87a") or data.startswith(b"GIF89a"):
        return ".gif"

    # WebP (RIFF....WEBP)
    if len(data) >= 12 and data[0:4] == b"RIFF" and data[8:12] == b"WEBP":
        return ".webp"

    # Fallback: use provided content_type when allowed
    # Normalize content_type (strip parameters like charset)
    if content_type:
        ct_main = content_type.split(";", 1)[0].strip().lower()
        if ct_main in allowed:
            return allowed.get(ct_main)

    return None


# create app instance and expose it
app = create_app()


@app.get("/")
def root() -> Dict[str, Any]:
    return {
        "message": "Hello E-Commerce",
        "raptor_mini_enabled": bool(app.state.enable_raptor_mini),
    }


@app.get("/api/v1/config")
def config() -> Dict[str, bool]:
    return {"raptor_mini_enabled": bool(app.state.enable_raptor_mini)}


@app.get("/health")
def health() -> Dict[str, Any]:
    """Simple health endpoint returning status and uptime in seconds."""
    started = getattr(app.state, "started_at", None)
    uptime = None
    if started is not None:
        try:
            current_time: float = time.time()
            start_time: float = float(started)
            uptime = round(current_time - start_time, 3)
        except Exception:
            uptime = None

    return {
        "status": "ok",
        "uptime": uptime,
        "raptor_mini_enabled": bool(app.state.enable_raptor_mini),
    }


@app.post("/api/v1/upload-image")
@require_csrf
@audit("image.upload")
async def upload_image(
    request: Request,
    file: UploadFile = File(...),
    _user=Depends(require_role("admin", "vendor", "customer")),
) -> Dict[str, str]:
    """Upload an image file.

    Validation is performed by inspecting magic bytes first (stronger than
    trusting the provided content-type) and falls back to the declared
    content-type when safe. Files are limited to `max_bytes` and saved
    locally when `CLOUDINARY_URL` is not set.
    """
    allowed = _allowed_image_extensions()
    max_bytes = 5 * 1024 * 1024

    content_type = (file.content_type or "").lower()

    # Read payload early to inspect magic bytes and size
    data = await file.read()
    if not data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Empty file"
        )

    if len(data) > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File too large (max 5MB)",
        )

    # Determine extension from bytes (preferred) or content-type (fallback)
    detected_ext = _detect_image_extension(data, content_type, allowed)
    if not detected_ext:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Unsupported or unrecognized image type",
        )

    ext = detected_ext

    cloudinary_url = os.getenv("CLOUDINARY_URL")

    if cloudinary_url:
        try:
            import cloudinary
            import cloudinary.uploader
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Cloudinary library not installed",
            )

        try:
            cloudinary.config(cloudinary_url=cloudinary_url)
        except Exception:
            pass

        try:
            result = cloudinary.uploader.upload(
                io.BytesIO(data), resource_type="image", folder="ecommerce_store"
            )
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Cloudinary upload failed: {exc}",
            )

        secure_url = result.get("secure_url") or result.get("url")
        if not secure_url:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Cloudinary did not return a URL",
            )

        try:
            await file.close()
        except Exception:
            pass

        return {"url": secure_url}

    # Local fallback: save to uploads directory with a UUID filename
    static_root = os.path.join(os.path.dirname(__file__), "static")
    uploads_dir = os.path.join(static_root, "uploads")
    os.makedirs(uploads_dir, exist_ok=True)

    # Guarantee the extension is safe and normalized
    if not ext.startswith("."):
        ext = f".{ext}"
    if ext not in set(allowed.values()):
        # defensive fallback (shouldn't happen because of detection)
        ext = ".jpg"

    name = f"{uuid.uuid4().hex}{ext}"
    dest_path = os.path.join(uploads_dir, name)
    try:
        # Write atomically using a temporary file in the uploads dir then move.
        Path(uploads_dir).mkdir(parents=True, exist_ok=True)
        # Use NamedTemporaryFile with delete=False because on Windows an open
        # file cannot be atomically moved. We close before replacing.
        with tempfile.NamedTemporaryFile(
            dir=uploads_dir, suffix=ext, delete=False
        ) as tmpf:
            tmpf.write(data)
            tmp_name = tmpf.name
        os.replace(tmp_name, dest_path)
    finally:
        try:
            await file.close()
        except Exception:
            pass

    return {"url": f"/static/uploads/{name}"}


@app.get("/api/v1/analytics/vendor")
def get_vendor_stats(
    vendor_id: int,
    db: Session = Depends(get_db),
    _user=Depends(require_role("vendor")) # or admin
) -> Dict[str, Any]:
    from app.services.analytics_service import AnalyticsService
    svc = AnalyticsService(db)
    return svc.get_vendor_stats(vendor_id)

@app.get("/api/v1/analytics/admin")
def get_admin_overview(
    db: Session = Depends(get_db),
    _admin=Depends(require_role("admin"))
) -> Dict[str, Any]:
    from app.services.analytics_service import AnalyticsService
    svc = AnalyticsService(db)
    return svc.get_admin_overview()

@app.get("/api/v1/reports/export")
def export_statement(
    year: int,
    month: int,
    vendor_id: Optional[int] = None,
    db: Session = Depends(get_db),
    _admin=Depends(require_role("admin"))
) -> Any:
    from app.services.export_service import ExportService
    from fastapi.responses import Response
    
    svc = ExportService(db)
    if vendor_id:
        csv_data = svc.generate_monthly_financial_csv(vendor_id, year, month)
        filename = f"statement_{vendor_id}_{year}_{month}.csv"
    else:
        csv_data = svc.generate_admin_platform_csv(year, month)
        filename = f"platform_report_{year}_{month}.csv"
        
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

# === GOVERNANCE & ADMIN CONTROL ENDPOINTS ===

@app.get("/api/v1/admin/widgets")
def get_widgets(
    active_only: bool = False,
    db: Session = Depends(get_db),
    _admin=Depends(require_role("admin"))
) -> Dict[str, Any]:
    """Get all UI widgets or only active ones"""
    from app.services.widget_service import WidgetService # type: ignore
    svc = WidgetService(db)
    
    if active_only:
        widgets = svc.get_active_widgets()
    else:
        widgets = svc.get_all_widgets()
    
    return {"widgets": [{"id": w.id, "name": w.name, "type": w.type, "is_active": w.is_active, "position": w.position, "settings": w.settings_json} for w in widgets]}

@app.patch("/api/v1/admin/widgets/{widget_id}/toggle")
def toggle_widget(
    widget_id: int,
    is_active: bool,
    db: Session = Depends(get_db),
    _admin=Depends(require_role("admin"))
) -> Dict[str, Any]:
    """Toggle widget active status"""
    from app.services.widget_service import WidgetService # type: ignore
    from app.services.audit_service import AuditService
    
    svc = WidgetService(db)
    widget = svc.toggle_widget(widget_id, is_active)
    
    # Log action
    audit_svc = AuditService(db)
    audit_svc.log_action(
        user_id=_admin["user_id"],
        action=f"widget_toggle",
        target_type="ui_widget",
        target_id=str(widget_id),
        details=f"Set widget '{widget.name}' to {'active' if is_active else 'inactive'}"
    )
    
    return {"success": True, "widget": {"id": widget.id, "is_active": widget.is_active}}

@app.get("/api/v1/admin/system-settings")
def get_system_settings(
    db: Session = Depends(get_db),
    _admin=Depends(require_role("admin"))
) -> Dict[str, Any]:
    """Get all UI widgets or only active ones"""
    from app.services.widget_service import WidgetService
    svc = WidgetService(db)
    return {"settings": svc.get_all_settings()}

@app.patch("/api/v1/admin/system-settings/{key}")
def update_system_setting(
    key: str,
    value: Any,
    data_type: str = "string",
    db: Session = Depends(get_db),
    _admin=Depends(require_role("admin"))
) -> Dict[str, Any]:
    """Update a system setting"""
    from app.services.system_settings_service import SystemSettingsService
    from app.services.audit_service import AuditService
    
    svc = SystemSettingsService(db)
    setting = svc.set_setting(key, value, data_type)
    
    # Security audit log
    audit_svc = AuditService(db)
    audit_svc.log_action(
        user_id=_admin["user_id"],
        action="system_setting_update",
        target_type="system_setting",
        target_id=key,
        details=f"Updated {key} to {value}"
    )
    
    return {"success": True, "setting": {"key": setting.key, "value": setting.get_typed_value()}}

@app.get("/api/v1/vendor/features")
def get_vendor_features(
    vendor_id: int,
    db: Session = Depends(get_db),
    _user=Depends(require_role("vendor"))
) -> Dict[str, Any]:
    """Get enabled features for a vendor's plan"""
    from app.services.feature_flag_service import FeatureFlagService
    svc = FeatureFlagService(db)
    features = svc.get_vendor_features(vendor_id)
    return {"vendor_id": vendor_id, "enabled_features": features}

@app.get("/api/v1/cloudinary-sign")
def cloudinary_sign(_admin=Depends(require_role("admin"))) -> Dict[str, Any]:
    cloudinary_url = os.getenv("CLOUDINARY_URL")
    if not cloudinary_url:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Cloudinary not configured"
        )

    try:
        import cloudinary
        from cloudinary.utils import api_sign_request
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Cloudinary library not installed",
        )

    try:
        cloudinary.config(cloudinary_url=cloudinary_url)
    except Exception:
        pass

    cfg = cloudinary.config()
    cloud_name = cfg.cloud_name
    api_key = cfg.api_key
    api_secret = cfg.api_secret

    if not (cloud_name and api_key and api_secret):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Cloudinary credentials missing",
        )

    ts = int(time.time())
    params_to_sign = {"timestamp": ts, "folder": "ecommerce_store"}
    try:
        sig = api_sign_request(params_to_sign, api_secret)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to compute signature: {exc}",
        )

    upload_url = f"https://api.cloudinary.com/v1_1/{cloud_name}/image/upload"

    return {
        "cloud_name": cloud_name,
        "api_key": api_key,
        "timestamp": ts,
        "signature": sig,
        "upload_url": upload_url,
        "folder": "ecommerce_store",
    }
