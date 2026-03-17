"""Create vendor_followers table

Revision ID: 20260317_followers
Revises: 20260317_vendor_profile_columns
Create Date: 2026-03-17

"""
from alembic import op
import sqlalchemy as sa

revision = '20260317_followers'
down_revision = '20260317_vendor_profile_columns'
branch_labels = None
depends_on = None

def upgrade() -> None:
    op.create_table(
        'vendor_followers',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('supplier_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['supplier_id'], ['suppliers.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_vendor_followers_id'), 'vendor_followers', ['id'], unique=False)
    op.create_index(op.f('ix_vendor_followers_supplier_id'), 'vendor_followers', ['supplier_id'], unique=False)
    op.create_index(op.f('ix_vendor_followers_user_id'), 'vendor_followers', ['user_id'], unique=False)

def downgrade() -> None:
    op.drop_index(op.f('ix_vendor_followers_user_id'), table_name='vendor_followers')
    op.drop_index(op.f('ix_vendor_followers_supplier_id'), table_name='vendor_followers')
    op.drop_index(op.f('ix_vendor_followers_id'), table_name='vendor_followers')
    op.drop_table('vendor_followers')
