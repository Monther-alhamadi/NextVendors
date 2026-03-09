from sqlalchemy import Column, Integer, String, Boolean, Text, DateTime
from sqlalchemy.sql import func
from app.core.database import Base

class Setting(Base):
    __tablename__ = "system_settings"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(50), unique=True, index=True, nullable=False)
    value = Column(Text, nullable=True)  # Store everything as string/JSON
    type = Column(String(20), default="string") # string, boolean, integer, json
    description = Column(String(255), nullable=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
