import logging
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import exc

from app.core.database import get_db
from app.api.v1.dependencies import require_role
from app.models.cms import Page, Widget
from pydantic import BaseModel

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/cms", tags=["cms"])
admin_router = APIRouter(prefix="/admin/cms", tags=["admin-cms"])

# --- Schemas ---
class WidgetBase(BaseModel):
    type: str
    position: Optional[int] = 0
    config: Dict[str, Any] = {}
    is_active: Optional[bool] = True
    
    class Config:
        orm_mode = True
        from_attributes = True

class WidgetResponse(WidgetBase):
    id: int
    page_id: int

class PageBase(BaseModel):
    title: str
    slug: str
    is_published: Optional[bool] = False
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    
    class Config:
        orm_mode = True
        from_attributes = True

class PageResponse(PageBase):
    id: int
    widgets: List[WidgetResponse] = []

class WidgetReorderItem(BaseModel):
    id: int
    position: int

class BlockReorderPayload(BaseModel):
    widgets: List[WidgetReorderItem]

# --- Public Endpoints (Storefront Renderer) ---

@router.get("/pages/{slug}", response_model=PageResponse)
def get_public_page(slug: str, db: Session = Depends(get_db)):
    """
    Fetch a page and all its active widgets for the storefront to render dynamically.
    """
    page = db.query(Page).filter(Page.slug == slug, Page.is_published == True).first()
    if not page:
        raise HTTPException(status_code=404, detail="Page not found or not published.")
    
    # Return page and ONLY active widgets ordered by position
    active_widgets = [w for w in page.widgets if w.is_active]
    # Sort just in case relation order_by isn't strict in some contexts
    active_widgets.sort(key=lambda x: x.position)
    
    return {
        "id": page.id,
        "title": page.title,
        "slug": page.slug,
        "is_published": page.is_published,
        "meta_title": page.meta_title,
        "meta_description": page.meta_description,
        "widgets": active_widgets
    }

# --- Protected Endpoints (Admin Visual Builder) ---

@admin_router.get("/pages", response_model=List[PageResponse])
def list_admin_pages(db: Session = Depends(get_db), _admin=Depends(require_role("admin"))):
    """List all pages, published or not."""
    return db.query(Page).all()

@admin_router.get("/pages/{slug}", response_model=PageResponse)
def get_admin_page(slug: str, db: Session = Depends(get_db), _admin=Depends(require_role("admin"))):
    """Get page and ALL widgets (including inactive) for editing."""
    page = db.query(Page).filter(Page.slug == slug).first()
    if not page:
         raise HTTPException(status_code=404, detail="Page not found")
    return page

@admin_router.post("/pages", response_model=PageResponse)
def create_page(payload: PageBase, db: Session = Depends(get_db), _admin=Depends(require_role("admin"))):
    try:
        page = Page(**payload.dict())
        db.add(page)
        db.commit()
        db.refresh(page)
        return page
    except exc.IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Slug already exists.")

@admin_router.post("/pages/{page_id}/widgets", response_model=WidgetResponse)
def add_widget(page_id: int, payload: WidgetBase, db: Session = Depends(get_db), _admin=Depends(require_role("admin"))):
    """Add a new widget to a page. Automatically append it to the end."""
    page = db.get(Page, page_id)
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
        
    last_widget = db.query(Widget).filter(Widget.page_id == page_id).order_by(Widget.position.desc()).first()
    next_pos = (last_widget.position + 1) if last_widget else 0
    
    widget = Widget(
        page_id=page_id,
        type=payload.type,
        position=next_pos,
        config=payload.config,
        is_active=payload.is_active
    )
    db.add(widget)
    db.commit()
    db.refresh(widget)
    return widget

@admin_router.put("/widgets/{widget_id}", response_model=WidgetResponse)
def update_widget(widget_id: int, payload: WidgetBase, db: Session = Depends(get_db), _admin=Depends(require_role("admin"))):
    """Fully update a widget's config or status."""
    widget = db.get(Widget, widget_id)
    if not widget:
         raise HTTPException(status_code=404, detail="Widget not found")
         
    widget.type = payload.type
    widget.config = payload.config
    widget.is_active = payload.is_active
    
    db.commit()
    db.refresh(widget)
    return widget

@admin_router.delete("/widgets/{widget_id}")
def delete_widget(widget_id: int, db: Session = Depends(get_db), _admin=Depends(require_role("admin"))):
    widget = db.get(Widget, widget_id)
    if not widget:
         raise HTTPException(status_code=404, detail="Widget not found")
    
    db.delete(widget)
    db.commit()
    return {"status": "deleted"}

@admin_router.put("/pages/{page_id}/widgets/reorder")
def reorder_widgets(page_id: int, payload: BlockReorderPayload, db: Session = Depends(get_db), _admin=Depends(require_role("admin"))):
    """
    Batch update widget positions resulting from a drag-and-drop action.
    """
    # Verify page
    if not db.get(Page, page_id):
        raise HTTPException(status_code=404, detail="Page not found")
        
    for item in payload.widgets:
        widget = db.query(Widget).filter(Widget.id == item.id, Widget.page_id == page_id).first()
        if widget:
            widget.position = item.position
            
    db.commit()
    return {"status": "reordered"}
