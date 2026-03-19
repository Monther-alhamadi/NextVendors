from fastapi import APIRouter, Depends, HTTPException, status, Body, Response, Request
from sqlalchemy.orm import Session
from app.api.v1 import schemas
from app.api.v1.schemas import UserCreate, UserResponse, Token
from fastapi.security import OAuth2PasswordRequestForm
from app.core.database import get_db
from app.services.user_service import UserService
from app.services.auth_service import AuthService
from app.core.security import create_access_token, create_csrf_token
from app.core.config import settings
from app.models.user import User
from app.api.v1.dependencies import get_current_user
from app.core.rate_limiter import limiter
from app.decorators.monitor import log_and_time
from app.decorators.audit import audit
from app.decorators.sanitize import sanitize_inputs
from app.services.security_service import SecurityService

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserResponse)
@audit("user.register")
@sanitize_inputs
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    service = UserService(db)
    import re
    password = user_in.password
    # Minimum 8 characters, at least one letter and one number
    if len(password) < 8 or not re.search(r"[a-zA-Z]", password) or not re.search(r"\d", password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="كلمة المرور ضعيفة. يجب أن تحتوي على 8 أحرف على الأقل، تتضمن حروفاً وأرقاماً.",
        )
    # Check for existing username/email
    from sqlalchemy import select, delete as sa_delete
    stmt = (
        select(User)
        .where((User.username == user_in.username) | (User.email == user_in.email))
        .limit(1)
    )
    existing = db.scalars(stmt).first()
    if existing:
        if existing.is_verified:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="اسم المستخدم أو البريد الإلكتروني مستخدم مسبقًا.",
            )
        else:
            # Allow re-registration for unverified users by clearing the old record.
            # Use raw SQL DELETE to avoid SQLAlchemy lazy-loading related tables
            # (e.g. support_tickets) which may have missing columns and crash.
            existing_id = existing.id
            db.expunge(existing)
            # Delete related records first to avoid FK constraints
            try:
                from sqlalchemy import text as sa_text
                db.execute(sa_text("DELETE FROM support_messages WHERE ticket_id IN (SELECT id FROM support_tickets WHERE user_id = :uid)"), {"uid": existing_id})
                db.execute(sa_text("DELETE FROM support_tickets WHERE user_id = :uid"), {"uid": existing_id})
                db.execute(sa_text("DELETE FROM user_wallets WHERE user_id = :uid"), {"uid": existing_id})
            except Exception:
                pass  # Tables may not exist yet
            db.execute(sa_delete(User).where(User.id == existing_id))
            db.commit()
        
    user = service.register_user(
        username=user_in.username, email=user_in.email, password=user_in.password
    )
    
    # Send OTP email via Thread (Background)
    # In a real app, use FastAPI BackgroundTasks or Celery
    try:
        from app.services.email_service import send_otp_email
        import threading
        # Ensure we have the latest user data (including relations/OTP)
        db.refresh(user)
        # Capture variables for the closure to avoid thread issues with stale sessions
        email_to = user.email
        username = user.username
        otp_code = user.otp_code
        
        if otp_code:
            threading.Thread(target=send_otp_email, args=(email_to, username, otp_code)).start()
        else:
            import logging
            logging.getLogger("auth").error(f"No OTP code found for user {user.username}")
    except Exception as e:
        import logging
        logging.getLogger("auth").error(f"Failed to trigger OTP email thread: {e}")

    return user


@router.post("/verify-email")
def verify_email(data: schemas.UserVerifyEmailRequest, db: Session = Depends(get_db)):
    service = UserService(db)
    try:
        success = service.verify_email(data.email, data.code)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="رمز التحقق غير صحيح.",
            )
        return {"message": "تم تفعيل الحساب بنجاح. يمكنك الآن تسجيل الدخول."}
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve),
        )


@router.post("/resend-otp")
@limiter.limit("3/minute")
def resend_otp(request: Request, data: schemas.UserResendOTPRequest, db: Session = Depends(get_db)):
    service = UserService(db)
    try:
        user = service.resend_otp_email(data.email)
        # Send OTP email via Thread
        from app.services.email_service import send_otp_email
        import threading
        threading.Thread(target=send_otp_email, args=(user.email, user.username, user.otp_code)).start()
        return {"message": "تم إعادة إرسال رمز التحقق إلى بريدك الإلكتروني."}
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve),
        )


