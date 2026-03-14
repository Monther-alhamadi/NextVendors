import sys
from .base import SQLAlchemyBaseModel
from sqlalchemy.orm import relationship

# Import model modules defensively so missing optional modules don't
# break test discovery. Tests only require the models that exist in
# this codebase; missing modules will be ignored gracefully.
__all__ = ["SQLAlchemyBaseModel"]


import importlib
import traceback

def _try_import(name: str):
    # Prevent duplicate imports of the same module in one session
    if name in globals() and name in __all__:
        return True
        
    try:
        module = importlib.import_module(f".{name}", package=__name__)
        # Update globals with exports from the module
        if hasattr(module, "__all__"):
            for k in module.__all__:
                if hasattr(module, k):
                    globals()[k] = getattr(module, k)
                    if k not in __all__:
                        __all__.append(k)
        return True
    except ModuleNotFoundError as e:
        # If the failure is specifically about the module itself, return False silently.
        # This allows us to have optional modules without noisy logs.
        if name in str(e):
            return False
            
        # If it's a ModuleNotFoundError for some internal dependency, log it.
        print(f"ERROR importing {name}: {e}")
        return False
    except Exception as e:
        # Unexpected error (SyntaxError, AttributeError in model, etc.)
        print(f"ERROR importing {name}: {e}")
        traceback.print_exc()
        return False


# Core models we expect; import in an order that satisfies SQLAlchemy
# relationship/back_populates resolution.

_try_import("plan_feature")
_try_import("vendor_plan")
_try_import("store")
_try_import("kyc")
_try_import("customer_group")
_try_import("rbac")
_try_import("wallet")
_try_import("audit_log")
_try_import("cms")
_try_import("master_product")
_try_import("stock_reservation")
_try_import("tax_rate")
_try_import("shipping_zone")
_try_import("shipping_provider")
_try_import("product_category")
_try_import("refresh_token")
_try_import("refresh_token_audit")

_try_import("affiliate")
_try_import("affiliate_coupon")
_try_import("affiliate_stats")
_try_import("order_item")
_try_import("order")
_try_import("return_request")
_try_import("user")
_try_import("category")
_try_import("product_image")
_try_import("product")
_try_import("product_variant")
_try_import("product_variation")
_try_import("review")
_try_import("payment")
_try_import("shipping")
_try_import("supplier")
_try_import("fulfillment_order")
_try_import("supplier_product")
_try_import("task")
_try_import("coupon")
_try_import("cart")
_try_import("wishlist")
_try_import("notification")

# Ensure aliasing of module names so imports like `app.models` and
# `backend.app.models` reference the same module object. This prevents
# duplicate model class registration in SQLAlchemy metadata caused by
# importing module under different names.
if __name__ == "backend.app.models":
    if "app.models" not in sys.modules:
        sys.modules["app.models"] = sys.modules[__name__]
elif __name__ == "app.models":
    if "backend.app.models" not in sys.modules:
        sys.modules["backend.app.models"] = sys.modules[__name__]

try:
    # product <-> product_image
    from app.models.product import Product  # type: ignore
    from app.models.product_image import ProductImage  # type: ignore

    try:
        from app.models.subscription_plan import SubscriptionPlan
        from app.models.support_ticket import SupportTicket, SupportMessage
    except Exception:
        pass
except Exception:
    pass
