from typing import Generic, List, Optional, Type, TypeVar

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.services.base_service import BaseService

T = TypeVar("T")


class CRUDService(BaseService[T], Generic[T]):
    """Generic CRUD service for SQLAlchemy models.

    Provides sensible defaults for common operations. Individual services
    can subclass this and override behavior when domain logic is required.
    """

    def __init__(self, db: Session, model: Type[T]) -> None:
        super().__init__(db)
        self.model = model

    def get_by_id(self, id: int) -> Optional[T]:
        try:
            return self.db.get(self.model, id)
        except Exception:
            stmt = select(self.model).where(self.model.id == id).limit(1)
            return self.db.execute(stmt).scalars().first()

    def get(self, id: int) -> Optional[T]:
        """Alias for get_by_id for convenience."""
        return self.get_by_id(id)

    def get_all(self) -> List[T]:
        stmt = select(self.model)
        return list(self.db.execute(stmt).scalars().all())

    def create(self, obj: T) -> T:
        # Accept either a mapped instance or a plain dataclass/dict-like.
        if isinstance(obj, dict):
            obj = self.model(**obj)
        self.db.add(obj)
        try:
            self.db.commit()
            self.db.refresh(obj)
        except Exception:
            self.db.rollback()
            raise
        return obj

    def update(self, id: int, obj: T) -> Optional[T]:
        existing = self.get_by_id(id)
        if not existing:
            return None
        # Accept dicts, pydantic models, or mapped instances.
        updates = None
        # Plain dict (preferred)
        if isinstance(obj, dict):
            updates = obj
        # Pydantic v2 model
        elif hasattr(obj, "model_dump"):
            try:
                updates = obj.model_dump()
            except Exception:
                updates = None
        # Pydantic v1 or objects exposing dict()
        elif hasattr(obj, "dict"):
            try:
                updates = obj.dict()
            except Exception:
                updates = None

        # Fallback: use object's __dict__ excluding SQLAlchemy internals
        if updates is None:
            raw = getattr(obj, "__dict__", {})
            updates = {
                k: v
                for k, v in raw.items()
                if not k.startswith("_sa_") and not k.startswith("_")
            }

        for key, val in updates.items():
            # Only set attributes that actually exist on the model
            if hasattr(existing, key):
                setattr(existing, key, val)

        try:
            self.db.commit()
            # ensure the instance is refreshed from the DB
            try:
                self.db.refresh(existing)
            except Exception:
                # ignore refresh failures but return the best-effort object
                pass
        except Exception:
            self.db.rollback()
            raise

        return existing

    def delete(self, id: int) -> bool:
        existing = self.get_by_id(id)
        if not existing:
            return False
        try:
            self.db.delete(existing)
            self.db.commit()
            return True
        except Exception:
            self.db.rollback()
            raise
