"""create products, categories, product_images and product_categories

Revision ID: 0004_create_products_and_categories
Revises: 0003_create_refresh_token_audit
Create Date: 2025-12-12 00:30:00.000000
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "0004_create_products_and_categories"
down_revision = "0003_create_refresh_token_audit"
branch_labels = None
depends_on = None


def upgrade():
    # categories
    op.create_table(
        "categories",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(length=128), nullable=False, unique=True),
        sa.Column(
            "description", sa.String(length=255), nullable=True, server_default=""
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
    )

    # products
    op.create_table(
        "products",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(length=255), nullable=False, index=True),
        sa.Column("description", sa.String(length=1024), nullable=True),
        sa.Column("price", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("inventory", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("category", sa.String(length=128), nullable=True, index=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
    )

    # product_images (basic columns only; richer media fields added in a later migration)
    op.create_table(
        "product_images",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "product_id", sa.Integer(), sa.ForeignKey("products.id"), nullable=True
        ),
        sa.Column("url", sa.String(length=1024), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
    )

    # product_categories association table
    op.create_table(
        "product_categories",
        sa.Column("product_id", sa.Integer(), primary_key=True),
        sa.Column("category_id", sa.Integer(), primary_key=True),
    )


def downgrade():
    op.drop_table("product_categories")
    op.drop_table("product_images")
    op.drop_table("products")
    op.drop_table("categories")
