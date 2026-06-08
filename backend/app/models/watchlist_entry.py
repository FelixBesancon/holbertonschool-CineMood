"""
Watchlist Entry

This module defines the WatchlistEntry SQLAlchemy model, representing
a film saved by a user to their personal watchlist (films they intend
to watch but have not yet seen).

A (user_id, tmdb_id) pair is unique: the same film cannot appear twice
in a user's watchlist.
"""

from app.models.base_model import BaseModel
from sqlalchemy import ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from uuid import UUID


class WatchlistEntry(BaseModel):
    """
    SQLAlchemy model representing a film saved to a user's watchlist.

    Inherits from BaseModel, which provides:
        - id (UUID primary key)
        - created_at (set at insertion)
        - updated_at (refreshed on every update)

    Attributes:
        user_id (UUID): Foreign key to the user who saved this entry.
        tmdb_id (int): TMDB identifier of the film. Not a foreign key —
            film metadata is fetched on demand from TMDB, never stored.
        title (str, optional): Film title cached at save time to avoid
            a TMDB call when displaying the watchlist.
        poster_url (str, optional): Full poster URL cached at save time
            for the same reason. None if TMDB had no poster.
    """

    __tablename__ = "watchlist_entries"
    __table_args__ = (
        UniqueConstraint("user_id", "tmdb_id", name="uq_watchlist_user_film"),
    )

    user_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id"),
        nullable=False
    )
    tmdb_id: Mapped[int] = mapped_column(
        nullable=False
    )
    title: Mapped[str | None] = mapped_column(
        nullable=True
    )
    poster_url: Mapped[str | None] = mapped_column(
        nullable=True
    )
