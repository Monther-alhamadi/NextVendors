from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from app.models.ui_widget import UIWidget

class WidgetService:
    def __init__(self, db: Session):
        self.db = db

    def get_active_widgets(self) -> List[UIWidget]:
        """Get all active widgets ordered by position"""
        return self.db.query(UIWidget).filter(
            UIWidget.is_active == True
        ).order_by(UIWidget.position).all()

    def get_all_widgets(self) -> List[UIWidget]:
        """Get all widgets (for admin management)"""
        return self.db.query(UIWidget).order_by(UIWidget.position).all()

    def toggle_widget(self, widget_id: int, is_active: bool) -> UIWidget:
        """Enable or disable a widget"""
        widget = self.db.get(UIWidget, widget_id)
        if not widget:
            raise ValueError(f"Widget #{widget_id} not found")
        
        widget.is_active = is_active
        self.db.commit()
        self.db.refresh(widget)
        return widget

    def update_widget_settings(self, widget_id: int, settings: Dict[str, Any]) -> UIWidget:
        """Update widget configuration"""
        widget = self.db.get(UIWidget, widget_id)
        if not widget:
            raise ValueError(f"Widget #{widget_id} not found")
        
        widget.settings_json = settings
        self.db.commit()
        self.db.refresh(widget)
        return widget

    def create_widget(self, name: str, widget_type: str, position: int = 0, settings: Optional[Dict] = None) -> UIWidget:
        """Create a new widget"""
        widget = UIWidget(
            name=name,
            type=widget_type,
            position=position,
            settings_json=settings or {}
        )
        self.db.add(widget)
        self.db.commit()
        self.db.refresh(widget)
        return widget
