import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from .config import settings

db_url = settings.DATABASE_URL

# Only add 'check_same_thread' for SQLite
connect_args = {}
if db_url.startswith("sqlite"):
    connect_args["check_same_thread"] = False

engine = create_engine(db_url, connect_args=connect_args)
SessionLocal = sessionmaker(
    bind=engine, autoflush=False, autocommit=False, future=True, expire_on_commit=False
)
Base = declarative_base()


# Wrap Base.metadata.create_all so that calling code that creates a
# fresh schema (tests often call `Base.metadata.create_all` before
# importing model modules) will first attempt to import the app models
# and register them on the Base's metadata. This reduces ordering
# sensitivity in tests that construct an engine and call create_all()
# prior to importing models.
_orig_create_all = Base.metadata.create_all


def _create_all_with_model_import(bind=None, *args, **kwargs):
    try:
        import importlib

        importlib.import_module("app.models")
        # Also attempt to import a set of core model modules so their
        # Table objects are registered on the Base.metadata prior to
        # calling create_all(). This makes tests that call
        # `Base.metadata.create_all` less ordering-sensitive.
        core_models = [
            "app.models.user",
            "app.models.product",
            "app.models.order",
            "app.models.order_item",
            "app.models.refresh_token",
            "app.models.refresh_token_audit",
            "app.models.product_category",
            "app.models.supplier",
            "app.models.supplier_stock",
            "app.models.cart",
            "app.models.wishlist",
            "app.models.product_image",
            "app.models.category",
            "app.models.task",
            "app.models.supplier_product",
            "app.models.review",
            "app.models.fulfillment_order",
            "app.models.product_variant",
            "app.models.product_variation",
            "app.models.vendor_ledger",
            "app.models.support_ticket",
            "app.models.shipping_provider",
            "app.models.shipping_zone",
            "app.models.subscription_plan",
            "app.models.coupon",
            "app.models.audit_log",
            "app.models.notification",
            "app.models.banner",
            "app.models.setting",
            "app.models.tax_rate",
            "app.models.affiliate_stats",
            "app.models.banner",
            "app.models.messaging",
            "app.models.return_request",
            # New Models - In dependency order
            "app.models.rbac",
            "app.models.customer_group",
            "app.models.user",
            "app.models.store",
            "app.models.vendor_plan",
            "app.models.plan_feature",
            "app.models.wallet",
            "app.models.affiliate",
            "app.models.affiliate_coupon",
            "app.models.ui_widget",
            "app.models.system_setting",
            "app.models.kyc",
            "app.models.master_product",
            "app.models.stock_reservation",
        ]
        for m in core_models:
            try:
                importlib.import_module(m)
            except Exception:
                # ignore individual import failures; create_all will skip unknown tables
                pass
    except Exception:
        try:
            importlib.import_module("backend.app.models")
        except Exception:
            # If models cannot be imported, fall back to original behavior
            pass
    # If for any reason the package-level imports above did not register
    # tables on Base.metadata (e.g. package uses dynamic imports or imports
    # failed silently), attempt to import all modules found under the
    # `app.models` package using pkgutil. This is best-effort and intended
    # to make tests that call `Base.metadata.create_all` less ordering
    # sensitive.
    try:
        import pkgutil

        try:
            pkg = importlib.import_module("app.models")
            pkg_paths = list(getattr(pkg, "__path__", []))
        except Exception:
            pkg = importlib.import_module("backend.app.models")
            pkg_paths = list(getattr(pkg, "__path__", []))

        for path in pkg_paths:
            for finder, name, ispkg in pkgutil.iter_modules([path]):
                mod_name = f"app.models.{name}"
                try:
                    importlib.import_module(mod_name)
                except Exception:
                    # Try the backend.* import path as a fallback
                    try:
                        importlib.import_module(f"backend.app.models.{name}")
                    except Exception:
                        # ignore; individual modules may have optional deps
                        pass
    except Exception:
        pass
    return _orig_create_all(bind=bind, *args, **kwargs)


