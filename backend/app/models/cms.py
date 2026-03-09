from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.models.base import SQLAlchemyBaseModel
from app.core.database import Base

class Page(SQLAlchemyBaseModel, Base):
    """
    Represents a dynamic layout page (e.g., Home, About, Landing).
    """
    __tablename__ = "cms_pages"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    slug = Column(String(255), nullable=False, unique=True, index=True)
    is_published = Column(Boolean, default=False)
    meta_title = Column(String(255), nullable=True)
    meta_description = Column(String(512), nullable=True)

    # Relationships
    widgets = relationship("Widget", back_populates="page", cascade="all, delete-orphan", order_by="Widget.position")

    def __repr__(self):
        return f"<Page {self.slug}>"


class Widget(SQLAlchemyBaseModel, Base):
    """
    Represents a specific dynamic block component on a Page.
    """
    __tablename__ = "cms_widgets"

    id = Column(Integer, primary_key=True, index=True)
    page_id = Column(Integer, ForeignKey("cms_pages.id"), nullable=False, index=True)
    
    # Identifier for the frontend React component (e.g., 'HeroBanner', 'ProductSlider')
    type = Column(String(100), nullable=False)
    
    # Display order on the page
    position = Column(Integer, default=0)
    
    # JSON payload defining the state/props of the widget (content, colors, images)
    config = Column(JSON, default=dict)
    
    is_active = Column(Boolean, default=True)

    # Relationships
    page = relationship("Page", back_populates="widgets")

    def __repr__(self):
        return f"<Widget {self.type} on Page {self.page_id}>"
