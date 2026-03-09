from sqlalchemy import Column, Integer, String, Table, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import SQLAlchemyBaseModel
from app.core.database import Base

# Association Tables
model_has_roles = Table(
    "model_has_roles",
    Base.metadata,
    Column("role_id", Integer, ForeignKey("roles.id"), primary_key=True),
    Column("user_id", Integer, ForeignKey("users.id"), primary_key=True),
)

role_has_permissions = Table(
    "role_has_permissions",
    Base.metadata,
    Column("role_id", Integer, ForeignKey("roles.id"), primary_key=True),
    Column("permission_id", Integer, ForeignKey("permissions.id"), primary_key=True),
)

class Role(SQLAlchemyBaseModel, Base):
    __tablename__ = "roles"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False) # Admin, Vendor, Customer
    guard_name = Column(String(50), default="web")
    
    permissions = relationship("Permission", secondary=role_has_permissions, backref="roles")
    users = relationship("User", secondary=model_has_roles, back_populates="roles")

class Permission(SQLAlchemyBaseModel, Base):
    __tablename__ = "permissions"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False) # Human readable
    slug = Column(String(100), unique=True, nullable=False) # e.g. manage_vendors
    guard_name = Column(String(50), default="web")
