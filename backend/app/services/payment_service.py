from typing import Optional
from app.models.payment import Payment
from app.models.order import Order
from app.services.crud_service import CRUDService


class PaymentService(CRUDService[Payment]):
    def __init__(self, db):
        super().__init__(db, Payment)

    def create_payment(
        self, order_id: int, amount: float, provider: str = "stripe"
    ) -> Payment:
        try:
            order = self.db.get(Order, order_id)
        except Exception:
            order = self.db.query(Order).get(order_id)
        if not order:
            raise ValueError("Order not found")
        payment = Payment(
            order_id=order_id, amount=amount, provider=provider, status="pending"
        )
        return self.create(payment)

    def confirm_payment(self, payment_id: int) -> Payment:
        payment = self.get_by_id(payment_id)
        if not payment:
            raise ValueError("Payment not found")
        payment.status = "confirmed"
        try:
            self.db.commit()
        except Exception:
            self.db.rollback()
            raise
        return self.get_by_id(payment_id)

    def get_status(self, payment_id: int) -> Optional[str]:
        p = self.get_by_id(payment_id)
        return p.status if p else None
