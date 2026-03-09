"""create product variation tables

Revision ID: 0005_create_product_variations
Revises: 0004_create_carts_table
Create Date: 2025-12-12 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "0005_create_product_variations"
down_revision = "0004_create_carts_table"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "product_variation_variables",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("product_id", sa.Integer(), nullable=False),
        sa.Column("identifier", sa.String(length=128), nullable=False),
        sa.Column("name", sa.String(length=128), nullable=True),
        sa.Column("ordering", sa.Integer(), nullable=False, server_default="0"),
        sa.UniqueConstraint(
            "product_id", "identifier", name="uq_variant_variable_product_identifier"
        ),
    )

    op.create_table(
        "product_variation_variable_values",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("variable_id", sa.Integer(), nullable=False),
        sa.Column("identifier", sa.String(length=128), nullable=False),
        sa.Column("value", sa.String(length=128), nullable=True),
        sa.Column("ordering", sa.Integer(), nullable=False, server_default="0"),
        sa.UniqueConstraint(
            "variable_id", "identifier", name="uq_variable_value_variable_identifier"
        ),
    )

    op.create_table(
        "product_variation_results",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("product_id", sa.Integer(), nullable=False),
        sa.Column("combination_hash", sa.String(length=40), nullable=False),
        sa.Column("result_product_id", sa.Integer(), nullable=False),
        sa.Column("status", sa.Integer(), nullable=False, server_default="1"),
        sa.UniqueConstraint(
            "product_id", "combination_hash", name="uq_product_combination_hash"
        ),
    )


def downgrade():
    op.drop_table("product_variation_results")
    op.drop_table("product_variation_variable_values")
    op.drop_table("product_variation_variables")
