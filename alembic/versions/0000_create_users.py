"""create users table

Revision ID: 0000_create_users
Revises:
Create Date: 2025-12-12 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "0000_create_users"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "username", sa.String(length=150), nullable=False, unique=True, index=True
        ),
        sa.Column(
            "email", sa.String(length=254), nullable=False, unique=True, index=True
        ),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column(
            "role", sa.String(length=50), nullable=False, server_default="customer"
        ),
        sa.Column(
            "is_active", sa.Boolean(), nullable=False, server_default=sa.text("1")
        ),
    )


def downgrade():
    op.drop_table("users")
