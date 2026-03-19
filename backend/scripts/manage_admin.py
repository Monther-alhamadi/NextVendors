import sys
import os
import getpass
import argparse

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal
from app.models.user import User
from app.core.security import get_password_hash

def create_admin(email: str = None, username: str = None, password: str = None):
    db = SessionLocal()
    try:
        if not email:
            email = os.getenv("SUPERUSER_EMAIL")
        if not username:
            username = os.getenv("SUPERUSER_USERNAME") # Changed from os.getenv("SUPERUSER_USERNAME", "admin")
        if not password:
            password = os.getenv("SUPERUSER_PASSWORD")

        # Interactive fallback
        if not email:
            email = input("Admin Email: ").strip()
        if not username:
            username = input("Admin Username [admin]: ").strip() or "admin" # Removed f-string
        if not password:
            password = getpass.getpass("Admin Password: ")
            confirm = getpass.getpass("Confirm Password: ")
            if password != confirm:
                print("Passwords do not match!")
                return

        if not email or not password:
            print("Email and password are required.")
            return

        existing = db.query(User).filter((User.email == email) | (User.username == username)).first()
        if existing:
            print(f"User with email {email} or username {username} already exists.")
            # Optionally upgrade to admin
            if existing.role != "admin":
                make_admin = input("User exists but is not admin. Make them admin? (y/n): ")
                if make_admin.lower() == 'y':
                    existing.role = "admin"
                    db.commit()
                    print(f"User {username} is now an admin.")
            return

        hashed_pw = get_password_hash(password)
        admin_user = User(
            username=username,
            email=email,
            password_hash=hashed_pw,
            role="admin",
            is_active=True,
            is_verified=True,
        )
        db.add(admin_user)
        db.commit()
        print(f"Successfully created admin user: {username} ({email})")

    except Exception as e:
        print(f"An error occurred: {e}")
        db.rollback()
    finally:
        db.close()

def reset_password(email: str):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            print(f"No user found with email {email}")
            return
            
        password = getpass.getpass(f"New Password for {email}: ")
        confirm = getpass.getpass("Confirm Password: ")
        if password != confirm:
            print("Passwords do not match!")
            return
            
        user.password_hash = get_password_hash(password)
        db.commit()
        print(f"Successfully reset password for {email}")
    finally:
        db.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Admin Management CLI")
    subparsers = parser.add_subparsers(dest="action", help="Action to perform")
    
    # Create parser
    create_parser = subparsers.add_parser("create", help="Create a new admin user")
    create_parser.add_argument("--email", help="Admin email")
    create_parser.add_argument("--username", help="Admin username")
    
    # Reset password parser
    reset_parser = subparsers.add_parser("reset-password", help="Reset a user's password")
    reset_parser.add_argument("email", help="Email of the user to reset")

    args = parser.parse_args()

    if args.action == "create":
        create_admin(args.email, args.username)
    elif args.action == "reset-password":
        reset_password(args.email)
    else:
        # Default behavior if run without args (e.g. from a container script that just sets ENV vars)
        if os.getenv("SUPERUSER_EMAIL") and os.getenv("SUPERUSER_PASSWORD"):
            print("Detected SUPERUSER ENV variables. Attempting auto-creation...")
            create_admin()
        else:
            parser.print_help()
