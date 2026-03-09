import sys
from .shipping_provider import ShippingProvider
from .shipping_zone import ShippingZone
from .base import SQLAlchemyBaseModel
from sqlalchemy.orm import relationship

# Import model modules defensively so missing optional modules don't
# break test discovery. Tests only require the models that exist in
# this codebase; missing modules will be ignored gracefully.
__all__ = ["SQLAlchemyBaseModel"]


def _try_import(name: str):
    try:
        module = __import__(f".{name}", globals(), locals(), [name])
        globals().update(
            {
                k: getattr(module, k)
                for k in getattr(module, "__all__", [])
                if hasattr(module, k)
            }
        )
        return True
    except Exception:
        return False


# Core models we expect; import in an order that satisfies SQLAlchemy
# relationship/back_populates resolution (dependent classes should be
# imported before classes that reference them).

# -- New Module 1 Models --
_try_import("plan_feature")
_try_import("vendor_plan")
_try_import("store")
_try_import("kyc")
_try_import("customer_group")
_try_import("rbac")
_try_import("wallet")
_try_import("audit_log")
# Module 3 (CMS/Visual Builder)
_try_import("cms")

# Module 2
_try_import("master_product")
_try_import("stock_reservation")

# Module 4
_try_import("tax_rate")
_try_import("shipping_zone")
_try_import("shipping_provider")

_try_import("product_category")  # side-effect registration
_try_import("refresh_token")
_try_import("refresh_token_audit")
_try_import("order_item")
_try_import("order")
_try_import("return_request")

if _try_import("return_request"):
    __all__.append("ReturnRequest")

if _try_import("user"):
    __all__.append("User")

if _try_import("category"):
    __all__.append("Category")

# Import product images before product to reduce mapper ordering issues
# where ProductImage tries to reference Product.images before it's defined.
if _try_import("product_image"):
    __all__.append("ProductImage")

if _try_import("product"):
    __all__.append("Product")

# Import product variants after Product is available
if _try_import("product_variant"):
    __all__.append("ProductVariant")

# Import variation models after Product is available
if _try_import("product_variation"):
    __all__.append("ProductVariationVariable")
    __all__.append("ProductVariationVariableValue")
    __all__.append("ProductVariationResult")

if _try_import("review"):
    __all__.append("Review")

if _try_import("payment"):
    __all__.append("Payment")

if _try_import("shipping"):
    __all__.append("Shipping")

if _try_import("supplier"):
    __all__.append("Supplier")
if _try_import("fulfillment_order"):
    __all__.append("FulfillmentOrder")


if _try_import("supplier_product"):
    __all__.append("SupplierProduct")

# Background task model
if _try_import("task"):
    __all__.append("Task")

# Tax rates are now in tax_rate.py
if _try_import("tax_rate"):
    __all__.append("TaxRate")

if _try_import("coupon"):
    __all__.append("Coupon")

if _try_import("cart"):
    __all__.append("Cart")

if _try_import("wishlist"):
    __all__.append("Wishlist")

if _try_import("notification"):
    __all__.append("Notification")

if _try_import("refresh_token"):
    __all__.append("RefreshToken")

if _try_import("refresh_token_audit"):
    __all__.append("RefreshTokenAudit")

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
