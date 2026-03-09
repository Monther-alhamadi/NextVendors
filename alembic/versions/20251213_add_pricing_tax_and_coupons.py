"""Add tax_rates and coupons tables and order tax/discount columns

Revision ID: 20251213_add_pricing_tax_and_coupons
Revises: 
Create Date: 2025-12-13 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "20251213_add_pricing_tax_and_coupons"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create tax_rates table
    op.create_table(
        "tax_rates",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("rate", sa.Float(), nullable=False, default=0.0),
        sa.Column("country", sa.String(length=8), nullable=True),
        sa.Column("active", sa.Boolean(), nullable=False, server_default=sa.text("1")),
    )

    # Create coupons table
    op.create_table(
        "coupons",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("code", sa.String(length=64), nullable=False, unique=True),
        sa.Column("amount", sa.Float(), nullable=False, default=0.0),
        sa.Column("amount_type", sa.String(length=16), nullable=False, default="fixed"),
        sa.Column("active", sa.Boolean(), nullable=False, server_default=sa.text("1")),
        sa.Column("max_uses", sa.Integer(), nullable=True),
        sa.Column("used_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("min_order_amount", sa.Float(), nullable=True),
        sa.Column("expires_at", sa.DateTime(), nullable=True),
    )

    # Add tax_total and discount_total to orders table if table exists
    conn = op.get_bind()
    insp = sa.inspect(conn)
    if "orders" in insp.get_table_names():
        cols = [c["name"] for c in insp.get_columns("orders")]
        if "tax_total" not in cols:
            op.add_column(
                "orders",
                sa.Column("tax_total", sa.Float(), nullable=False, server_default="0"),
            )
        if "discount_total" not in cols:
            op.add_column(
                "orders",
                sa.Column(
                    "discount_total", sa.Float(), nullable=False, server_default="0"
                ),
            )


def downgrade() -> None:
    op.drop_table("coupons")
    op.drop_table("tax_rates")
    # dropping columns may be destructive; only drop if present
    conn = op.get_bind()
    insp = sa.inspect(conn)
    if "orders" in insp.get_table_names():
        cols = [c["name"] for c in insp.get_columns("orders")]
        if "tax_total" in cols:
            op.drop_column("orders", "tax_total")
        if "discount_total" in cols:
            op.drop_column("orders", "discount_total")
