"""
Viewing History Service

This module implements the business logic for viewing history operations
in the CinéMood application.

It orchestrates entry creation, history retrieval, and entry removal.
Input validation is handled upstream by Pydantic schemas, and data
persistence is delegated to the viewing history repository.

Functions:
    - get_all_tags: return all available tags
    - create_entry: log a new film in the user's viewing history
    - update_entry: update tags/prestige/note on an existing entry
    - get_history: retrieve the full viewing history of a user
    - remove_entry: remove a film from the user's viewing history
"""

from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.repositories import viewing_history_repository, watchlist_repository
from app.schemas.viewing_history import (
    TagResponse, ViewingHistoryEntryCreate, ViewingHistoryEntryUpdate,
    ViewingHistoryEntryResponse
)
from app.models.viewing_history_entry import ViewingHistoryEntry
from app.models.user import User
from app.external import tmdb_client
from app.services._tmdb_metadata import extract_metadata


def get_all_tags(db: Session) -> list[TagResponse]:
    """
    Return all available tags as TagResponse objects.

    Used by GET /tags so the frontend can display the full list of
    mood/quality labels before the user creates a viewing history entry.

    Args:
        db (Session): SQLAlchemy database session, injected by FastAPI.

    Returns:
        list[TagResponse]: All tags ordered by id.
    """
    tags = viewing_history_repository.get_all_tags(db)
    return [TagResponse.model_validate(tag) for tag in tags]


async def create_entry(
    db: Session, user: User, payload: ViewingHistoryEntryCreate
) -> ViewingHistoryEntryResponse:
    """
    Log a new film in the user's viewing history.

    Fetches the film title and poster from TMDB at log time so the
    history list can be displayed without additional API calls later.
    Resolves tag IDs to Tag instances and delegates persistence to
    the repository.

    Args:
        db (Session): SQLAlchemy database session, injected by FastAPI.
        user (User): The authenticated user, injected by get_current_user.
        payload (ViewingHistoryEntryCreate): Validated creation data
            containing tmdb_id, tag_ids, prestige_tier, and personal_note.

    Returns:
        ViewingHistoryEntryResponse: The created entry with all fields
            populated, including title, poster_url, and resolved tags.

    Raises:
        httpx.HTTPStatusError: If TMDB returns a non-2xx response.
        httpx.RequestError: If the TMDB request cannot be sent.
    """
    film_data = await tmdb_client.get_movie_details(payload.tmdb_id)
    meta = extract_metadata(film_data)

    tags = viewing_history_repository.get_tags_by_ids(db, payload.tag_ids)
    entry = ViewingHistoryEntry(
        user_id=user.id,
        tmdb_id=payload.tmdb_id,
        **meta,
        tags=tags,
        prestige_tier=payload.prestige_tier,
        personal_note=payload.personal_note
    )
    created = viewing_history_repository.create(db, entry)

    # If the film was in the watchlist, remove it — it's now in history.
    watchlist_entry = watchlist_repository.get_by_user_and_tmdb(
        db, user.id, payload.tmdb_id
    )
    if watchlist_entry:
        db.delete(watchlist_entry)
        db.commit()

    return ViewingHistoryEntryResponse.model_validate(created)


def update_entry(
    db: Session, user: User, tmdb_id: int, payload: ViewingHistoryEntryUpdate
) -> ViewingHistoryEntryResponse:
    """
    Update an existing viewing history entry (tags, prestige tier, note).

    Replaces all provided fields. Passing null for prestige_tier or
    personal_note clears those fields. tag_ids replaces the full list.

    Args:
        db (Session): SQLAlchemy database session.
        user (User): The authenticated user.
        tmdb_id (int): TMDB identifier of the film to update.
        payload (ViewingHistoryEntryUpdate): Fields to update.

    Returns:
        ViewingHistoryEntryResponse: The updated entry.

    Raises:
        HTTPException 404: If the user has no history entry for this film.
    """
    entry = viewing_history_repository.get_by_user_and_tmdb(
        db, user.id, tmdb_id
    )
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No history entry found for this film."
        )

    if payload.tag_ids is not None:
        entry.tags = viewing_history_repository.get_tags_by_ids(
            db, payload.tag_ids
        )

    if "prestige_tier" in payload.model_fields_set:
        entry.prestige_tier = payload.prestige_tier
    if "personal_note" in payload.model_fields_set:
        entry.personal_note = payload.personal_note

    db.commit()
    db.refresh(entry)
    return ViewingHistoryEntryResponse.model_validate(entry)


def get_history(
    db: Session, user: User
) -> list[ViewingHistoryEntryResponse]:
    """
    Retrieve the full viewing history of the authenticated user.

    Args:
        db (Session): SQLAlchemy database session, injected by FastAPI.
        user (User): The authenticated user, injected by get_current_user.

    Returns:
        list[ViewingHistoryEntryResponse]: All viewing history entries
            belonging to the user. Returns an empty list if none exist.
    """
    entries = viewing_history_repository.get_by_user(db, user.id)
    return [
        ViewingHistoryEntryResponse.model_validate(entry)
        for entry in entries
    ]


def remove_entry(
    db: Session, user: User, tmdb_id: int
) -> None:
    """
    Remove a film from the user's viewing history.

    Delegates deletion to the repository. Raises 404 if the user has
    no entry for the given film, so the error propagates directly to
    the FastAPI route without any additional handling.

    Args:
        db (Session): SQLAlchemy database session, injected by FastAPI.
        user (User): The authenticated user, injected by get_current_user.
        tmdb_id (int): TMDB identifier of the film to remove.

    Raises:
        HTTPException 404: If the user has no history entry for this film.
    """
    removed = viewing_history_repository.remove(db, user.id, tmdb_id)

    if not removed:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No history entry found for this film."
        )
