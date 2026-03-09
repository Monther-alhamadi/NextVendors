from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.api.v1.dependencies import get_current_user
from app.models.user import User
from app.services.messaging_service import MessagingService
from app.api.v1.schemas import MessageCreate, MessageResponse, ConversationResponse

router = APIRouter(prefix="/chat", tags=["chat"])

@router.get("/conversations", response_model=List[ConversationResponse])
def get_my_conversations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List conversations. Automatically detects if user is vendor or customer."""
    svc = MessagingService(db)
    # Check if user is a vendor owner
    is_vendor = current_user.role in ['vendor', 'admin'] and len(current_user.suppliers) > 0
    
    convs = svc.list_conversations(current_user.id, is_vendor=is_vendor)
    
    # Map to schema manually to handle dynamic fields if needed or let Pydantic handle it
    out = []
    for c in convs:
        last_msg = c.messages[-1].content if c.messages else "No messages yet"
        out.append({
            "id": c.id,
            "customer_id": c.customer_id,
            "vendor_id": c.vendor_id,
            "updated_at": c.updated_at,
            "vendor_name": c.vendor.name if c.vendor else "Unknown",
            "customer_name": c.customer.username if c.customer else "Unknown",
            "last_message": last_msg
        })
    return out

@router.get("/unread-count")
def get_unread_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    svc = MessagingService(db)
    is_vendor = current_user.role in ['vendor', 'admin'] and len(current_user.suppliers) > 0
    count = svc.get_unread_count(current_user.id, is_vendor=is_vendor)
    return {"count": count}

@router.get("/{id}/messages", response_model=List[MessageResponse])
def get_messages(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        conv = svc.get_conversation(id, current_user.id)
        if not conv:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        # Mark as read when fetching history
        svc.mark_read(id, current_user.id)
        
        return conv.messages
    except PermissionError:
        raise HTTPException(status_code=403, detail="Not a participant")

@router.post("/start/{vendor_id}", response_model=ConversationResponse)
def start_chat(
    vendor_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    svc = MessagingService(db)
    try:
        conv = svc.start_conversation(current_user.id, vendor_id)
        return {
            "id": conv.id,
            "customer_id": conv.customer_id,
            "vendor_id": conv.vendor_id,
            "updated_at": conv.updated_at,
            "vendor_name": conv.vendor.name if conv.vendor else "Unknown",
            "customer_name": current_user.username,
            "last_message": ""
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{id}/messages", response_model=MessageResponse)
def send_message(
    id: int,
    data: MessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    svc = MessagingService(db)
    try:
        # Check permissions implicitly via get_conversation first
        svc.get_conversation(id, current_user.id) 
        msg = svc.send_message(id, current_user.id, data.content)
        return msg
    except PermissionError:
        raise HTTPException(status_code=403, detail="Not a participant")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
