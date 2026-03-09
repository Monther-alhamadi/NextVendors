"""create refresh token audit

Revision ID: 0003_create_refresh_token_audit
Revises: 0002_add_replaced_by_to_refresh_tokens
Create Date: 2025-11-19 00:20:00.000000
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '0003_create_refresh_token_audit'
down_revision = '0002_add_replaced_by_to_refresh_tokens'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'refresh_token_audit',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('token_id', sa.Integer(), nullable=True),
        sa.Column('event_type', sa.String(length=128), nullable=False),
        sa.Column('detail', sa.String(length=1024), nullable=True),
    )


def downgrade():
    op.drop_table('refresh_token_audit')
