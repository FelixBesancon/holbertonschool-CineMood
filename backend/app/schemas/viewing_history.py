"""
Viewing History Schemas

This module defines the Pydantic schemas used for viewing history
operations in the CinéMood application.

Schemas handle data validation and shape — they are distinct from
SQLAlchemy models, which handle database persistence.

Schemas defined here:
    - TagResponse: shapes a tag returned in API responses
    - ViewingHistoryEntryCreate: validates incoming entry creation data
    - ViewingHistoryEntryUpdate: validates incoming entry update data
    - ViewingHistoryEntryResponse: shapes an entry returned in API responses
"""

from pydantic import BaseModel, ConfigDict, Field
from uuid import UUID
from datetime import datetime
from app.models.prestige_tier import PrestigeTier


class TagResponse(BaseModel):
    """
    Schema for outgoing tag data in API responses.

    Shapes the tag information embedded inside a ViewingHistoryEntryResponse.
    Configured with from_attributes=True to allow construction directly
    from a SQLAlchemy Tag model instance.

    Attributes:
        id (int): Tag's integer primary key.
        name (str): Display label. Example: "Hidden Gem".
        description (str): Short explanation shown in the UI.
    """
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: str


class ViewingHistoryEntryCreate(BaseModel):
    """
    Schema for incoming viewing history entry creation data.

    Validates the payload sent to POST /history.
    Only tmdb_id is required — tags, prestige tier, and personal note
    are all optional and can be added or updated later.

    Attributes:
        tmdb_id (int): TMDB identifier of the film being logged.
        tag_ids (list[int]): IDs of tags to attach to the entry.
            Defaults to an empty list (no tags).
        prestige_tier (PrestigeTier, optional): Rating assigned to the film.
        personal_note (str, optional): Free-text note from the user.
            Maximum 500 characters.
    """
    tmdb_id: int
    tag_ids: list[int] = []
    prestige_tier: PrestigeTier | None = None
    personal_note: str | None = Field(default=None, max_length=500)


class ViewingHistoryEntryUpdate(BaseModel):
    """
    Schema for PATCH /history/{tmdb_id}.

    All fields are optional. Provided values replace current ones;
    prestige_tier and personal_note accept null to clear them.
    tag_ids replaces the full tag list when provided.
    """
    tag_ids: list[int] | None = None
    prestige_tier: PrestigeTier | None = None
    personal_note: str | None = Field(default=None, max_length=500)


class ViewingHistoryEntryResponse(BaseModel):
    """
    Schema for outgoing viewing history entry data in API responses.

    Shapes the entry information returned after creation or retrieval.
    Tags are embedded as full TagResponse objects rather than raw IDs
    so the frontend can display them without a second request.

    Configured with from_attributes=True to allow construction directly
    from a SQLAlchemy ViewingHistoryEntry model instance.

    Attributes:
        id (UUID): Entry's unique identifier.
        created_at (datetime): Timestamp of entry creation.
        updated_at (datetime): Timestamp of entry's last modification.
        tmdb_id (int): TMDB identifier of the logged film.
        title (str, optional): Film title cached at log time.
        poster_url (str, optional): Full poster URL cached at log time.
        year (int, optional): Release year. None if TMDB did not provide it.
        director (str, optional): Director name(s). None if unavailable.
        synopsis (str, optional): Film overview from TMDB.
        genres (list[str], optional): Genre names from TMDB.
        runtime (int, optional): Duration in minutes from TMDB.
        tags (list[TagResponse]): Tags attached to this entry.
        prestige_tier (PrestigeTier, optional): Rating assigned to the film.
        personal_note (str, optional): Free-text note from the user.
    """
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_at: datetime
    updated_at: datetime
    tmdb_id: int
    title: str | None = None
    poster_url: str | None = None
    year: int | None = None
    director: str | None = None
    synopsis: str | None = None
    genres: list[str] | None = None
    runtime: int | None = None
    tags: list[TagResponse]
    prestige_tier: PrestigeTier | None = None
    personal_note: str | None = None
