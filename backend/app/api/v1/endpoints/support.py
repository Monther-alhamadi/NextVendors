from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.api.v1 import schemas
from app.api.v1.dependencies import get_current_user, require_role
from app.services.support_service import SupportService
from app.models.user import User

router = APIRouter(prefix="/support", tags=["support"])

@router.post("/tickets", response_model=schemas.SupportTicketResponse)
def create_ticket(
    data: schemas.SupportTicketCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = SupportService(db)
    return service.create_ticket(current_user.id, data)

@router.get("/tickets", response_model=List[schemas.SupportTicketResponse])
def list_my_tickets(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = SupportService(db)
    return service.get_user_tickets(current_user.id)

@router.get("/admin/tickets", response_model=List[schemas.SupportTicketResponse])
def admin_list_tickets(
    status: Optional[str] = None,
    role: Optional[str] = None,
    db: Session = Depends(get_db),
    _u = Depends(require_role("admin"))
):
    service = SupportService(db)
    return service.get_all_tickets(status, role)

@router.get("/tickets/{ticket_id}", response_model=schemas.SupportTicketResponse)
def get_ticket_details(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = SupportService(db)
    ticket = service.get_ticket(ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    # Check ownership or admin
    if ticket.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Access denied")
    
    return ticket

@router.post("/tickets/{ticket_id}/messages", response_model=schemas.SupportMessageResponse)
def reply_to_ticket(
    ticket_id: int,
    data: schemas.SupportMessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = SupportService(db)
    ticket = service.get_ticket(ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
        
    if ticket.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Access denied")
    
    return service.add_message(ticket_id, current_user.id, data.content, data.is_internal)

@router.put("/admin/tickets/{ticket_id}", response_model=schemas.SupportTicketResponse)
def update_ticket_status(
    ticket_id: int,
    data: schemas.SupportTicketUpdate,
    db: Session = Depends(get_db),
    _u = Depends(require_role("admin"))
):
    service = SupportService(db)
    res = service.update_ticket(ticket_id, data.model_dump(exclude_unset=True))
    if not res:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return res
