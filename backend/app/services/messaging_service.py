from typing import List, Optional
from sqlalchemy import select, or_, desc, func, update
from sqlalchemy.orm import Session, joinedload
from datetime import datetime
from app.models.messaging import Conversation, Message
from app.models.supplier import Supplier
from app.models.user import User

class MessagingService:
    def __init__(self, db: Session):
        self.db = db

    def list_conversations(self, user_id: int, is_vendor: bool = False) -> List[Conversation]:
        """
        List conversations for a user.
        If is_vendor=True, user_id is the OWNER ID of the vendor(s). 
        """
        stmt = select(Conversation).options(
            joinedload(Conversation.vendor),
            joinedload(Conversation.customer),
            joinedload(Conversation.messages) # Careful with large history
        )
        
        if is_vendor:
            # Find vendor(s) owned by this user
            sub = select(Supplier.id).where(Supplier.owner_id == user_id)
            stmt = stmt.where(Conversation.vendor_id.in_(sub))
        else:
            stmt = stmt.where(Conversation.customer_id == user_id)
            
        stmt = stmt.order_by(desc(Conversation.updated_at))
        return list(self.db.execute(stmt).scalars().unique().all())

    def get_conversation(self, conv_id: int, user_id: int) -> Optional[Conversation]:
        """Get details if user is participant"""
        stmt = select(Conversation).where(Conversation.id == conv_id).options(
            joinedload(Conversation.messages).joinedload(Message.sender)
        )
        conv = self.db.execute(stmt).scalars().first()
        if not conv:
            return None
            
        # Access control
        # If user is customer: matches customer_id
        # If user is vendor owner: vendor.owner_id matches user_id
        is_participant = False
        if conv.customer_id == user_id:
            is_participant = True
        else:
            # Check vendor ownership
            vendor = self.db.get(Supplier, conv.vendor_id)
            if vendor and vendor.owner_id == user_id:
                is_participant = True
        
        if not is_participant:
            raise PermissionError("Access denied")
            
        return conv

    def start_conversation(self, customer_id: int, vendor_id: int) -> Conversation:
        # Check existing
        stmt = select(Conversation).where(
            Conversation.customer_id == customer_id, 
            Conversation.vendor_id == vendor_id
        )
        existing = self.db.execute(stmt).scalars().first()
        if existing:
            return existing
            
        conv = Conversation(customer_id=customer_id, vendor_id=vendor_id)
        self.db.add(conv)
        self.db.commit()
        self.db.refresh(conv)
        return conv

    def send_message(self, conv_id: int, sender_id: int, content: str) -> Message:
        # Verify convo existence and update timestamp
        conv = self.db.get(Conversation, conv_id)
        if not conv:
            raise ValueError("Conversation not found")
            
        db_msg = Message(
            conversation_id=conv_id,
            sender_id=sender_id,
            content=content,
            is_read=False # default explicitly
        )
        self.db.add(db_msg)
        conv.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(db_msg)
        return db_msg

    def mark_read(self, conv_id: int, user_id: int):
        """Mark messages as read for a participant (where they are NOT the sender)"""
        stmt = update(Message).where(
            Message.conversation_id == conv_id,
            Message.sender_id != user_id,
            Message.is_read == False
        ).values(is_read=True)
        self.db.execute(stmt)
        self.db.commit()

    def get_unread_count(self, user_id: int, is_vendor: bool = False) -> int:
        """Count unread messages where user is NOT the sender"""
        if is_vendor:
            # Vendor unread: messages in conversations where vendor owner is user_id
            # but sender is NOT user_id
            sub = select(Supplier.id).where(Supplier.owner_id == user_id)
            stmt = select(func.count(Message.id)).join(Conversation).where(
                Conversation.vendor_id.in_(sub),
                Message.sender_id != user_id,
                Message.is_read == False
            )
        else:
            # Customer unread
            stmt = select(func.count(Message.id)).join(Conversation).where(
                Conversation.customer_id == user_id,
                Message.sender_id != user_id,
                Message.is_read == False
            )
        return self.db.execute(stmt).scalar() or 0
