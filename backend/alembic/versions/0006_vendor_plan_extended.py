"""add vendor plan extended fields and analytics support

Revision ID: 0006_vendor_plan_extended
Revises: 0005_create_product_variations
Create Date: 2026-03-09 16:00:00.000000
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "0006_vendor_plan_extended"
down_revision = "0005_create_product_variations"
branch_labels = None
depends_on = None


def upgrade():
    # Add missing columns to vendor_plans table
    with op.batch_alter_table("vendor_plans", schema=None) as batch_op:
        batch_op.add_column(
            sa.Column("max_coupons", sa.Integer(), nullable=False, server_default="0")
        )
        batch_op.add_column(
            sa.Column(
                "allow_whatsapp_checkout",
                sa.Boolean(),
                nullable=False,
                server_default="0",
            )
        )

    # Ensure plan_features table exists (may have been created by create_all)
    op.create_table(
        "plan_features",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("plan_id", sa.Integer(), sa.ForeignKey("vendor_plans.id"), nullable=False, index=True),
        sa.Column("feature_name", sa.String(length=100), nullable=False),
        sa.Column("is_enabled", sa.Boolean(), nullable=False, server_default="1"),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now()),
        if_not_exists=True,
    )


def downgrade():
    op.drop_table("plan_features")
    with op.batch_alter_table("vendor_plans", schema=None) as batch_op:
        batch_op.drop_column("allow_whatsapp_checkout")
        batch_op.drop_column("max_coupons")
