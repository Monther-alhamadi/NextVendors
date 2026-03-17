"""Add vendor profile columns to suppliers table.

Revision ID: 20260317_vendor_profile_columns
Revises: 0006_vendor_plan_extended, 0007_merge_0005_0006, 20251214_extend_coupons_redemptions, 20251214_extend_tax_rules
Create Date: 2026-03-17

"""
from alembic import op
import sqlalchemy as sa

revision = '20260317_vendor_profile_columns'
down_revision = ('0006_vendor_plan_extended', '0007_merge_0005_0006', '20251214_extend_coupons_redemptions', '20251214_extend_tax_rules')
branch_labels = None
depends_on = None

def upgrade() -> None:
    # Add vendor profile columns that are referenced by the supplier_portal API
    op.add_column('suppliers', sa.Column('description', sa.Text(), nullable=True))
    op.add_column('suppliers', sa.Column('logo_url', sa.String(512), nullable=True))
    op.add_column('suppliers', sa.Column('verification_document_url', sa.String(512), nullable=True))
    op.add_column('suppliers', sa.Column('return_policy', sa.Text(), nullable=True))
    op.add_column('suppliers', sa.Column('shipping_policy', sa.Text(), nullable=True))

def downgrade() -> None:
    op.drop_column('suppliers', 'shipping_policy')
    op.drop_column('suppliers', 'return_policy')
    op.drop_column('suppliers', 'verification_document_url')
    op.drop_column('suppliers', 'logo_url')
    op.drop_column('suppliers', 'description')
