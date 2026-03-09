from sqlalchemy import Column, Integer, DateTime
from datetime import datetime, timezone


class SQLAlchemyBaseModel:
    """Mixin providing common columns to SQLAlchemy declarative models.

    This mixin is intentionally lightweight so it works with both
    SQLAlchemy 1.x and 2.x declarative bases provided elsewhere in the app.
    """

    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )


__all__ = ["SQLAlchemyBaseModel"]
