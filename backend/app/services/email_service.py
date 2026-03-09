import logging
from typing import Any, Dict, Optional
import emails
from emails.template import JinjaTemplate

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
    
    # Construct the message
    message = emails.Message(
        subject=JinjaTemplate(subject_template),
        html=JinjaTemplate(html_template),
        mail_from=(settings.EMAILS_FROM_NAME, settings.EMAILS_FROM_EMAIL),
    )

    smtp_options = {"host": settings.SMTP_HOST, "port": settings.SMTP_PORT}

    if settings.SMTP_TLS:
        smtp_options["tls"] = True
    if settings.SMTP_USER:
        smtp_options["user"] = settings.SMTP_USER
    if settings.SMTP_PASSWORD:
        smtp_options["password"] = settings.SMTP_PASSWORD

    # If SMTP is configured, send the email
    if settings.SMTP_HOST and settings.SMTP_PORT:
        response = message.send(to=email_to, render=environment, smtp=smtp_options)
        logger.info(f"send email result: {response}")
    else:
        # Development fallback
        logger.warning(
            f"SMTP not fully configured. Simulating email to {email_to}\n"
            f"Subject: {subject_template}\n"
            f"HTML: {html_template}\n"
            "To enable real emails, configure SMTP_* environment variables."
        )

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
