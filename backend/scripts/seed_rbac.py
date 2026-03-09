import sys
import os
import argparse
import logging
from typing import List, Dict

# Add the project root to the sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.database import SessionLocal
import app.models  # Ensure all models and relationships are registered
from main import app as main_app  # Initialize all routes and mappers flawlessly
from app.models.rbac import Role, Permission
from app.models.user import User

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Define the exhaustive list of permissions
PERMISSIONS: List[Dict[str, str]] = [
    {"slug": "manage_users", "name": "Manage Users"},
    {"slug": "manage_roles", "name": "Manage Roles & Permissions"},
    {"slug": "manage_products", "name": "Manage Global Products"},
    {"slug": "manage_orders", "name": "Manage All Orders"},
    {"slug": "manage_vendors", "name": "Manage Vendors"},
    {"slug": "manage_billing", "name": "Manage Billing & Payouts"},
    {"slug": "manage_ads", "name": "Manage Advertisements"},
    {"slug": "manage_settings", "name": "Manage System Settings"},
    {"slug": "manage_storefront", "name": "Manage Storefront UI (Widgets/Banners)"},
    {"slug": "view_analytics", "name": "View Global Analytics"},
    {"slug": "manage_support", "name": "Manage Support Tickets"},
    
    # Vendor-specific permissions (can be assigned to vendor custom roles later)
    {"slug": "vendor_manage_products", "name": "Manage Own Products"},
    {"slug": "vendor_manage_orders", "name": "Manage Own Orders"},
    {"slug": "vendor_view_analytics", "name": "View Own Analytics"},
    {"slug": "vendor_manage_settings", "name": "Manage Vendor Profile"},
]

def seed_rbac():
    db = SessionLocal()
    try:
        # 1. Create permissions
        logger.info("Seeding permissions...")
        perm_map = {}
        for p_data in PERMISSIONS:
            perm = db.query(Permission).filter(Permission.slug == p_data["slug"]).first()
            if not perm:
                perm = Permission(slug=p_data["slug"], name=p_data["name"])
                db.add(perm)
                db.flush()
                logger.info(f"Created permission: {perm.slug}")
            perm_map[perm.slug] = perm

        # 2. Create foundational Roles
        admin_role = db.query(Role).filter(Role.name == "admin").first()
        if not admin_role:
            admin_role = Role(name="admin")
            db.add(admin_role)
            db.flush()
            logger.info("Created role: admin")
            
        vendor_role = db.query(Role).filter(Role.name == "vendor").first()
        if not vendor_role:
            vendor_role = Role(name="vendor")
            db.add(vendor_role)
            db.flush()
            logger.info("Created role: vendor")

        customer_role = db.query(Role).filter(Role.name == "customer").first()
        if not customer_role:
            customer_role = Role(name="customer")
            db.add(customer_role)
            db.flush()
            logger.info("Created role: customer")

        # 3. Assign Permissions to Admin
        logger.info("Assigning ALL permissions to Admin role...")
        admin_role.permissions = list(perm_map.values())
        
        # 4. Assign Permissions to Vendor
        logger.info("Assigning base vendor permissions to Vendor role...")
        vendor_perms = ["vendor_manage_products", "vendor_manage_orders", "vendor_view_analytics", "vendor_manage_settings"]
        vendor_role.permissions = [perm_map[slug] for slug in vendor_perms if slug in perm_map]

        db.commit()
        
        # 5. Migrate users
        logger.info("Migrating legacy users to RBAC roles...")
        users = db.query(User).all()
        migrated_count = 0
        for user in users:
            # Bind based on legacy role token if no RBAC roles exist
            if not user.roles:
                target_role = db.query(Role).filter(Role.name == user.role).first()
                if target_role:
                    user.roles.append(target_role)
                    migrated_count += 1
        
        if migrated_count > 0:
            db.commit()
            logger.info(f"Migrated {migrated_count} users to new RBAC relationship.")
            
        logger.info("RBAC Seeding completed successfully.")
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error during seeding: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_rbac()