Base.metadata.create_all = _create_all_with_model_import

# Ensure package aliasing to avoid duplicate module imports under 'app' and 'backend.app'
# Do not import `app.models` at module import time to avoid circular imports during
# model and database module initialization. Import models lazily in `init_db()`.
if "backend.app" in sys.modules and "app" not in sys.modules:
    sys.modules["app"] = sys.modules["backend.app"]
elif "app" in sys.modules and "backend.app" not in sys.modules:
    sys.modules["backend.app"] = sys.modules["app"]

# Also ensure the core database module is available under both import paths
# so that `import app.core.database` and `import backend.app.core.database`
# will return the same module object. This prevents duplicate module
# instances where one module's Base/engine differs from the other and
# can lead to "no such table" errors during tests when create_all is
# invoked on a different Base instance.
if __name__ in sys.modules:
    try:
        if "app.core.database" not in sys.modules:
            sys.modules["app.core.database"] = sys.modules[__name__]
        if "backend.app.core.database" not in sys.modules:
            sys.modules["backend.app.core.database"] = sys.modules[__name__]
    except Exception:
        pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Create all tables registered on Base.metadata. Use with caution; prefer Alembic migrations in production."""
    # If tests or runtime changed DATABASE_URL after module import, recreate
    # the engine/SessionLocal to match the current settings so that
    # `init_db()` always creates tables on the intended database.
    try:
        current_url = str(engine.url)
        target_url = settings.DATABASE_URL

        if current_url != target_url:
            # recreate engine and SessionLocal bound to the new URL
            new_connect_args = {}
            if target_url.startswith("sqlite"):
                new_connect_args["check_same_thread"] = False

            new_engine = create_engine(target_url, connect_args=new_connect_args)
            globals()["engine"] = new_engine
            globals()["SessionLocal"] = sessionmaker(
                bind=new_engine,
                autoflush=False,
                autocommit=False,
                future=True,
                expire_on_commit=False,
            )
    except Exception:
        # Non-fatal; proceed with existing engine if anything goes wrong
        pass

    # Ensure models are imported/registered (do this lazily here to avoid circular imports)
    try:
        import app.models  # noqa: F401
    except Exception:
        from backend.app import models as _models  # noqa: F401

    # Some model modules may fail to import during the package import due to
    # ordering or optional dependencies. Import core model modules explicitly
    # here as a best-effort to ensure all tables are registered on Base.metadata
    # before calling create_all(). Missing optional modules are ignored.
    try:
        import importlib

        core_models = [
            "app.models.user",
            "app.models.product",
            "app.models.order",
            "app.models.order_item",
            "app.models.refresh_token",
            "app.models.refresh_token_audit",
            "app.models.product_category",
            "app.models.supplier",
            "app.models.supplier_stock",
            "app.models.cart",
            "app.models.wishlist",
            "app.models.product_image",
            "app.models.category",
            "app.models.task",
            # New Models
            "app.models.store",
            "app.models.vendor_plan",
            "app.models.wallet",
            "app.models.kyc",
            "app.models.rbac",
            "app.models.customer_group",
            "app.models.audit_log",
        ]
        for m in core_models:
            try:
                importlib.import_module(m)
            except Exception:
                # ignore individual import failures; create_all will skip unknown tables
                pass
    except Exception:
        pass

    # If using a SQLite file-based DB, removing the DB file to ensure a
    # clean schema is a potentially destructive convenience. Don't remove
    # the DB file by default because callers may rely on running
    # `init_db()` multiple times without losing data (tests can rely on
    # this). Require an explicit opt-in via environment variable
    # `ECO_STORE_RESET_DB_ON_INIT=1` to enable file removal.
    try:
        db_path = getattr(engine.url, "database", None)
        if (
            engine.url.drivername.startswith("sqlite")
            and db_path
            and db_path != ":memory"
        ):
            import os

            if os.environ.get("ECO_STORE_RESET_DB_ON_INIT") in ("1", "true", "True"):
                # Only remove if file exists and looks like a local file path
                if os.path.exists(db_path):
                    try:
                        os.remove(db_path)
                    except Exception:
                        # Non-fatal; proceed to create tables which may alter schema
                        pass
    except Exception:
        pass

    # Create tables for the canonical backend Base/engine
    Base.metadata.create_all(bind=engine)

    # Also attempt to create tables for `app.core.database` if present and different
    try:
        from app.core import database as app_db

        # Only create if it's a different engine/module and has Base and engine
        if (
            app_db is not None
            and getattr(app_db, "engine", None) is not None
            and getattr(app_db, "Base", None) is not None
        ):
            # Avoid a redundant create when app_db is the same module as this one
            if app_db is not globals():
                try:
                    app_db.Base.metadata.create_all(bind=app_db.engine)
                except Exception:
                    # Non-fatal - best-effort to ensure tables exist on any DB engine used by the app
                    pass
    except Exception:
        pass

        # Ensure any other imported database module objects use the canonical
        # engine/SessionLocal/Base so that endpoints and test helpers that import
        # `app.core.database` or `backend.app.core.database` always operate on the
        # same engine and metadata. This prevents a class of test failures where
        # duplicate module instances point at different DB files.
        try:
            for name in ("app.core.database", "backend.app.core.database"):
                mod = sys.modules.get(name)
                if mod is not None:
                    try:
                        setattr(mod, "engine", engine)
                        setattr(mod, "SessionLocal", SessionLocal)
                        setattr(mod, "Base", Base)
                    except Exception:
                        # best-effort; ignore if a module isn't writable
                        pass
        except Exception:
            pass


# If user code imports `app.core.database` as a separate module (due to import order),
# make sure the canonical engine/SessionLocal/Base are always the same object so
# the app uses the same DB engine across both import paths.
try:
    # We import lazily to avoid circular imports during module initialization
    import app.core.database as app_core_database

    if getattr(app_core_database, "engine", None) is not engine:
        app_core_database.engine = engine
        app_core_database.SessionLocal = SessionLocal
        app_core_database.Base = Base
except Exception:
    # If app.core.database isn't imported yet (or can't be patched), ignore —
    # import aliasing above will be enough for most cases.
    pass

# Attempt to eagerly import core model modules so that the Base.metadata
# is populated when this module is imported. Import individual modules
# explicitly to surface import errors and register tables on the Base's
# metadata even if package-level imports are defensive.
try:
    import importlib

    core_models = [
        "app.models.product_category",
        "app.models.product_image",
        "app.models.product",
        "app.models.category",
        "app.models.supplier",
        "app.models.supplier_stock",
        "app.models.user",
        "app.models.order",
        "app.models.order_item",
        "app.models.refresh_token",
        "app.models.refresh_token_audit",
        "app.models.cart",
        "app.models.wishlist",
        "app.models.task",
        "app.models.supplier_product",
        "app.models.review",
        "app.models.fulfillment_order",
        "app.models.product_variant",
        "app.models.product_variation",
        "app.models.vendor_ledger",
        "app.models.support_ticket",
        "app.models.shipping_provider",
        "app.models.shipping_zone",
        "app.models.subscription_plan",
        "app.models.coupon",
        "app.models.audit_log",
        "app.models.notification",
        "app.models.banner",
        "app.models.setting",
        "app.models.tax_rate",
        "app.models.affiliate_stats",
        "app.models.banner",
        "app.models.messaging",
        "app.models.return_request",
        # New Models
        "app.models.store",
        "app.models.vendor_plan",
        "app.models.wallet",
        "app.models.kyc",
        "app.models.rbac",
        "app.models.customer_group",
        "app.models.master_product",
        "app.models.stock_reservation",
    ]
    for m in core_models:
        try:
            importlib.import_module(m)
        except Exception:
            # ignore module-level failures; tests may not need all models
            pass
except Exception:
    pass
