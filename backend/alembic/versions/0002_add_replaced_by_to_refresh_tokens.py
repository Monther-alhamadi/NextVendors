"""add replaced_by_id to refresh_tokens

Revision ID: 0002_add_replaced_by_to_refresh_tokens
Revises: 0001_create_refresh_tokens
Create Date: 2025-11-19 00:10:00.000000
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '0002_add_replaced_by_to_refresh_tokens'
down_revision = '0001_create_refresh_tokens'
branch_labels = None
depends_on = None


def upgrade():
    # Use batch_alter_table to safely add a column and FK for SQLite and other DBs
    with op.batch_alter_table('refresh_tokens') as batch_op:
        batch_op.add_column(sa.Column('replaced_by_id', sa.Integer(), nullable=True))
        batch_op.create_foreign_key(
            'fk_refresh_replaced_by', 'refresh_tokens', ['replaced_by_id'], ['id']
        )


def downgrade():
    with op.batch_alter_table('refresh_tokens') as batch_op:
        batch_op.drop_constraint('fk_refresh_replaced_by', type_='foreignkey')
        batch_op.drop_column('replaced_by_id')