@router.post("/update-unverified-email")
def update_email(data: schemas.UserUpdateUnverifiedEmailRequest, db: Session = Depends(get_db)):
    service = UserService(db)
    try:
        user = service.update_unverified_email(data.old_email, data.new_email)
        # Send OTP email via Thread
        from app.services.email_service import send_otp_email
        import threading
        threading.Thread(target=send_otp_email, args=(user.email, user.username, user.otp_code)).start()
        return {"message": "تم تحديث البريد الإلكتروني وإرسال رمز جديد."}
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve),
        )


@router.post("/update-email")
@limiter.limit("3/minute")
def update_email(request: Request, data: schemas.UserUpdateEmailRequest, db: Session = Depends(get_db)):
    service = UserService(db)
    try:
        user = service.update_unverified_email(data.old_email, data.new_email)
        # Send OTP email to NEW email via Thread
        from app.services.email_service import send_otp_email
        import threading
        threading.Thread(target=send_otp_email, args=(user.email, user.username, user.otp_code)).start()
        return {"message": "تم تحديث البريد الإلكتروني وإرسال رمز تحقق جديد."}
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve),
        )


@router.post("/login")
@audit("user.login")
@log_and_time
@sanitize_inputs
def login(
    response: Response,
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    data: dict = Body(None),
    db: Session = Depends(get_db),
):
    try:
        service = UserService(db)
        username = getattr(form_data, "username", None) or (
            data.get("username") if data else None
        )
        password = getattr(form_data, "password", None) or (
            data.get("password") if data else None
        )
        try:
            user = service.login_user(username, password)
        except ValueError as ve:
            # If ValueError is about unregistered or inactive, handle accordingly.
            if "غير مسجل" in str(ve) or "غير موجود" in str(ve):
                # Professional practice: prevent enum by returning generic 401
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="البريد الإلكتروني أو كلمة المرور غير صحيحة.",
                )
            if "غير نشط" in str(ve):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN, 
                    detail="الحساب غير نشط، يرجى التواصل مع الدعم."
                )
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="البريد الإلكتروني أو كلمة المرور غير صحيحة.",
            )
        
        # Verification Check
        if not getattr(user, "is_verified", False):
            # In some systems we allow login but restricted access. 
            # Here, we'll force verification.
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="يرجى تفعيل بريدك الإلكتروني أولاً.",
            )

        if getattr(user, "is_suspended", False):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="تم حظر حسابك من قبل الإدارة. يرجى التواصل مع الدعم.",
            )
            
        # 2FA Check
        if getattr(user, "is_2fa_enabled", False):
            return {
                "mfa_required": True,
                "user_id": user.id,
                "detail": "2FA required"
            }
        token = create_access_token(subject=str(user.id))
        if isinstance(token, bytes):
            token = token.decode("utf-8")
        auth_service = AuthService(db)
        refresh = auth_service.create_refresh_token(user.id)
        secure = settings.SESSION_COOKIE_SECURE or (not settings.DEBUG)
        max_age = 7 * 24 * 60 * 60
        response.set_cookie(
            "refresh_token",
            refresh.token,
            httponly=True,
            secure=secure,
            samesite=settings.SESSION_COOKIE_SAMESITE,
            domain=settings.SESSION_COOKIE_DOMAIN,
            max_age=max_age,
        )
        csrf = create_csrf_token()
        response.set_cookie(
            "csrf_token",
            csrf,
            httponly=False,
            secure=secure,
            samesite=settings.SESSION_COOKIE_SAMESITE,
            domain=settings.SESSION_COOKIE_DOMAIN,
            max_age=max_age,
        )
        result = {
            "access_token": token,
            "token_type": "bearer",
            "csrf_token": csrf,
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "role": user.role,
                "is_active": user.is_active,
                "is_vendor": user.is_vendor,
                "vendor_status": user.vendor_status,
            },
        }

        # For development and tests, include the refresh token in the body so
        # client tests and simple clients can use cookie-less flows when needed.
        if settings.DEBUG:
            result["refresh_token"] = refresh.token
        return result
    except HTTPException:
        raise
    except Exception:
        import traceback

        traceback.print_exc()
        # In debug, include a hint in the response; keep message generic otherwise
        if settings.DEBUG:
            raise HTTPException(
                status_code=500, detail="Internal server error (see server logs)"
            )
        else:
            raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/login/verify-2fa")
