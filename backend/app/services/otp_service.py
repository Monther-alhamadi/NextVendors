import random
import string
from datetime import datetime, timedelta
from typing import Optional
from sqlalchemy.orm import Session
from app.models.user import User
from app.core.config import settings

def generate_otp(length: int = 6) -> str:
    """Generate a random numeric OTP."""
    return "".join(random.choices(string.digits, k=length))

class OTPService:
    @staticmethod
    def create_otp(db: Session, user_id: int, expires_minutes: int = 15) -> str:
        """
        Create (or update) an OTP for a user. 
        Enforces a cooldown between sends to prevent abuse.
        """
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError("المستخدم غير موجود.")

        # Cooldown Check (default 60 seconds)
        cooldown = getattr(settings, "OTP_RESEND_COOLDOWN", 60)
        if user.otp_last_sent_at:
            elapsed = (datetime.utcnow() - user.otp_last_sent_at).total_seconds()
            if elapsed < cooldown:
                remaining = int(cooldown - elapsed)
                raise ValueError(f"يرجى الانتظار {remaining} ثانية قبل إعادة إرسال الرمز.")

        otp = generate_otp()
        user.otp_code = otp
        user.otp_expires_at = datetime.utcnow() + timedelta(minutes=expires_minutes)
        user.otp_last_sent_at = datetime.utcnow()
        user.otp_failed_attempts = 0 # Reset attempts on new OTP
        db.commit()
        return otp

    @staticmethod
    def verify_otp(db: Session, user_id: int, code: str) -> bool:
        """Verify the OTP with attempt limiting."""
        user = db.query(User).filter(User.id == user_id).first()
        if not user or not user.otp_code or not user.otp_expires_at:
            return False
            
        # Max Attempts Check (e.g., 5)
        max_attempts = getattr(settings, "OTP_MAX_ATTEMPTS", 5)
        if user.otp_failed_attempts >= max_attempts:
            raise ValueError("لقد تجاوزت الحد الأقصى لمحاولات التحقق. يرجى طلب رمز جديد.")

        if user.otp_expires_at < datetime.utcnow():
            raise ValueError("انتهت صلاحية الرمز. يرجى طلب رمز جديد.")
            
        if user.otp_code == code:
            # Success: Clear OTP and reset attempts
            user.otp_code = None
            user.otp_expires_at = None
            user.otp_failed_attempts = 0
            user.is_verified = True
            db.commit()
            return True
        else:
            # Failure: Increment attempts
            user.otp_failed_attempts += 1
            db.commit()
            return False

otp_service = OTPService()
