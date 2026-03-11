"""merge multiple heads

Revision ID: 4c36a3a2f097
Revises: 0007_merge_0005_0006, 20251214_extend_coupons_redemptions, 20251214_extend_tax_rules
Create Date: 2026-03-11 07:03:52.734071

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '4c36a3a2f097'
down_revision = ('0007_merge_0005_0006', '20251214_extend_coupons_redemptions', '20251214_extend_tax_rules')
branch_labels = None
depends_on = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
