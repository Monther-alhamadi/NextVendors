from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models.support_ticket import SupportTicket, SupportMessage, TicketStatus, TicketPriority
from app.api.v1 import schemas

class SupportService:
    def __init__(self, db: Session):
        self.db = db

    def create_ticket(self, user_id: int, data: schemas.SupportTicketCreate) -> SupportTicket:
        ticket = SupportTicket(
            user_id=user_id,
            subject=data.subject,
            category=data.category,
            priority=data.priority,
            order_id=data.order_id
        )
        self.db.add(ticket)
        self.db.commit()
        self.db.refresh(ticket)

        # Create initial message
        msg = SupportMessage(
            ticket_id=ticket.id,
            sender_id=user_id,
            content=data.initial_message
        )
        self.db.add(msg)
        self.db.commit()
        self.db.refresh(ticket)
        return ticket

    def add_message(self, ticket_id: int, user_id: int, content: str, is_internal: bool = False) -> SupportMessage:
        msg = SupportMessage(
            ticket_id=ticket_id,
            sender_id=user_id,
            content=content,
            is_internal=is_internal
        )
        self.db.add(msg)
        
        # Update ticket timestamp
        ticket = self.db.get(SupportTicket, ticket_id)
        if ticket:
            ticket.updated_at = msg.created_at
            
        self.db.commit()
        self.db.refresh(msg)
        return msg

    def get_user_tickets(self, user_id: int) -> List[SupportTicket]:
        return self.db.query(SupportTicket).filter(SupportTicket.user_id == user_id).order_by(SupportTicket.updated_at.desc()).all()

    def get_all_tickets(self, status: Optional[str] = None, role: Optional[str] = None) -> List[SupportTicket]:
        from app.models.user import User
        query = self.db.query(SupportTicket)
        if role:
            query = query.join(SupportTicket.user).filter(User.role == role)
        if status:
            query = query.filter(SupportTicket.status == status)
        return query.order_by(SupportTicket.updated_at.desc()).all()

    def get_ticket(self, ticket_id: int) -> Optional[SupportTicket]:
        return self.db.get(SupportTicket, ticket_id)

    def update_ticket(self, ticket_id: int, data: Dict[str, Any]) -> Optional[SupportTicket]:
        ticket = self.db.get(SupportTicket, ticket_id)
        if not ticket:
            return None
        
        for k, v in data.items():
            if hasattr(ticket, k):
                setattr(ticket, k, v)
        
        self.db.commit()
        self.db.refresh(ticket)
        return ticket
