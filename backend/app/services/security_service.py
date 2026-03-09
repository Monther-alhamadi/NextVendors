import pyotp
from sqlalchemy.orm import Session
from app.models.user import User

class SecurityService:
    def __init__(self, db: Session):
        self.db = db

    def generate_2fa_secret(self, user_id: int) -> str:
        secret = pyotp.random_base32()
        user = self.db.get(User, user_id)
        if user:
            user.totp_secret = secret
            self.db.commit()
        return secret

    def verify_2fa_code(self, user_id: int, code: str) -> bool:
        user = self.db.get(User, user_id)
        if not user or not user.totp_secret:
            return False
        
        totp = pyotp.TOTP(user.totp_secret)
        return totp.verify(code)

    def enable_2fa(self, user_id: int):
        user = self.db.get(User, user_id)
        if user:
            user.is_2fa_enabled = True
            self.db.commit()

    def disable_2fa(self, user_id: int):
        user = self.db.get(User, user_id)
        if user:
            user.is_2fa_enabled = False
            user.totp_secret = None
            self.db.commit()

    def get_provisioning_uri(self, user_id: int, issuer_name: str = "ECoMarket") -> str:
        user = self.db.get(User, user_id)
        if not user or not user.totp_secret:
            return ""
        return pyotp.TOTP(user.totp_secret).provisioning_uri(name=user.email, issuer_name=issuer_name)
