from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List, Dict, Any

from app.core.database import get_db
from app.models.rbac import Role, Permission
from app.models.user import User
from app.api.v1.dependencies import require_role
from pydantic import BaseModel

router = APIRouter(prefix="/admin/rbac", tags=["admin-rbac"])

# Define pydantic schemas locally for RBAC payload validation
class RoleCreate(BaseModel):
    name: str
    description: str = ""
    permissions: List[str] = []  # list of permission slugs

class RoleUpdate(BaseModel):
    name: str
    permissions: List[str] = []

class UserRolesUpdate(BaseModel):
    roles: List[str] = [] # list of role names

@router.get("/permissions")
def list_permissions(db: Session = Depends(get_db), _admin = Depends(require_role("admin"))):
    perms = db.query(Permission).all()
    return [{"id": p.id, "slug": p.slug, "name": p.name} for p in perms]

@router.get("/roles")
def list_roles(db: Session = Depends(get_db), _admin = Depends(require_role("admin"))):
    roles = db.query(Role).all()
    # Eagerly loaded or simple mapping
    result = []
    for r in roles:
        result.append({
            "id": r.id,
            "name": r.name,
            "permissions": [p.slug for p in r.permissions]
        })
    return result

@router.post("/roles")
def create_role(payload: RoleCreate, db: Session = Depends(get_db), _admin = Depends(require_role("admin"))):
    if db.query(Role).filter(Role.name == payload.name).first():
        raise HTTPException(status_code=400, detail="Role name already exists")
        
    role = Role(name=payload.name)
    db.add(role)
    db.flush()
    
    if payload.permissions:
        perms = db.query(Permission).filter(Permission.slug.in_(payload.permissions)).all()
        role.permissions = perms
        
    db.commit()
    return {"status": "created", "role_id": role.id, "name": role.name}

@router.put("/roles/{role_id}")
def update_role(role_id: int, payload: RoleUpdate, db: Session = Depends(get_db), _admin = Depends(require_role("admin"))):
    role = db.get(Role, role_id)
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
        
    if role.name in ["admin", "vendor", "customer"] and payload.name != role.name:
         raise HTTPException(status_code=400, detail="Cannot rename fundamental system roles")
         
    role.name = payload.name
    perms = db.query(Permission).filter(Permission.slug.in_(payload.permissions)).all()
    role.permissions = perms
    
    db.commit()
    return {"status": "updated", "role_id": role.id}

@router.delete("/roles/{role_id}")
def delete_role(role_id: int, db: Session = Depends(get_db), _admin = Depends(require_role("admin"))):
    role = db.get(Role, role_id)
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
        
    if role.name in ["admin", "vendor", "customer"]:
         raise HTTPException(status_code=400, detail="Cannot delete fundamental system roles")
         
    db.delete(role)
    db.commit()
    return {"status": "deleted"}

@router.put("/users/{user_id}/roles")
def assign_user_roles(user_id: int, payload: UserRolesUpdate, db: Session = Depends(get_db), _admin = Depends(require_role("admin"))):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    roles = db.query(Role).filter(Role.name.in_(payload.roles)).all()
    user.roles = roles
    db.commit()
    
    return {"status": "roles_updated", "user_id": user.id, "roles": [r.name for r in user.roles]}
