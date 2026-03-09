from sqlalchemy import Table, Column, Integer
from app.core.database import Base


product_categories = Table(
    "product_categories",
    Base.metadata,
    # Keep simple integer keys for the association table in tests/dev so we
    # avoid strict ForeignKey resolution and import order issues. We use
    # migrations in production to add proper FK constraints.
    Column("product_id", Integer, primary_key=True),
    Column("category_id", Integer, primary_key=True),
    # For dev & tests we keep simple integer columns and avoid adding FK
    # constraints here to prevent import-order related failures during
    # module import and mapper initialization. Use Alembic migrations in
    # production to add FK constraints.
)
