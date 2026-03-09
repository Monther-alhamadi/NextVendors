from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.wallet import UserWallet, WalletTransaction, TransactionType
from app.models.user import User

class WalletService:
    @staticmethod
    def get_wallet(db: Session, user_id: int) -> UserWallet:
        wallet = db.query(UserWallet).filter(UserWallet.user_id == user_id).first()
        if not wallet:
            # Auto-create wallet if missing
            wallet = UserWallet(user_id=user_id)
            db.add(wallet)
            db.commit()
            db.refresh(wallet)
        return wallet

    @staticmethod
    def add_to_pending(
        db: Session, 
        user_id: int, 
        amount: float, 
        description: str,
        reference_id: str = None,
        reference_type: str = "order"
    ):
        """Add funds to escrow (pending_balance)."""
        try:
            wallet = db.query(UserWallet).filter(UserWallet.user_id == user_id).with_for_update().first()
            if not wallet:
                wallet = UserWallet(user_id=user_id)
                db.add(wallet)
                db.flush()
            
            wallet.pending_balance += amount
            
            tx = WalletTransaction(
                wallet_id=wallet.id,
                amount=amount,
                transaction_type="credit_pending",
                description=description,
                reference_id=reference_id,
                reference_type=reference_type
            )
            db.add(tx)
            db.commit()
            return wallet
        except Exception as e:
            db.rollback()
            raise e

    @staticmethod
    def confirm_pending_to_available(
        db: Session, 
        user_id: int, 
        amount: float, 
        description: str,
        reference_id: str = None
    ):
        """Move funds from escrow to available balance."""
        try:
            wallet = db.query(UserWallet).filter(UserWallet.user_id == user_id).with_for_update().first()
            if not wallet or wallet.pending_balance < amount:
                raise HTTPException(status_code=400, detail="Insufficient pending funds")
            
            wallet.pending_balance -= amount
            wallet.balance += amount
            
            tx = WalletTransaction(
                wallet_id=wallet.id,
                amount=amount,
                transaction_type=TransactionType.CREDIT.value,
                description=description,
                reference_id=reference_id,
                reference_type="escrow_release"
            )
            db.add(tx)
            db.commit()
            return wallet
        except Exception as e:
            db.rollback()
            raise e

    @staticmethod
    def create_payout_request(
        db: Session,
        user_id: int,
        amount: float,
        method: str,
        details: dict
    ):
        """Create a new payout request for the vendor."""
        try:
            wallet = db.query(UserWallet).filter(UserWallet.user_id == user_id).with_for_update().first()
            if not wallet or wallet.balance < amount:
                raise HTTPException(status_code=400, detail="Insufficient available balance")
            
            # Deduct immediately to prevent double spending
            wallet.balance -= amount
            
            from app.models.wallet import PayoutRequest, PayoutStatus
            payout = PayoutRequest(
                user_id=user_id,
                amount=amount,
                method=method,
                details=details,
                status=PayoutStatus.PENDING.value
            )
            db.add(payout)
            
            tx = WalletTransaction(
                wallet_id=wallet.id,
                amount=amount,
                transaction_type=TransactionType.DEBIT.value,
                description=f"Payout request ({method})",
                reference_id=None,
                reference_type="payout"
            )
            db.add(tx)
            
            db.commit()
            db.refresh(payout)
            return payout
        except Exception as e:
            db.rollback()
            raise e

    @staticmethod
    def list_payout_requests(db: Session, status: str = None):
        from app.models.wallet import PayoutRequest
        query = db.query(PayoutRequest)
        if status:
            query = query.filter(PayoutRequest.status == status)
        return query.order_by(PayoutRequest.created_at.desc()).all()

    @staticmethod
    def approve_payout(db: Session, payout_id: int):
        from app.models.wallet import PayoutRequest, PayoutStatus
        payout = db.get(PayoutRequest, payout_id)
        if not payout:
            raise HTTPException(status_code=404, detail="Payout requested not found")
        
        payout.status = PayoutStatus.COMPLETED.value
        payout.updated_at = datetime.utcnow()
        db.commit()
        return payout

    @staticmethod
    def reject_payout(db: Session, payout_id: int, reason: str = None):
        from app.models.wallet import PayoutRequest, PayoutStatus, UserWallet, WalletTransaction, TransactionType
        payout = db.get(PayoutRequest, payout_id)
        if not payout or payout.status != PayoutStatus.PENDING.value:
            raise HTTPException(status_code=400, detail="Invalid payout request or already processed")
        
        # Restore funds to user wallet
        wallet = db.query(UserWallet).filter(UserWallet.user_id == payout.user_id).with_for_update().first()
        if wallet:
            wallet.balance += payout.amount
            
            tx = WalletTransaction(
                wallet_id=wallet.id,
                amount=payout.amount,
                transaction_type=TransactionType.CREDIT.value,
                description=f"Payout rejected: {reason or 'Denied by admin'}",
                reference_id=str(payout.id),
                reference_type="payout_rejection"
            )
            db.add(tx)
        
        payout.status = PayoutStatus.REJECTED.value
        payout.details = (payout.details or {})
        payout.details["rejection_reason"] = reason
        payout.updated_at = datetime.utcnow()
        
        db.commit()
        return payout