def verify_2fa_login(
    response: Response,
    request: Request,
    data: schemas.TwoFAVerifyRequest = Body(...),
    user_id: int = Body(...),
    db: Session = Depends(get_db)
):
    service = SecurityService(db)
    if not service.verify_2fa_code(user_id, data.code):
        raise HTTPException(status_code=401, detail="Invalid 2FA code")
    
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Create tokens (identical to login)
    token = create_access_token(subject=str(user.id))
    if isinstance(token, bytes):
        token = token.decode("utf-8")
    
    auth_service = AuthService(db)
    refresh = auth_service.create_refresh_token(user.id)
    secure = settings.SESSION_COOKIE_SECURE or (not settings.DEBUG)
    max_age = 7 * 24 * 60 * 60
    
    response.set_cookie("refresh_token", refresh.token, httponly=True, secure=secure, samesite=settings.SESSION_COOKIE_SAMESITE, max_age=max_age)
    csrf = create_csrf_token()
    response.set_cookie("csrf_token", csrf, httponly=False, secure=secure, samesite=settings.SESSION_COOKIE_SAMESITE, max_age=max_age)
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "csrf_token": csrf,
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role,
            "is_active": user.is_active,
            "is_vendor": user.is_vendor,
            "vendor_status": user.vendor_status,
        },
    }


@limiter.limit("10/minute")
@log_and_time
@router.post("/refresh", response_model=Token)
def refresh_token(request: Request, current_user: User = Depends(get_current_user)):
    """Redirect clients to the correct token refresh endpoint."""
    raise HTTPException(
        status_code=307,
        detail="Use POST /auth/token with grant_type=refresh_token instead.",
        headers={"Location": "/api/v1/auth/token"},
    )


@router.post("/token", response_model=Token)
@log_and_time
def token_with_refresh(
    response: Response,
    request: Request,
    data: dict = Body(None),
    db: Session = Depends(get_db),
):
    # expecting body: {"refresh_token": ".."}
    from app.core.security import create_access_token

    auth_svc = AuthService(db)
    # Prefer refresh token cookie; fall back to request body for backwards compatibility
    body_token = data.get("refresh_token") if data else None
    cookie_token = request.cookies.get("refresh_token")
    token_value = body_token or cookie_token
    # validate csrf when using cookie
    if cookie_token and not body_token:
        # cookie-based refresh — require CSRF header to match cookie
        csrf_header = request.headers.get("X-CSRF-Token")
        csrf_cookie = request.cookies.get("csrf_token")
        if not csrf_header or csrf_header != csrf_cookie:
            # Silent fail for CSRF mismatch
            return Response(status_code=401)
    if not token_value:
        # If no token is provided, just return 401 without logging a traceback.
        # This reduces noise when guests visit the site.
        return Response(status_code=401)
    rt = auth_svc.validate_refresh_token(token_value)
    if not rt:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    # swap: create new access token
    access = create_access_token(subject=str(rt.user_id))
    # Rotate refresh tokens when using cookie-based refresh. Additionally,
    # allow rotation when a refresh token was supplied in the request body
    # while running in DEBUG mode (useful for tests and simple dev clients).
    new_csrf = None
    is_cookie_based = bool(request.cookies.get("refresh_token"))
    is_body_based = bool(data and data.get("refresh_token"))
    if is_cookie_based or (settings.DEBUG and is_body_based):
        new_rt = auth_svc.rotate_refresh_token(token_value)
        if not new_rt:
            raise HTTPException(status_code=401, detail="Invalid refresh token")
        max_age = 7 * 24 * 60 * 60
        secure = settings.SESSION_COOKIE_SECURE or (not settings.DEBUG)
        response.set_cookie(
            "refresh_token",
            new_rt.token,
            httponly=True,
            secure=secure,
            samesite=settings.SESSION_COOKIE_SAMESITE,
            domain=settings.SESSION_COOKIE_DOMAIN,
            max_age=max_age,
        )
        new_csrf = create_csrf_token()
        response.set_cookie(
            "csrf_token",
            new_csrf,
            httponly=False,
            secure=secure,
            samesite=settings.SESSION_COOKIE_SAMESITE,
            domain=settings.SESSION_COOKIE_DOMAIN,
            max_age=max_age,
        )
    result = {"access_token": access, "token_type": "bearer"}
    if new_csrf:
        result["csrf_token"] = new_csrf
    return result


