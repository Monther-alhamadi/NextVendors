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
        user = User(username=username, email=email, password_hash=hashed)
        return self.create(user)

    def login_user(self, username_or_email: str, password: str) -> Optional[User]:
        q = self.db.query(User).filter(
            (User.username == username_or_email) | (User.email == username_or_email)
        )
        user = q.first()
        if not user:
            # المستخدم غير موجود
            return None
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

    def change_password(self, user_id: int, new_password: str) -> bool:
        user = self.get_by_id(user_id)
        if not user:
            return False
        user.set_password(new_password)
        self.db.commit()
        return True
