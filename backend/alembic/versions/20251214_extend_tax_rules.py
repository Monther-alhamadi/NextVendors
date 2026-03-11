"""Extend tax_rates with region/postal/priority/override

Revision ID: 20251214_extend_tax_rules
Revises: 20251213_add_pricing_tax_and_coupons
Create Date: 2025-12-14 00:30:00.000000
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "20251214_extend_tax_rules"
down_revision = "20251213_add_pricing_tax_and_coupons"
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    insp = sa.inspect(conn)
    if "tax_rates" in insp.get_table_names():
        cols = [c["name"] for c in insp.get_columns("tax_rates")]
        if "region" not in cols:
            op.add_column("tax_rates", sa.Column("region", sa.String(length=64), nullable=True))
        if "postal_code_pattern" not in cols:
            op.add_column("tax_rates", sa.Column("postal_code_pattern", sa.String(length=128), nullable=True))
        if "priority" not in cols:
            op.add_column("tax_rates", sa.Column("priority", sa.Integer(), nullable=False, server_default="0"))
        if "override" not in cols:
            op.add_column("tax_rates", sa.Column("override", sa.Boolean(), nullable=False, server_default=sa.text("0")))


def downgrade() -> None:
    conn = op.get_bind()
    insp = sa.inspect(conn)
    if "tax_rates" in insp.get_table_names():
        cols = [c["name"] for c in insp.get_columns("tax_rates")]
        if "region" in cols:
            op.drop_column("tax_rates", "region")
        if "postal_code_pattern" in cols:
            op.drop_column("tax_rates", "postal_code_pattern")
        if "priority" in cols:
            op.drop_column("tax_rates", "priority")
        if "override" in cols:
            op.drop_column("tax_rates", "override")
