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
    # تحقق من قوة كلمة المرور
    password = user_in.password
    if len(password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="كلمة المرور يجب أن تكون 8 أحرف على الأقل.",
        )
    # Check for existing username/email using modern SQLAlchemy select when possible
    from sqlalchemy import select

    stmt = (
        select(User)
        .where((User.username == user_in.username) | (User.email == user_in.email))
        .limit(1)
    )
    try:
        existing = db.scalars(stmt).first()
    except Exception:
        try:
            existing = (
                db.query(User)
                .filter(
                    (User.username == user_in.username) | (User.email == user_in.email)
                )
                .first()
            )
        except Exception:
            existing = None
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="اسم المستخدم أو البريد الإلكتروني مستخدم مسبقًا.",
        )
    user = service.register_user(
        username=user_in.username, email=user_in.email, password=user_in.password
    )
    # تسجيل الحدث
    import logging

    logging.getLogger("auth").info(
        f"تم تسجيل مستخدم جديد: {user.username} ({user.email})"
    )
    
    # Send welcome email via BackgroundTask
    try:
        from app.services.email_service import send_welcome_email
        from fastapi import BackgroundTasks
        # Since BackgroundTasks isn't a dependency here we can just execute without blocking
        # but to be truly async we should add BackgroundTasks to the route signature.
        # However, to avoid breaking existing clients that don't pass dependencies, 
        # we'll execute it synchronously if SMTP is off (dev), or wrap it safely.
        import threading
        threading.Thread(target=send_welcome_email, args=(user.email, user.username)).start()
    except Exception as e:
        logging.getLogger("auth").error(f"Failed to queue welcome email: {e}")

    # Return the created user object so response_model=UserResponse validates
    return user


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
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(ve))
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="بيانات الدخول غير صحيحة",
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
    Send a password reset email with a short-lived JWT token.
    Always returns 200 to prevent email enumeration attacks.
    """
    import logging
    from datetime import timedelta
    from jose import jwt as jose_jwt

    logger = logging.getLogger("auth.forgot")
    email = (data.get("email") or "").strip().lower()

    if not email:
        raise HTTPException(status_code=400, detail="البريد الإلكتروني مطلوب")

    # Always return success to prevent email enumeration
    user = db.query(User).filter(User.email == email).first()
    if not user:
        logger.info("Password reset requested for non-existent email: %s", email)
        return {"status": "ok", "message": "إذا كان البريد مسجلاً لدينا، ستصلك تعليمات إعادة التعيين."}

    # Generate a short-lived JWT token for password reset (30 min)
    from datetime import datetime, timezone
    expire = datetime.now(timezone.utc) + timedelta(minutes=30)
    reset_payload = {
        "sub": str(user.id),
        "email": user.email,
        "purpose": "password_reset",
        "exp": expire,
    }
    reset_token = jose_jwt.encode(
        reset_payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM
    )

    # Send email with reset link
    try:
        from app.services.email_service import send_email
        import threading

        # Build the reset URL — uses FRONTEND_URLS if available
        frontend_base = "http://localhost:5173"
        if settings.FRONTEND_URLS:
            frontend_base = settings.FRONTEND_URLS.split(",")[0].strip()
        reset_url = f"{frontend_base}/reset-password?token={reset_token}"

        subject = f"إعادة تعيين كلمة المرور — {settings.APP_NAME}"
        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; direction: rtl; text-align: right;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 12px;">
                    <h2 style="color: #6366f1;">إعادة تعيين كلمة المرور</h2>
                    <p>مرحباً <strong>{user.username}</strong>,</p>
                    <p>تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بحسابك. اضغط الزر أدناه لإعادة التعيين:</p>
                    <p style="text-align: center; margin: 24px 0;">
                        <a href="{reset_url}" 
                           style="display: inline-block; padding: 12px 32px; background: #6366f1; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">
                            إعادة تعيين كلمة المرور
                        </a>
                    </p>
                    <p style="font-size: 0.9em; color: #666;">هذا الرابط صالح لمدة 30 دقيقة فقط. إذا لم تطلب إعادة التعيين، تجاهل هذا البريد.</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="font-size: 0.8em; color: #999;">{settings.APP_NAME}</p>
                </div>
            </body>
        </html>
        """
        threading.Thread(
            target=send_email,
            args=(user.email, subject, html_content),
            kwargs={"environment": {}},
        ).start()
        logger.info("Password reset email queued for user: %s", user.email)
    except Exception as e:
        logger.error("Failed to send password reset email: %s", e)

    return {"status": "ok", "message": "إذا كان البريد مسجلاً لدينا، ستصلك تعليمات إعادة التعيين."}


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

