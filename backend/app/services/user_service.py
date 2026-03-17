from typing import Optional
from sqlalchemy.orm import Session
from app.models.user import User
from app.services.crud_service import CRUDService
from app.core.security import get_password_hash, needs_rehash


class UserService(CRUDService[User]):
    def __init__(self, db: Session) -> None:
        super().__init__(db, User)

    # Business-specific
    def register_user(self, username: str, email: str, password: str) -> User:
        hashed = get_password_hash(password)
        from app.services.otp_service import otp_service
        user = User(username=username, email=email, password_hash=hashed, is_active=True, is_verified=False)
        self.db.add(user)
        self.db.flush() # Get user ID
        # Generate OTP
        otp_service.create_otp(self.db, user.id)
        self.db.commit()
        self.db.refresh(user)
        return user

    def verify_email(self, email: str, code: str) -> bool:
        from sqlalchemy import select
        stmt = select(User).where(User.email == email)
        user = self.db.scalars(stmt).first()
        if not user:
            return False
        
        from app.services.otp_service import otp_service
        return otp_service.verify_otp(self.db, user.id, code)

    def login_user(self, username_or_email: str, password: str) -> Optional[User]:
        q = self.db.query(User).filter(
            (User.username == username_or_email) | (User.email == username_or_email)
        )
        user = q.first()
        if not user:
            # المستخدم غير موجود
            raise ValueError("الحساب غير مسجل في النظام. يرجى إنشاء حساب جديد.")
        if not user.is_active:
            # المستخدم غير نشط
            raise ValueError("الحساب غير نشط، يرجى التواصل مع الدعم.")
        if not user.verify_password(password):
            # كلمة المرور خاطئة
            return None

        # If the stored hash uses an older policy, transparently upgrade it.
        try:
            if needs_rehash(user.password_hash):
                user.password_hash = get_password_hash(password)
                self.db.add(user)
                self.db.commit()
        except Exception:
            # Don't fail login on rehash errors; log at higher level if desired.
            pass

        return user

    def resend_otp_email(self, email: str) -> User:
        from sqlalchemy import select
        stmt = select(User).where(User.email == email)
        user = self.db.scalars(stmt).first()
        if not user:
            raise ValueError("المستخدم غير موجود.")
        if user.is_verified:
            raise ValueError("الحساب مفعل بالفعل.")
            
        from app.services.otp_service import otp_service
        otp_service.create_otp(self.db, user.id)
        self.db.commit()
        return user

    def update_unverified_email(self, old_email: str, new_email: str) -> User:
        from sqlalchemy import select
        stmt = select(User).where(User.email == old_email)
        user = self.db.scalars(stmt).first()
        if not user:
            raise ValueError("المستخدم غير موجود.")
        if user.is_verified:
            raise ValueError("الحساب مفعل بالفعل، لا يمكن تغيير البريد الإلكتروني هنا.")
        
        # Check if new email exists
        stmt_new = select(User).where(User.email == new_email)
        existing = self.db.scalars(stmt_new).first()
        if existing:
            raise ValueError("البريد الإلكتروني الجديد مستخدم بالفعل.")
            
        user.email = new_email
        # Trigger new OTP automatically
        from app.services.otp_service import otp_service
        otp_service.create_otp(self.db, user.id)
        self.db.commit()
        return user

    def initiate_password_reset(self, email: str) -> Optional[User]:
        from sqlalchemy import select
        stmt = select(User).where(User.email == email)
        user = self.db.scalars(stmt).first()
        if not user:
            return None
            
        from app.services.otp_service import otp_service
        otp_service.create_otp(self.db, user.id)
        self.db.commit()
        self.db.refresh(user)
        return user

    def verify_password_reset_otp(self, email: str, code: str) -> Optional[User]:
        from sqlalchemy import select
        stmt = select(User).where(User.email == email)
        user = self.db.scalars(stmt).first()
        if not user:
            return None
        
        from app.services.otp_service import otp_service
        if otp_service.verify_otp(self.db, user.id, code):
            return user
        return None

    def change_password(self, user_id: int, new_password: str) -> bool:
        user = self.get_by_id(user_id)
        if not user:
            return False
        user.set_password(new_password)
        self.db.commit()
        return True
