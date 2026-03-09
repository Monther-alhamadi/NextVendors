from abc import ABC, abstractmethod
from typing import List, Optional, TypeVar, Generic

T = TypeVar("T")


class BaseService(ABC, Generic[T]):
    """BaseService provides a repository-like interface for business logic services."""

    def __init__(self, db):
        self.db = db

    @abstractmethod
    def get_by_id(self, id: int) -> Optional[T]:
        raise NotImplementedError

    @abstractmethod
    def get_all(self) -> List[T]:
        raise NotImplementedError

    @abstractmethod
    def create(self, obj: T) -> T:
        raise NotImplementedError

    @abstractmethod
    def update(self, id: int, obj: T) -> Optional[T]:
        raise NotImplementedError

    @abstractmethod
    def delete(self, id: int) -> bool:
        raise NotImplementedError
