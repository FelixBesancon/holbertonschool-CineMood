"""add year, director, synopsis, genres, runtime to watchlist and history entries

Revision ID: c4d5e6f7a8b9
Revises: b2c3d4e5f6a7
Create Date: 2026-06-15 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'c4d5e6f7a8b9'
down_revision: Union[str, None] = 'b2c3d4e5f6a7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add enriched metadata columns to both entry tables.

    All columns are nullable so existing rows remain valid after migration.
    Use POST /library/refresh to back-fill metadata for pre-existing entries.
    """
    for table in ("watchlist_entries", "viewing_history_entries"):
        op.add_column(table, sa.Column("year", sa.Integer(), nullable=True))
        op.add_column(table, sa.Column("director", sa.String(), nullable=True))
        op.add_column(table, sa.Column("synopsis", sa.Text(), nullable=True))
        op.add_column(table, sa.Column("genres", sa.JSON(), nullable=True))
        op.add_column(table, sa.Column("runtime", sa.Integer(), nullable=True))


def downgrade() -> None:
    """Drop the enriched metadata columns from both entry tables."""
    for table in ("watchlist_entries", "viewing_history_entries"):
        op.drop_column(table, "runtime")
        op.drop_column(table, "genres")
        op.drop_column(table, "synopsis")
        op.drop_column(table, "director")
        op.drop_column(table, "year")
