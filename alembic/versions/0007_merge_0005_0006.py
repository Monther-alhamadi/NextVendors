"""merge product_variants and merge_heads

Revision ID: 0007_merge_0005_0006
Revises: 0005_add_product_variants_and_media_fields, 0006_merge_heads
Create Date: 2025-12-12 00:20:00.000000
"""

# revision identifiers, used by Alembic.
revision = "0007_merge_0005_0006"
down_revision = ("0005_add_product_variants_and_media_fields", "0006_merge_heads")
branch_labels = None
depends_on = None


def upgrade():
    # Merge migration - no schema changes
    pass


def downgrade():
    pass
