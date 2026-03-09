"""Extend coupons with start_at/per_user_limit/stackable and add coupon_redemptions

Revision ID: 20251214_extend_coupons_redemptions
Revises: 20251213_add_pricing_tax_and_coupons
Create Date: 2025-12-14 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "20251214_extend_coupons_redemptions"
down_revision = "20251213_add_pricing_tax_and_coupons"
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    insp = sa.inspect(conn)
    if "coupons" in insp.get_table_names():
        cols = [c["name"] for c in insp.get_columns("coupons")]
        if "start_at" not in cols:
            op.add_column(
                "coupons", sa.Column("start_at", sa.DateTime(), nullable=True)
            )
        if "per_user_limit" not in cols:
            op.add_column(
                "coupons", sa.Column("per_user_limit", sa.Integer(), nullable=True)
            )
        if "stackable" not in cols:
            op.add_column(
                "coupons", sa.Column("stackable", sa.Boolean(), nullable=False, server_default=sa.text("0"))
            )

    # create coupon_redemptions table
    if "coupon_redemptions" not in insp.get_table_names():
        op.create_table(
            "coupon_redemptions",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("coupon_id", sa.Integer(), sa.ForeignKey("coupons.id"), nullable=False),
            sa.Column("user_id", sa.Integer(), nullable=False),
            sa.Column("used_count", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        )


def downgrade() -> None:
    conn = op.get_bind()
    insp = sa.inspect(conn)
    if "coupon_redemptions" in insp.get_table_names():
        op.drop_table("coupon_redemptions")
    if "coupons" in insp.get_table_names():
        cols = [c["name"] for c in insp.get_columns("coupons")]
        if "start_at" in cols:
            op.drop_column("coupons", "start_at")
        if "per_user_limit" in cols:
            op.drop_column("coupons", "per_user_limit")
        if "stackable" in cols:
            op.drop_column("coupons", "stackable")
