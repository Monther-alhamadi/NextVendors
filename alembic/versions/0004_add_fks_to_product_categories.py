"""add foreign key constraints to product_categories

Revision ID: 0004_add_fks_to_product_categories
Revises: 0003_create_refresh_token_audit
Create Date: 2025-12-04 00:00:00.000000
"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "0004_add_fks_to_product_categories"
down_revision = "0004_create_products_and_categories"
branch_labels = None
depends_on = None


def upgrade():
    # Create foreign key constraints on product_categories in a batch operation for SQLite compatibility.
    with op.batch_alter_table('product_categories') as batch_op:
        batch_op.create_foreign_key(
            'fk_product_categories_product', 'products', ['product_id'], ['id']
        )
        batch_op.create_foreign_key(
            'fk_product_categories_category', 'categories', ['category_id'], ['id']
        )


def downgrade():
    with op.batch_alter_table('product_categories') as batch_op:
        batch_op.drop_constraint('fk_product_categories_product', type_='foreignkey')
        batch_op.drop_constraint('fk_product_categories_category', type_='foreignkey')
