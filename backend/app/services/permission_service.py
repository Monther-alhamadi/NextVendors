from sqlalchemy.orm import Session
from typing import Optional
from app.models.user import User
from app.models.rbac import Role, Permission
import logging

logger = logging.getLogger(__name__)

class PermissionService:
    def __init__(self, db: Session):
        self.db = db

    def check_permission(self, user_id: int, permission_slug: str) -> bool:
        """Check if user has a specific permission via RBAC"""
        user = self.db.get(User, user_id)
        if not user:
            return False
        
        # Use the existing has_permission method from User model
        return user.has_permission(permission_slug)

    def assign_role_to_user(self, user_id: int, role_name: str) -> bool:
        """Assign a role to a user (admin operation)"""
        user = self.db.get(User, user_id)
        if not user:
            raise ValueError(f"User #{user_id} not found")
        
        role = self.db.query(Role).filter(Role.name == role_name).first()
        if not role:
            raise ValueError(f"Role '{role_name}' not found")
        
        if role not in user.roles:
            user.roles.append(role)
            self.db.commit()
            logger.info(f"Assigned role '{role_name}' to user #{user_id}")
        
        return True

    def get_user_permissions(self, user_id: int) -> list:
        """Get all permission slugs for a user"""
        user = self.db.get(User, user_id)
        if not user:
            return []
        
        permissions = set()
        for role in user.roles:
            for perm in role.permissions:
                permissions.add(perm.slug)
        
        return list(permissions)

    def create_role_with_permissions(self, role_name: str, description: str, permission_slugs: list) -> Role:
        """Create a new role with specified permissions"""
        role = Role(name=role_name, description=description)
        self.db.add(role)
        self.db.flush()
        
        for slug in permission_slugs:
            perm = self.db.query(Permission).filter(Permission.slug == slug).first()
            if perm:
                role.permissions.append(perm)
        
        self.db.commit()
        self.db.refresh(role)
        return role