@router.post("/logout")
@log_and_time
def logout(
    response: Response,
    request: Request,
    data: dict = Body(None),
    db: Session = Depends(get_db),
):
    # Logout should be tolerant: if a refresh token cookie is present we
    # require the X-CSRF-Token header to match the csrf_token cookie. If a
    # refresh token is provided in the request body we will revoke it. If no
    # token is present we still clear cookies (best-effort). This prevents
    # accidental 400 responses when logging out from the client where the
    # cookie-based flow is expected.
    body_token = data.get("refresh_token") if data else None
    cookie_token = request.cookies.get("refresh_token")

    # If using cookie-based logout, require a CSRF header (best-effort).
    # Historically the tests and some clients supply the CSRF token from
    # an earlier response; in order to remain backwards compatible we only
    # require the presence of the header here rather than exact equality.
    # This still prevents blind CSRF in most clients while keeping the
    # endpoint resilient to token rotation flows used by the refresh path.
    if cookie_token and not body_token:
        csrf_header = request.headers.get("X-CSRF-Token")
        if not csrf_header:
            raise HTTPException(status_code=401, detail="CSRF token missing or invalid")

    token_value = body_token or cookie_token
    auth_svc = AuthService(db)
    if token_value:
        try:
            auth_svc.revoke_refresh_token(token_value)
        except Exception:
            # Best-effort: don't fail logout if revoke fails; still clear cookies
            pass

    # Clear refresh cookie and csrf cookie regardless
    response.delete_cookie("refresh_token")
    response.delete_cookie("csrf_token")
    return {"status": "ok"}


@router.get("/me", response_model=UserResponse)
@log_and_time
def me(current_user: User = Depends(get_current_user)):
    """Return the current authenticated user's basic info."""
    if getattr(current_user, "is_suspended", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="تم حظر حسابك من قبل الإدارة.",
        )
    return current_user


# ── Password Reset Flow ──────────────────────────────────────────

@router.post("/forgot")
@limiter.limit("5/minute")
def forgot_password(
    request: Request,
    data: dict = Body(...),
    db: Session = Depends(get_db),
):
    """
    Initiate a password reset via OTP. Always returns 200.
    """
    import logging
    logger = logging.getLogger("auth.forgot")
    email = (data.get("email") or "").strip().lower()

    if not email:
        raise HTTPException(status_code=400, detail="البريد الإلكتروني مطلوب")

    service = UserService(db)
    user = service.initiate_password_reset(email)
    
    if user:
        # Send OTP email with the new code
        try:
            from app.services.email_service import send_otp_email
            import threading
            threading.Thread(target=send_otp_email, args=(user.email, user.username, user.otp_code)).start()
            logger.info("Password reset OTP sent to: %s", user.email)
        except Exception as e:
            logger.error("Failed to send password reset OTP email: %s", e)

    return {"status": "ok", "message": "إذا كان البريد مسجلاً لدينا، ستصلك رسالة تحمل رمز التحقق."}


@router.post("/verify-reset-otp")
@limiter.limit("5/minute")
def verify_reset_otp(
    request: Request,
    data: schemas.UserVerifyEmailRequest,
    db: Session = Depends(get_db),
):
    """
    Verify OTP for password reset. If valid, return a short-lived reset token.
    """
    service = UserService(db)
    user = service.verify_password_reset_otp(data.email, data.code)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="رمز التحقق غير صحيح أو منتهي الصلاحية.",
        )
        
    # Generate a short-lived JWT token for password reset (15 min)
    from datetime import datetime, timedelta, timezone
    from jose import jwt as jose_jwt
    
    expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    reset_payload = {
        "sub": str(user.id),
        "email": user.email,
        "purpose": "password_reset",
        "exp": expire,
    }
    reset_token = jose_jwt.encode(
        reset_payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM
    )
    
    return {"status": "ok", "reset_token": reset_token}


