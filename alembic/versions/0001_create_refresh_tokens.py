"""create refresh tokens table

Revision ID: 0001_create_refresh_tokens
Revises: 
Create Date: 2025-11-19 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '0001_create_refresh_tokens'
down_revision = '0000_create_users'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'refresh_tokens',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('token', sa.String(length=512), nullable=False, unique=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('revoked', sa.Boolean(), nullable=False, server_default=sa.text('0')),
        sa.Column('expires_at', sa.DateTime(), nullable=False),
    )


def downgrade():
    op.drop_table('refresh_tokens')
