"""create_watchlist_entries_table

Revision ID: a1b2c3d4e5f6
Revises: e5f8a2b3c491
Create Date: 2026-06-08

"""
from typing import Union
from alembic import op


revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = 'e5f8a2b3c491'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        CREATE TABLE watchlist_entries (
            id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            created_at  TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
            updated_at  TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
            user_id     UUID NOT NULL REFERENCES users(id),
            tmdb_id     INTEGER NOT NULL,
            title       TEXT,
            poster_url  TEXT,
            CONSTRAINT uq_watchlist_user_film UNIQUE (user_id, tmdb_id)
        )
    """)


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS watchlist_entries")
