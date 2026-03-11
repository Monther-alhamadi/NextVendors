"""add product_variants table and product_images fields

Revision ID: 0005_add_product_variants_and_media_fields
Revises: 0004_create_carts_table
Create Date: 2025-12-12 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "0005_add_product_variants_and_media_fields"
down_revision = "0004_create_carts_table"
branch_labels = None
depends_on = None


def upgrade():
    # Create product_variants table
    op.create_table(
        "product_variants",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "product_id",
            sa.Integer(),
            sa.ForeignKey("products.id"),
            nullable=False,
            index=False,
        ),
        sa.Column("sku", sa.String(length=64), nullable=True, index=False),
        sa.Column("name", sa.String(length=255), nullable=True),
        sa.Column("price", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("inventory", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("active", sa.Boolean(), nullable=False, server_default=sa.text("1")),
    )

    # Add optional media metadata fields to product_images only if they don't exist
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    cols = []
    if "product_images" in inspector.get_table_names():
        cols = [c["name"] for c in inspector.get_columns("product_images")]
    if "kind" not in cols:
        op.add_column(
            "product_images",
            sa.Column(
                "kind", sa.String(length=32), nullable=False, server_default="image"
            ),
        )
    if "position" not in cols:
        op.add_column(
            "product_images",
            sa.Column("position", sa.Integer(), nullable=False, server_default="0"),
        )
    if "public" not in cols:
        op.add_column(
            "product_images",
            sa.Column(
                "public", sa.Boolean(), nullable=False, server_default=sa.text("1")
            ),
        )


def downgrade():
    # Only attempt to drop columns if they exist
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    cols = []
    if "product_images" in inspector.get_table_names():
        cols = [c["name"] for c in inspector.get_columns("product_images")]
    if "public" in cols:
        op.drop_column("product_images", "public")
    if "position" in cols:
        op.drop_column("product_images", "position")
    if "kind" in cols:
        op.drop_column("product_images", "kind")
    op.drop_table("product_variants")
