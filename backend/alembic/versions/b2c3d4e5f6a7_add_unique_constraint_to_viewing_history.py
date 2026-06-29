"""add_unique_constraint_to_viewing_history

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-06-08

"""
from typing import Union
from alembic import op


revision: str = 'b2c3d4e5f6a7'
down_revision: Union[str, None] = 'a1b2c3d4e5f6'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        ALTER TABLE viewing_history_entries
        ADD CONSTRAINT uq_history_user_film UNIQUE (user_id, tmdb_id)
    """)


def downgrade() -> None:
    op.execute("""
        ALTER TABLE viewing_history_entries
        DROP CONSTRAINT IF EXISTS uq_history_user_film
    """)
