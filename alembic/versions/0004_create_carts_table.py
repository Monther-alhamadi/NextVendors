"""create carts table

Revision ID: 0004_create_carts_table
Revises: 0003_create_refresh_token_audit
Create Date: 2025-12-02 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "0004_create_carts_table"
down_revision = "0004_create_products_and_categories"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "carts",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "user_id",
            sa.Integer(),
            sa.ForeignKey("users.id"),
            nullable=False,
            unique=True,
            index=True,
        ),
        sa.Column("items", sa.JSON(), nullable=False),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now()
        ),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
    )


def downgrade():
    op.drop_table("carts")
