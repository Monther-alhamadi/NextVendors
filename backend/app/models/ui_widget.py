from sqlalchemy import Column, Integer, String, Boolean, JSON, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import SQLAlchemyBaseModel
from app.core.database import Base

class UIWidget(SQLAlchemyBaseModel, Base):
    __tablename__ = "ui_widgets"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True)
    type = Column(String(50), nullable=False)  # banner, featured_vendors, flash_sales, etc.
    is_active = Column(Boolean, default=True, nullable=False)
    position = Column(Integer, default=0, nullable=False)  # Sort order
    settings_json = Column(JSON, nullable=True)  # Widget-specific configuration

    def __repr__(self):
        return f"<UIWidget {self.name} (active={self.is_active})>"