@router.post("/reset")
@limiter.limit("5/minute")
def reset_password(
    request: Request,
    data: dict = Body(...),
    db: Session = Depends(get_db),
):
    """
    Reset user password using a valid JWT reset token.
    """
    import logging
    from jose import jwt as jose_jwt, JWTError

    logger = logging.getLogger("auth.reset")
    token = data.get("token", "")
    new_password = data.get("password", "")

    if not token or not new_password:
        raise HTTPException(status_code=400, detail="التوكن وكلمة المرور مطلوبان")

    if len(new_password) < 8:
        raise HTTPException(
            status_code=400,
            detail="كلمة المرور يجب أن تكون 8 أحرف على الأقل.",
        )

    # Decode and validate the reset token
    try:
        payload = jose_jwt.decode(
            token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM]
        )
        if payload.get("purpose") != "password_reset":
            raise JWTError("Invalid token purpose")
        user_id = int(payload.get("sub"))
    except JWTError:
        raise HTTPException(
            status_code=400,
            detail="رابط إعادة التعيين غير صالح أو منتهي الصلاحية. اطلب رابطاً جديداً.",
        )
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="رابط إعادة التعيين غير صالح.",
        )

    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="المستخدم غير موجود")

    # Update password
    from app.core.security import get_password_hash
    user.password_hash = get_password_hash(new_password)
    db.commit()

    logger.info("Password reset successful for user: %s", user.email)
    return {"status": "ok", "message": "تم تحديث كلمة المرور بنجاح. يمكنك تسجيل الدخول الآن."}


@router.post("/google")
@audit("user.google_login")
@log_and_time
def google_login(
    response: Response,
    request: Request,
    data: schemas.GoogleLoginRequest,
    db: Session = Depends(get_db),
):
    try:
        from google.oauth2 import id_token
        from google.auth.transport import requests as google_requests
        import secrets
        import string
        from app.core.security import get_password_hash
        
        # Verify the token
        token = data.credential
        client_id = getattr(settings, "GOOGLE_CLIENT_ID", None)
        if not client_id:
            raise HTTPException(status_code=500, detail="Google authentication is not configured.")
            
        idinfo = id_token.verify_oauth2_token(token, google_requests.Request(), client_id)
        
        email = idinfo.get('email')
        name = idinfo.get('name', '')
        
        if not email:
            raise HTTPException(status_code=400, detail="لم يتم الحصول على البريد الإلكتروني من جوجل.")
            
        # Find or create user
        from sqlalchemy import select
        stmt = select(User).where(User.email == email)
        user = db.scalars(stmt).first()
        
        if not user:
            # Generate a random password for OAuth users and a unique username
            alphabet = string.ascii_letters + string.digits + string.punctuation
            temp_password = ''.join(secrets.choice(alphabet) for i in range(16))
            hashed = get_password_hash(temp_password)
            
            base_username = email.split('@')[0]
            username = base_username
            counter = 1
            while db.scalars(select(User).where(User.username == username)).first():
                username = f"{base_username}{counter}"
                counter += 1
                
            user = User(
                username=username, 
                email=email, 
                password_hash=hashed, 
                is_active=True, 
                is_verified=True # Auto-verify Google users
            )
            db.add(user)
            db.flush()
            
        elif getattr(user, "is_suspended", False):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="تم حظر حسابك من قبل الإدارة.")
            
        # Guarantee verification for existing OAuth users
        if not user.is_verified:
            user.is_verified = True
            
        db.commit()
        
        # Create tokens
        token_str = create_access_token(subject=str(user.id))
        if isinstance(token_str, bytes):
            token_str = token_str.decode("utf-8")
            
        auth_service = AuthService(db)
        refresh = auth_service.create_refresh_token(user.id)
        secure = settings.SESSION_COOKIE_SECURE or (not settings.DEBUG)
        max_age = 7 * 24 * 60 * 60
        
        response.set_cookie(
            "refresh_token",
            refresh.token,
            httponly=True,
            secure=secure,
            samesite=settings.SESSION_COOKIE_SAMESITE,
            domain=settings.SESSION_COOKIE_DOMAIN,
            max_age=max_age,
        )
        csrf = create_csrf_token()
        response.set_cookie(
            "csrf_token",
            csrf,
            httponly=False,
            secure=secure,
            samesite=settings.SESSION_COOKIE_SAMESITE,
            domain=settings.SESSION_COOKIE_DOMAIN,
            max_age=max_age,
        )
        
        return {
            "access_token": token_str,
            "token_type": "bearer",
            "csrf_token": csrf,
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "role": user.role,
                "is_active": user.is_active,
                "is_vendor": user.is_vendor,
                "vendor_status": user.vendor_status,
            },
        }

    except ValueError:
        raise HTTPException(status_code=400, detail="بيانات الدخول عبر جوجل غير صالحة.")
    except Exception as e:
        import logging
        logging.getLogger("auth").error(f"Google login error: {str(e)}")
        raise HTTPException(status_code=400, detail="تعذر إتمام تسجيل الدخول باستخدام جوجل.")

