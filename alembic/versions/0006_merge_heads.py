"""merge heads

Revision ID: 0006_merge_heads
Revises: 0004_add_fks_to_product_categories, 0004_create_carts_table
Create Date: 2025-12-12 00:10:00.000000
"""

# revision identifiers, used by Alembic.
revision = "0006_merge_heads"
down_revision = ("0004_add_fks_to_product_categories", "0004_create_carts_table")
branch_labels = None
depends_on = None


def upgrade():
    # This is an empty merge migration to combine parallel heads into a single history.
    pass


def downgrade():
    pass
