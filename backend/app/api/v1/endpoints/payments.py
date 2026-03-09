"""
Payment Intent Simulation.

This module provides a **mock** payment flow for development and testing.
In production, replace with a real payment provider (Stripe, PayPal, Tap, etc.)
by setting the PAYMENT_PROVIDER environment variable.

IMPORTANT: The mock provider should NEVER be used in production.
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
import uuid
import asyncio
from app.api.v1 import dependencies as deps
from app.models.user import User
from app.core.config import settings

router = APIRouter()


class PaymentIntentCreate(BaseModel):
    amount: int  # in cents
    currency: str = "usd"


class PaymentIntentConfirm(BaseModel):
    payment_id: str


@router.post("/create-intent", response_model=dict)
async def create_payment_intent(
    intent_in: PaymentIntentCreate,
    current_user: User = Depends(deps.get_current_user),
):
    """
    Create a payment intent.

    Currently uses a mock provider. In production, wire this to
    Stripe/PayPal/Tap via the PAYMENT_PROVIDER config.
    """
    if not settings.DEBUG:
        # In production, a real payment provider must be configured.
        # For now, raise an error to prevent accidental mock usage.
        raise HTTPException(
            status_code=501,
            detail="Payment provider not configured. Set PAYMENT_PROVIDER env var.",
        )

    # Simulate brief processing (non-blocking, unlike time.sleep)
    await asyncio.sleep(0.2)

    payment_id = f"pi_{uuid.uuid4().hex}"
    client_secret = f"{payment_id}_secret_{uuid.uuid4().hex}"

    return {
        "client_secret": client_secret,
        "payment_id": payment_id,
        "status": "requires_payment_method",
        "provider": "mock",
    }


@router.post("/confirm", response_model=dict)
async def confirm_payment(
    confirm_in: PaymentIntentConfirm,
    current_user: User = Depends(deps.get_current_user),
):
    """
    Confirm a payment.

    Currently uses a mock that always succeeds. Wire to real provider
    for production use.
    """
    if not settings.DEBUG:
        raise HTTPException(
            status_code=501,
            detail="Payment provider not configured. Set PAYMENT_PROVIDER env var.",
        )

    await asyncio.sleep(0.3)

    return {
        "status": "succeeded",
        "payment_id": confirm_in.payment_id,
        "provider": "mock",
    }
