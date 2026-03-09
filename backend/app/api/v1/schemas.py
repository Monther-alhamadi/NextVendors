from pydantic import BaseModel, EmailStr, ConfigDict
from pydantic import field_validator
from typing import List, Optional
from datetime import datetime


from typing import List, Optional, Any

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    refresh_token: Optional[str] = None
    csrf_token: Optional[str] = None
    user: Optional[Any] = None


class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

    @field_validator("password")
    def password_min_length(cls, v: str) -> str:
        if v is None:
            raise ValueError("Password is required")
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v


class UserResponse(BaseModel):
    id: int
    username: str
    email: EmailStr
    role: str
    is_vendor: bool = False
    vendor_status: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)


class ProductCreate(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    inventory: int = 0
    category: Optional[str] = None
    status: str = "published" # draft, published
    # Images may be provided as a list of URL strings
    # Use None as the default so model_dump(exclude_none=True) will omit
    # images from the serialized dict when not explicitly provided. This
    # prevents default-empty keys from being passed as kwargs to SQLAlchemy
    # constructors which can raise TypeError (e.g. 'images' invalid kwarg)
    images: Optional[List[dict | str]] = None

    @field_validator("name")
    def name_must_be_meaningful(cls, v: str) -> str:
        if v is None or len(v.strip()) < 2:
            raise ValueError("Name must be at least 2 characters")
        return v.strip()

    @field_validator("price")
    def price_must_be_positive(cls, v: float) -> float:
        if v is None:
            raise ValueError("Price is required")
        if v < 0:
            raise ValueError("Price must be positive")
        return v

    @field_validator("inventory")
    def inventory_must_be_non_negative(cls, v: int) -> int:
        if v is not None and v < 0:
            raise ValueError("Inventory cannot be negative")
        return v or 0


class ProductImageResponse(BaseModel):
    id: int
    url: str
    kind: str = "image"
    position: int = 0
    public: bool = True
    is_primary: bool = False
    model_config = ConfigDict(from_attributes=True)


class VariantCreate(BaseModel):
    sku: Optional[str] = None
    name: Optional[str] = None
    price: float = 0.0
    inventory: int = 0

    @field_validator("price")
    def price_must_be_non_negative(cls, v: float) -> float:
        if v is None:
            return 0.0
        if v < 0:
            raise ValueError("Price must be non-negative")
        return v

    @field_validator("inventory")
    def inventory_must_be_non_negative(cls, v: int) -> int:
        if v is None:
            return 0
        if v < 0:
            raise ValueError("Inventory must be non-negative")
        return v


class VariantResponse(BaseModel):
    id: int
    product_id: int
    sku: Optional[str]
    name: Optional[str]
    price: float
    inventory: int
    active: bool
    model_config = ConfigDict(from_attributes=True)


# Define SupplierProductResponse before ProductResponse to avoid NameError
class SupplierProductLink(BaseModel):
    cost_price: float
    inventory: int = 0
    currency: str = "USD"
    sku_vendor: Optional[str] = None


class SupplierProductResponse(BaseModel):
    supplier_id: int
    product_id: int
    cost_price: float
    inventory: int
    currency: str
    sku_vendor: Optional[str]
    vendor_name: Optional[str] = None  # Use name for display
    whatsapp_number: Optional[str] = None
    allow_direct_orders: bool = False
    preferred_settlement_method: str = "platform"
    model_config = ConfigDict(from_attributes=True)


class ProductResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    price: float
    inventory: int
    category: Optional[str] = None
    seo_title: Optional[str] = None
    seo_description: Optional[str] = None
    images: List[ProductImageResponse] = []
    variants: List[VariantResponse] = []
    supplier_products: List[SupplierProductResponse] = []
    model_config = ConfigDict(from_attributes=True)



class VariationVariableCreate(BaseModel):
    identifier: str
    name: Optional[str] = None
    ordering: int = 0


class VariationVariableResponse(BaseModel):
    id: int
    product_id: int
    identifier: str
    name: Optional[str]
    ordering: int
    model_config = ConfigDict(from_attributes=True)


class VariationValueCreate(BaseModel):
    identifier: str
    value: Optional[str] = None
    ordering: int = 0


class VariationValueResponse(BaseModel):
    id: int
    variable_id: int
    identifier: str
    value: Optional[str]
    ordering: int
    model_config = ConfigDict(from_attributes=True)


class VariationResultCreate(BaseModel):
    mapping: dict
    result_product_id: int


class VariationResultResponse(BaseModel):
    id: int
    product_id: int
    combination_hash: str
    result_product_id: int
    status: int
    model_config = ConfigDict(from_attributes=True)


class OrderItemIn(BaseModel):
    product_id: int
    quantity: int


class OrderItemResponse(BaseModel):
    id: int
    product_id: int
    quantity: int
    unit_price: float
    subtotal: float
    model_config = ConfigDict(from_attributes=True)


class OrderCreate(BaseModel):
    items: List[OrderItemIn]
    # shipping_address may be provided as a dict; some legacy clients send a
    # simple string in `address`. We accept both and normalize to a dict.
    shipping_address: Optional[dict] = None
    # legacy alias support: some clients may send 'address' instead of 'shipping_address'
    address: Optional[str | dict] = None
    # Optional coupon code to apply to the order
    coupon_code: Optional[str] = None
    # Affiliate tracking
    affiliate_id: Optional[int] = None

    @field_validator("shipping_address", mode="before")
    def ensure_shipping_address(cls, v, info):
        # If shipping_address provided use it; otherwise, try to read 'address' from input
        if v is not None:
            return v

        # Try to obtain raw input data
        raw = (
            info.data
            if isinstance(info, dict) or hasattr(info, "data")
            else getattr(info, "data", None)
        )
        if isinstance(raw, dict):
            addr = raw.get("address")
        else:
            addr = None

        if addr is None:
            raise ValueError("shipping_address is required")

        # Normalize string address into a minimal dict to satisfy downstream code
        if isinstance(addr, str):
            return {"line1": addr}

        if isinstance(addr, dict):
            return addr

        raise ValueError("Unsupported address format")

class HybridOrderCreate(BaseModel):
    product_id: int
    supplier_id: int
    quantity: int
    price: float


class OrderPreviewRequest(BaseModel):
    items: List[OrderItemIn]
    shipping_address: Optional[dict] = None
    coupon_code: Optional[str] = None

class OrderPreviewResponse(BaseModel):
    subtotal: float
    shipping_cost: float
    tax_total: float
    discount_total: float
    total_amount: float
    currency: str = "SAR"

class OrderResponse(BaseModel):
    id: int
    total_amount: float
    status: str
    shipping_address: dict
    created_at: datetime
    items: List[OrderItemResponse] = []
    model_config = ConfigDict(from_attributes=True)


class RefreshTokenAuditResponse(BaseModel):
    id: int
    user_id: int
    token_id: Optional[int]
    event_type: str
    detail: Optional[str]
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class VendorCreate(BaseModel):
    name: str
    email: Optional[EmailStr] = None
    code: str
    owner_email: Optional[EmailStr] = None


class VendorResponse(BaseModel):
    id: int
    name: str
    code: Optional[str] = None
    status: Optional[str] = "active"
    owner_id: Optional[int] = None
    description: Optional[str] = None
    logo_url: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    return_policy: Optional[str] = None
    shipping_policy: Optional[str] = None
    is_verified: Optional[bool] = False
    verification_document_url: Optional[str] = None
    billing_model: Optional[str] = "commission"
    subscription_plan_id: Optional[int] = None
    # Dropshipping
    is_dropshipping: Optional[bool] = False
    api_connector_code: Optional[str] = None
    api_config: Optional[dict] = None
    
    # Capabilities mapping
    override_limits: Optional[dict] = None
    
    # Elite Customization & Visuals
    theme_color: Optional[str] = None
    background_image_url: Optional[str] = None
    store_ads: Optional[str] = None
    announcement_text: Optional[str] = None
    currency_display: Optional[str] = "SAR"
    
    model_config = ConfigDict(from_attributes=True)


class VendorRegistration(BaseModel):
    name: str
    description: Optional[str] = None
    logo_url: Optional[str] = None
    is_verified: bool = False
    verification_document_url: Optional[str] = None
    billing_model: str = "commission"
    subscription_plan_id: Optional[int] = None
    
    # Dropshipping
    is_dropshipping: bool = False
    api_connector_code: Optional[str] = None
    api_config: Optional[dict] = None
    
    model_config = ConfigDict(from_attributes=True)

class VendorStatusUpdate(BaseModel):
    status: str # active, suspended, rejected

class VendorUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    logo_url: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    return_policy: Optional[str] = None
    shipping_policy: Optional[str] = None
    is_verified: Optional[bool] = None
    verification_document_url: Optional[str] = None
    billing_model: Optional[str] = None
    subscription_plan_id: Optional[int] = None
    is_dropshipping: Optional[bool] = None
    api_connector_code: Optional[str] = None
    api_config: Optional[dict] = None
    
    # Capabilities mapping
    override_limits: Optional[dict] = None
    
    # Elite Customization & Visuals
    theme_color: Optional[str] = None
    background_image_url: Optional[str] = None
    store_ads: Optional[str] = None
    announcement_text: Optional[str] = None
    currency_display: Optional[str] = None


# Messaging Schemas
class MessageCreate(BaseModel):
    content: str

class MessageResponse(BaseModel):
    id: int
    sender_id: int
    content: str
    created_at: datetime
    is_read: bool
    model_config = ConfigDict(from_attributes=True)

class ConversationResponse(BaseModel):
    id: int
    customer_id: int
    vendor_id: int
    updated_at: datetime
    # Optional nested info
    vendor_name: Optional[str] = None 
    customer_name: Optional[str] = None
    last_message: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

# RMA Schemas
class ReturnRequestCreate(BaseModel):
    order_id: int
    product_id: int
    reason: str
    amount: float = 0.0

class ReturnRequestResponse(BaseModel):
    id: int
    user_id: int
    order_id: int
    product_id: int
    reason: str
    status: str
    amount: float
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class NotificationResponse(BaseModel):
    id: int
    user_id: int
    title: str
    content: str
    type: str # info, success, warning, order, promo
    link: Optional[str] = None
    is_read: bool
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


# --- Taxes ---
class TaxRateBase(BaseModel):
    name: str
    rate: float # percentage, e.g. 15.0
    country: Optional[str] = None
    region: Optional[str] = None
    postal_code_pattern: Optional[str] = None
    priority: int = 0
    override: bool = False
    active: bool = True

class TaxRateCreate(TaxRateBase):
    pass

class TaxRateUpdate(BaseModel):
    name: Optional[str] = None
    rate: Optional[float] = None
    country: Optional[str] = None
    region: Optional[str] = None
    postal_code_pattern: Optional[str] = None
    priority: Optional[int] = None
    override: Optional[bool] = None
    active: Optional[bool] = None

class TaxRateResponse(TaxRateBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

# --- Shipping & Logistics ---

class ShippingProviderBase(BaseModel):
    name: str
    code: str
    is_active: bool = True
    description: Optional[str] = None
    api_config: Optional[dict] = None
    environment: str = "sandbox"

class ShippingProviderCreate(ShippingProviderBase):
    pass

class ShippingProviderResponse(ShippingProviderBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class ShippingZoneBase(BaseModel):
    name: str
    provider_id: int
    countries: List[str]
    base_cost: float = 0.0
    cost_per_kg: float = 0.0
    is_active: bool = True

class ShippingZoneCreate(ShippingZoneBase):
    pass

class ShippingZoneResponse(ShippingZoneBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


# --- Analytics & Reporting ---

class TimeSeriesItem(BaseModel):
    date: str
    value: float

class FinancialSummary(BaseModel):
    gmv: float
    vendor_costs: float
    platform_revenue: float
    order_count: int
    period: str # daily, weekly, monthly, yearly

class AnalyticsDashboardResponse(BaseModel):
    summary: FinancialSummary
    sales_over_time: List[TimeSeriesItem]
    top_products: List[dict]
    top_vendors: List[dict]
    top_vendors: List[dict]


# --- Support Ticket System ---

class SupportMessageCreate(BaseModel):
    content: str
    is_internal: bool = False

class SupportMessageResponse(BaseModel):
    id: int
    ticket_id: int
    sender_id: int
    content: str
    is_internal: bool
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class SupportTicketCreate(BaseModel):
    subject: str
    category: Optional[str] = None
    priority: str = "medium"
    initial_message: str
    order_id: Optional[int] = None

class SupportTicketResponse(BaseModel):
    id: int
    user_id: int
    subject: str
    status: str
    priority: str
    category: Optional[str]
    order_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    messages: List[SupportMessageResponse] = []
    model_config = ConfigDict(from_attributes=True)

class SupportTicketUpdate(BaseModel):
    status: Optional[str] = None
    priority: Optional[str] = None

# --- Security & Maintenance ---

class TwoFASecretResponse(BaseModel):
    secret: str
    provisioning_uri: str

class TwoFAVerifyRequest(BaseModel):
    code: str

class SystemHealthResponse(BaseModel):
    status: str
    db_connection: str
    last_backup: str
    uptime: str
    log_warnings_24h: int

# --- BI & Analytics Schemas ---
class FinancialSummary(BaseModel):
    gmv: float
    vendor_costs: float
    platform_revenue: float
    order_count: int
    period: str

class TimeSeriesItem(BaseModel):
    date: str
    value: float

# --- Subscription Plan Schemas ---
class SubscriptionPlanBase(BaseModel):
    name: str
    description: Optional[str] = None
    monthly_price: float = 0.0
    commission_rate: float = 0.10
    is_active: bool = True
    features: Optional[str] = None

class SubscriptionPlanCreate(SubscriptionPlanBase):
    pass

class SubscriptionPlanResponse(SubscriptionPlanBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


# --- Vendor Plan Schemas (Module 3) ---
class VendorPlanBase(BaseModel):
    name: str
    description: Optional[str] = None
    monthly_price: float = 0.0
    yearly_price: float = 0.0
    max_products: int = 50
    max_coupons: int = 0
    commission_rate: float = 0.10
    can_customize_store: bool = False
    can_access_advanced_analytics: bool = False
    can_use_priority_support: bool = False
    allow_whatsapp_checkout: bool = False
    auto_approve_products: bool = False
    is_active: bool = True

class VendorPlanCreate(VendorPlanBase):
    pass

class VendorPlanUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    monthly_price: Optional[float] = None
    yearly_price: Optional[float] = None
    max_products: Optional[int] = None
    max_coupons: Optional[int] = None
    commission_rate: Optional[float] = None
    can_customize_store: Optional[bool] = None
    can_access_advanced_analytics: Optional[bool] = None
    can_use_priority_support: Optional[bool] = None
    allow_whatsapp_checkout: Optional[bool] = None
    auto_approve_products: Optional[bool] = None
    is_active: Optional[bool] = None

class VendorPlanResponse(VendorPlanBase):
    id: int
    model_config = ConfigDict(from_attributes=True)
