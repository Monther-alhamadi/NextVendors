from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from typing import List, TYPE_CHECKING
from app.models.base import SQLAlchemyBaseModel
from app.core.database import Base
from app.core import security
from sqlalchemy.orm import relationship
from app.models.rbac import model_has_roles

if TYPE_CHECKING:
    from app.models.order import Order  # noqa: F401
    from app.models.wallet import UserWallet

class User(SQLAlchemyBaseModel, Base):
    __tablename__ = "users"

    id: int = Column(Integer, primary_key=True, index=True)
    username: str = Column(String(150), unique=True, nullable=False, index=True)
    email: str = Column(String(254), unique=True, nullable=False, index=True)
    password_hash: str = Column(String(255), nullable=False)
    
    # Legacy role field - kept for backward compatibility but RBAC is preferred
    role: str = Column(String(50), nullable=False, default="customer") 
    
    # Segmentation
    customer_group_id = Column(Integer, ForeignKey("customer_groups.id"), nullable=True)

    is_active: bool = Column(Boolean, default=True, nullable=False)
    is_suspended: bool = Column(Boolean, default=False, nullable=False)
    
    # 2FA Security
    totp_secret: str = Column(String(32), nullable=True)
    is_2fa_enabled: bool = Column(Boolean, default=False, nullable=False)
    
    # Relationships
    return_requests = relationship("ReturnRequest", back_populates="user")
    
    # RBAC
    roles = relationship("Role", secondary=model_has_roles, back_populates="users")
    
    # Wallet & Group
    wallet = relationship("UserWallet", uselist=False, back_populates="user", cascade="all, delete-orphan")
    customer_group = relationship("CustomerGroup", back_populates="users")

    @property
    def is_vendor(self) -> bool:
        """Check if the user has an associated supplier/vendor record."""
        return len(self.suppliers) > 0 if hasattr(self, "suppliers") else False

    @property
    def vendor_status(self) -> str:
        """Return the status of the first associated supplier record if it exists."""
        if self.is_vendor and self.suppliers:
            return self.suppliers[0].status
        return "none"

    def set_password(self, plain: str) -> None:
        self.password_hash = security.get_password_hash(plain)

    def verify_password(self, plain: str) -> bool:
        return security.verify_password(plain, self.password_hash)
    
    def has_permission(self, permission_slug: str) -> bool:
        for r in self.roles:
            for p in r.permissions:
                if p.slug == permission_slug:
                    return True
        return False
    
    def has_role(self, role_name: str) -> bool:
        # Check RBAC roles
        for r in self.roles:
            if r.name == role_name:
                return True
        # Check legacy role field as fallback
        if self.role == role_name:
            return True
        return False

    def get_orders(self) -> List[object]:
        try:
            from sqlalchemy.orm import object_session
            sess = object_session(self)
            if sess is None:
                return []
            from app.models.order import Order
            return sess.query(Order).filter(Order.user_id == self.id).all()
        except Exception:
            return []


__all__ = ["User"]
