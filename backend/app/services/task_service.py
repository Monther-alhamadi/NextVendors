import json
from datetime import datetime
from typing import Callable, Dict, Any, Optional

from app.services.crud_service import CRUDService
from app.models.task import Task, TaskStatus


class TaskService(CRUDService[Task]):
    def __init__(self, db):
        super().__init__(db, Task)

    def enqueue(self, name: str, payload: Optional[Dict[str, Any]] = None) -> Task:
        payload_s = json.dumps(payload) if payload is not None else None
        t = Task(name=name, payload=payload_s, status=TaskStatus.PENDING)
        self.db.add(t)
        self.db.commit()
        return t

    def fetch_next(self) -> Optional[Task]:
        # simple FIFO fetch for pending tasks
        q = (
            self.db.query(Task)
            .filter(Task.status == TaskStatus.PENDING)
            .order_by(Task.created_at.asc())
            .limit(1)
            .all()
        )
        return q[0] if q else None

    def run_task(
        self, task: Task, registry: Dict[str, Callable[[Optional[Dict[str, Any]]], Any]]
    ):
        task.status = TaskStatus.RUNNING
        task.started_at = datetime.utcnow()
        self.db.commit()
        try:
            payload = json.loads(task.payload) if task.payload else None
            fn = registry.get(task.name)
            if not fn:
                raise KeyError(f"No task registered for {task.name}")
            res = fn(payload)
            task.result = json.dumps(res) if res is not None else None
            task.status = TaskStatus.SUCCESS
        except Exception as exc:
            task.result = str(exc)
            task.status = TaskStatus.FAILURE
        finally:
            task.finished_at = datetime.utcnow()
            self.db.commit()
        return task
