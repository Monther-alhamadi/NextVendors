import logging
from typing import Any, Dict, Optional
import emails
import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

def send_email(
    email_to: str,
    subject_template: str = "",
    html_template: str = "",
    environment: Dict[str, Any] = {},
) -> None:
    """
    Send an email using the configured SMTP settings.
    If SMTP is not configured, logs the email content instead (useful for dev).
    """
    assert settings.EMAILS_FROM_EMAIL, "no provider configured for EMAILS_FROM_EMAIL"
    
    # Construct the message using plain strings (no Jinja2 dependency needed)
    message = emails.Message(
        subject=subject_template,
        html=html_template,
        mail_from=(settings.EMAILS_FROM_NAME, settings.EMAILS_FROM_EMAIL),
    )

    # 1. Try Resend HTTP API first (Bypasses Render SMTP port blocking)
    if settings.RESEND_API_KEY:
        try:
            resend_url = "https://api.resend.com/emails"
            headers = {
                "Authorization": f"Bearer {settings.RESEND_API_KEY}",
                "Content-Type": "application/json"
            }
            # For free tier, Resend prefers or forces onboarding@resend.dev unless a custom domain is verified
            from_str = f"{settings.EMAILS_FROM_NAME or settings.APP_NAME} <{settings.EMAILS_FROM_EMAIL}>" if settings.EMAILS_FROM_EMAIL else "onboarding@resend.dev"
            payload = {
                "from": from_str,
                "to": [email_to],
                "subject": subject_template,
                "html": html_template
            }
            with httpx.Client() as client:
                resp = client.post(resend_url, headers=headers, json=payload, timeout=10.0)
                if resp.status_code >= 400:
                    logger.error(f"Resend API FAILED: {resp.text}")
                else:
                    logger.info(f"Resend API SUCCESS: sent to {email_to}")
            return  # Successfully triggered Resend, skip SMTP
        except Exception as e:
            logger.error(f"Resend API Exception: {e}")
            logger.warning("Falling back to standard SMTP due to Resend API failure.")

    # 2. Fallback to standard SMTP
    smtp_options = {"host": str(settings.SMTP_HOST).strip(), "port": settings.SMTP_PORT}

    # Auto-enable TLS for standard secure ports even if settings.SMTP_TLS is False
    if settings.SMTP_TLS or settings.SMTP_PORT in [587, 465, "587", "465"]:
        smtp_options["tls"] = True
    if settings.SMTP_USER:
        smtp_options["user"] = settings.SMTP_USER
    if settings.SMTP_PASSWORD:
        smtp_options["password"] = settings.SMTP_PASSWORD

    # If SMTP is configured, send the email
    if settings.SMTP_HOST and settings.SMTP_PORT:
        response = message.send(to=email_to, smtp=smtp_options)
        if response.status_code is None or response.status_code >= 400:
            error_details = getattr(response, "error", getattr(response, "status_text", "Unknown connection error/timeout"))
            logger.error(f"SMTP FAILED to {email_to} -> {response}. Error Details: {error_details}")
            logger.error(f"Used Host: {smtp_options['host']} | Port: {smtp_options['port']} | TLS: {smtp_options.get('tls', False)}")
        else:
            logger.info(f"send email result: SUCCESS ({response.status_code})")

    else:
        # Development fallback
        logger.warning(
            f"SMTP not fully configured. Simulating email to {email_to}\n"
            f"Subject: {subject_template}\n"
            f"HTML: {html_template}\n"
            "To enable real emails, configure SMTP_* environment variables."
        )

def send_otp_email(email_to: str, username: str, otp: str) -> None:
    subject = f"Verification Code: {otp} - {settings.APP_NAME}"
    html_content = f"""
    <html>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1f2937; line-height: 1.6; background-color: #f9fafb; padding: 40px;">
            <div style="max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
                <div style="text-align: center; margin-bottom: 32px;">
                    <h1 style="color: #4f46e5; margin: 0; font-size: 24px;">Welcome to {settings.APP_NAME}</h1>
                    <p style="color: #6b7280; font-size: 16px;">Verify your email address to get started</p>
                </div>
                
                <p>Hello <strong>{username}</strong>,</p>
                <p>Thank you for joining our ecosystem. Please use the verification code below to confirm your account:</p>
                
                <div style="background: #f3f4f6; padding: 24px; border-radius: 12px; text-align: center; margin: 32px 0;">
                    <span style="font-family: monospace; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #111827;">{otp}</span>
                </div>
                
                <p style="font-size: 14px; color: #6b7280;">This code will expire in 10 minutes. If you did not request this, please ignore this email.</p>
                
                <div style="border-top: 1px solid #e5e7eb; margin-top: 32px; padding-top: 24px; text-align: center; font-size: 14px; color: #9ca3af;">
                    &copy; 2026 {settings.APP_NAME}. All rights reserved.
                </div>
            </div>
        </body>
    </html>
    """
    try:
        # Development / Debugging aid: Always log the OTP so it can be seen even if SMTP fails
        logger.warning(f"⭐⭐⭐ SECURITY OTP FOR {email_to} IS: {otp} ⭐⭐⭐")
        
        send_email(
            email_to=email_to,
            subject_template=subject,
            html_template=html_content,
            environment={"project_name": settings.APP_NAME, "username": username, "otp": otp},
        )
    except Exception as e:
        logger.error(f"Error in send_otp_email to {email_to}: {e}", exc_info=True)
        raise

def send_welcome_email(email_to: str, username: str) -> None:
    subject = f"Welcome to {settings.APP_NAME} - Account Created"
    html_content = f"""
    <html>
        <body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
                <h2 style="color: #6366f1;">Welcome to {settings.APP_NAME}, {username}!</h2>
                <p>We are thrilled to have you on board. Your account has been successfully created.</p>
                <p>If you have any questions, feel free to reply to this email.</p>
                <br>
                <p>Best regards,<br>The {settings.APP_NAME} Team</p>
            </div>
        </body>
    </html>
    """
    send_email(
        email_to=email_to,
        subject_template=subject,
        html_template=html_content,
        environment={"project_name": settings.APP_NAME, "username": username},
    )

def send_order_confirmation_email(email_to: str, order_id: str, amount: float) -> None:
    subject = f"Order #{order_id} Confirmed - {settings.APP_NAME}"
    html_content = f"""
    <html>
        <body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
                <h2 style="color: #10b981;">Order Confirmed!</h2>
                <p>Thank you for shopping with {settings.APP_NAME}.</p>
                <p>We have received your order <strong>#{order_id}</strong> for a total of <strong>{amount} SAR</strong>.</p>
                <p>Your order is currently pending and will be processed shortly by the vendor.</p>
                <br>
                <p>Best regards,<br>The {settings.APP_NAME} Team</p>
            </div>
        </body>
    </html>
    """
    send_email(
        email_to=email_to,
        subject_template=subject,
        html_template=html_content,
        environment={},
    )
