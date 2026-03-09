from sqlalchemy import Column, Integer, String, Text, DateTime
from datetime import datetime
from app.models.base import SQLAlchemyBaseModel
from app.core.database import Base


class TaskStatus:
    PENDING = "pending"
    RUNNING = "running"
    SUCCESS = "success"
    FAILURE = "failure"


class Task(SQLAlchemyBaseModel, Base):
    __tablename__ = "tasks"

    id: int = Column(Integer, primary_key=True, index=True)
    name: str = Column(String(255), nullable=False, index=True)
    payload: str = Column(Text, nullable=True)
    status: str = Column(String(32), nullable=False, default=TaskStatus.PENDING)
    result: str = Column(Text, nullable=True)
    created_at: DateTime = Column(DateTime, nullable=False, default=datetime.utcnow)
    started_at: DateTime = Column(DateTime, nullable=True)
    finished_at: DateTime = Column(DateTime, nullable=True)
