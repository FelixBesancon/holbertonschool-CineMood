"""create viewing history tables

Revision ID: d8e7c3a1f052
Revises: 58a93fa0f7fc
Create Date: 2026-06-03 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd8e7c3a1f052'
down_revision: Union[str, None] = '58a93fa0f7fc'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# PostgreSQL native ENUM type for prestige_tier.
# Values match PrestigeTier enum values (not names) — see models/prestige_tier.py.
prestige_tier_enum = sa.Enum(
    'Platinum', 'Gold', 'Silver', 'Bronze', 'Coal', 'Trash',
    name='prestigetier'
)


def upgrade() -> None:
    """Upgrade schema."""
    prestige_tier_enum.create(op.get_bind(), checkfirst=True)

    op.create_table(
        'viewing_history_entries',
        sa.Column('id', sa.Uuid(), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('user_id', sa.Uuid(), nullable=False),
        sa.Column('tmdb_id', sa.Integer(), nullable=False),
        sa.Column('prestige_tier', prestige_tier_enum, nullable=True),
        sa.Column('personal_note', sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )

    op.create_table(
        'viewing_history_tags',
        sa.Column('viewing_history_entry_id', sa.Uuid(), nullable=False),
        sa.Column('tag_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['viewing_history_entry_id'], ['viewing_history_entries.id']),
        sa.ForeignKeyConstraint(['tag_id'], ['tags.id']),
        sa.PrimaryKeyConstraint('viewing_history_entry_id', 'tag_id'),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('viewing_history_tags')
    op.drop_table('viewing_history_entries')
    prestige_tier_enum.drop(op.get_bind(), checkfirst=True)
