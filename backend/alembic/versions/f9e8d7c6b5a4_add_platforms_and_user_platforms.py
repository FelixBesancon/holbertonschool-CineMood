"""add platforms table and user_platforms association

Revision ID: f9e8d7c6b5a4
Revises: c4d5e6f7a8b9
Create Date: 2026-06-17 00:00:00.000000

"""
from typing import Union

from alembic import op


revision: str = 'f9e8d7c6b5a4'
down_revision: Union[str, None] = 'c4d5e6f7a8b9'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Create the platforms catalogue table and the user↔platform join table.

    ``platforms.id`` intentionally stores the TMDB watch-provider ID so the
    film service can cross-reference streaming availability data from TMDB
    directly against the seeded rows without any extra mapping step.
    """
    op.execute("""
        CREATE TABLE platforms (
            id          INTEGER PRIMARY KEY,
            name        VARCHAR(100) NOT NULL UNIQUE,
            logo_path   VARCHAR(255) NOT NULL,
            is_free     BOOLEAN NOT NULL DEFAULT FALSE
        )
    """)
    op.execute("""
        CREATE TABLE user_platforms (
            user_id     UUID    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            platform_id INTEGER NOT NULL REFERENCES platforms(id) ON DELETE CASCADE,
            PRIMARY KEY (user_id, platform_id)
        )
    """)


def downgrade() -> None:
    """Drop the user↔platform join table then the platforms catalogue."""
    op.execute("DROP TABLE IF EXISTS user_platforms")
    op.execute("DROP TABLE IF EXISTS platforms")
