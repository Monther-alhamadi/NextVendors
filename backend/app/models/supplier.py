from sqlalchemy import Column, Integer, String, ForeignKey, Float, Boolean, JSON, Text
from sqlalchemy.orm import relationship
from app.models.base import SQLAlchemyBaseModel
from app.core.database import Base

class Supplier(SQLAlchemyBaseModel, Base):
    __tablename__ = "suppliers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False) # Legal Name or Vendor Name
    
    # Reseller Fields
    email = Column(String(255), nullable=True)
    status = Column(String(50), default="active") # active, inactive
    code = Column(String(50), nullable=True, unique=True, index=True)
    
    # Financials & Plan
    commission_rate = Column(Float, default=0.10) # Overrides plan rate if set? Or base rate.
    plan_id = Column(Integer, ForeignKey("vendor_plans.id"), nullable=True)
    override_limits = Column(JSON, nullable=True) # e.g. {"max_products": 500, "can_customize_store": True}
    
    # TRUST & SAFETY
    kyc_status = Column(String(20), default="pending") # pending, approved, rejected
    trust_score = Column(Integer, default=100)
    is_banned = Column(Boolean, default=False)
    is_verified = Column(Boolean, default=False) # Helper for quick check
    
    # Storefront Flexibility metrics
    total_sales = Column(Integer, default=0)
    rating = Column(Float, default=0.0)
    pinned_product_id = Column(Integer, ForeignKey("products.id"), nullable=True)
    
    # Dropshipping Integration
    is_dropshipping = Column(Boolean, default=False)
    api_connector_code = Column(String(50), nullable=True) # e.g. 'aliexpress', 'dsers'
    api_config = Column(JSON, nullable=True) # stores credentials

    # Contact Info (Private, internal use)
    contact_email = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)
    whatsapp_number = Column(String(50), nullable=True) # For Hybrid Commerce WhatsApp Routing
    address = Column(String(512), nullable=True)

    # Store Profile (vendor-level, not per-store)
    description = Column(Text, nullable=True)
    logo_url = Column(String(512), nullable=True)
    verification_document_url = Column(String(512), nullable=True)
    return_policy = Column(Text, nullable=True)
    shipping_policy = Column(Text, nullable=True)
    
    # Hybrid Commerce Options
    allow_direct_orders = Column(Boolean, default=False)
    preferred_settlement_method = Column(String(50), default="platform") # platform, post_billing, subscription, pay_per_lead
    
    # Portal Access
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    # Relationships
    owner = relationship("User", backref="suppliers")
    plan = relationship("VendorPlan", back_populates="suppliers")
    store = relationship("Store", uselist=False, back_populates="vendor", cascade="all, delete-orphan")
    kyc_documents = relationship("KYCDocument", back_populates="vendor", cascade="all, delete-orphan")
    products = relationship("SupplierProduct", back_populates="supplier")

    @property
    def capabilities(self):
        """
        Merge the vendor's plan limits with any vendor-specific overrides.
        This provides a unified dict of all capabilities and limits for the frontend.
        """
        base_capabilities = {}
        if self.plan:
            base_capabilities = {
                "max_products": self.plan.max_products,
                "can_customize_store": self.plan.can_customize_store,
                "can_access_advanced_analytics": self.plan.can_access_advanced_analytics,
                "can_use_priority_support": self.plan.can_use_priority_support,
                "auto_approve_products": self.plan.auto_approve_products,
                "max_coupons": self.plan.max_coupons,
                "allow_whatsapp_checkout": self.plan.allow_whatsapp_checkout,
            }
        
        # Merge with overrides
        overrides = self.override_limits or {}
        merged = {**base_capabilities, **overrides}
        return merged

    @property
    def theme_color(self):
        return self.store.theme_color if self.store else None

    @property
    def background_image_url(self):
        return self.store.background_image_url if self.store else None

    @property
    def store_ads(self):
        return self.store.store_ads if self.store else None

    @property
    def announcement_text(self):
        return self.store.announcement_text if self.store else None

    @property
    def currency_display(self):
        return self.store.currency_display if self.store else "SAR"

    def __repr__(self):
        return f"<Supplier {self.name}>"

