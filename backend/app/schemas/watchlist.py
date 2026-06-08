"""
Watchlist Schemas

This module defines the Pydantic schemas used for watchlist operations
in the CinéMood application.

Schemas handle data validation and shape — they are distinct from
SQLAlchemy models, which handle database persistence.

Schemas defined here:
    - WatchlistEntryCreate: validates the POST /watchlist request body
    - WatchlistEntryResponse: shapes the data returned by watchlist endpoints
"""

from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime


class WatchlistEntryCreate(BaseModel):
    """
    Schema for incoming watchlist entry creation data.

    Validates the payload sent to POST /watchlist.
    Only tmdb_id is required.

    Attributes:
        tmdb_id (int): TMDB identifier of the film being added.
    """
    tmdb_id: int


class WatchlistEntryResponse(BaseModel):
    """
    Schema for outgoing watchlist entry data in API responses.

    Serialises a WatchlistEntry ORM instance into the shape returned
    by GET /watchlist and POST /watchlist.

    Attributes:
        id (UUID): Entry's unique identifier.
        created_at (datetime): Timestamp of entry creation.
        updated_at (datetime): Timestamp of entry's last modification.
        tmdb_id (int): TMDB identifier of the saved film.
        title (str, optional): Film title cached at save time. Avoids a
            TMDB call when displaying the watchlist.
        poster_url (str, optional): Full poster URL cached at save time.
            None if TMDB had no poster for this film.
    """
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_at: datetime
    updated_at: datetime
    tmdb_id: int
    title: str | None = None
    poster_url: str | None = None
