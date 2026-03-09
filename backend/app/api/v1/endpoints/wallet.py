from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.api.v1.dependencies import get_current_user, get_db
from app.services.wallet_service import WalletService, TransactionType
from app.models.user import User
from pydantic import BaseModel

router = APIRouter()

class TransactionRequest(BaseModel):
    amount: float
    description: str

@router.get("/balance")
def get_balance(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return WalletService.get_wallet(db, current_user.id)

@router.post("/top-up")
def top_up_wallet(
    request: TransactionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # In real world, this comes from Payment Webhook. 
    # For dev, we allow self-top-up or specific logic.
    return WalletService.process_transaction(
        db, 
        current_user.id, 
        request.amount, 
        TransactionType.CREDIT, 
        request.description or "Manual Top-up",
        reference_type="manual"
    )

# Admin can debit/credit manually? Add admin endpoint later.
