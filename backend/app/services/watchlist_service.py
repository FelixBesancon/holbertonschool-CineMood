"""
Watchlist Service

This module implements the business logic for watchlist operations
in the CinéMood application.

It orchestrates entry creation, watchlist retrieval, entry removal,
and the "mark as watched" transition that atomically moves a film
from the watchlist to the viewing history.

Functions:
    - create_entry: add a film to the user's watchlist
    - get_watchlist: retrieve the full watchlist of a user
    - remove_entry: remove a film from the user's watchlist
    - mark_as_watched: move a film from watchlist to viewing history
"""

from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.repositories import watchlist_repository, viewing_history_repository
from app.schemas.watchlist import (
    WatchlistEntryCreate, WatchlistEntryResponse
)
from app.schemas.viewing_history import (
    ViewingHistoryEntryCreate, ViewingHistoryEntryResponse
)
from app.models.watchlist_entry import WatchlistEntry
from app.models.viewing_history_entry import ViewingHistoryEntry
from app.models.user import User
from app.external import tmdb_client
from app.services._tmdb_metadata import extract_metadata


async def create_entry(
    db: Session, user: User, payload: WatchlistEntryCreate
) -> WatchlistEntryResponse:
    """
    Add a new film to the user's watchlist.

    Fetches the film title and poster from TMDB at save time so the
    watchlist can be displayed without additional API calls later.
    Delegates persistence to the repository.

    Args:
        db (Session): SQLAlchemy database session, injected by FastAPI.
        user (User): The authenticated user, injected by get_current_user.
        payload (WatchlistEntryCreate): Validated creation data
            containing the tmdb_id of the film to add.

    Returns:
        WatchlistEntryResponse: The created entry with all fields
            populated, including the cached title and poster_url.

    Raises:
        httpx.HTTPStatusError: If TMDB returns a non-2xx response.
        httpx.RequestError: If the TMDB request cannot be sent.
    """
    film_data = await tmdb_client.get_movie_details(payload.tmdb_id)
    meta = extract_metadata(film_data)

    entry = WatchlistEntry(
        user_id=user.id,
        tmdb_id=payload.tmdb_id,
        **meta,
    )
    created = watchlist_repository.create(db, entry)
    return WatchlistEntryResponse.model_validate(created)


def get_watchlist(
    db: Session, user: User
) -> list[WatchlistEntryResponse]:
    """
    Retrieve the full watchlist of the authenticated user.

    Args:
        db (Session): SQLAlchemy database session, injected by FastAPI.
        user (User): The authenticated user, injected by get_current_user.

    Returns:
        list[WatchlistEntryResponse]: All watchlist entries
            belonging to the user. Returns an empty list if none exist.
    """
    entries = watchlist_repository.get_by_user(db, user.id)
    return [WatchlistEntryResponse.model_validate(entry) for entry in entries]


def remove_entry(
    db: Session, user: User, tmdb_id: int
) -> None:
    """
    Remove a film from the user's watchlist.

    Delegates deletion to the repository. Raises 404 if the user has
    no entry for the given film, so the error propagates directly to
    the FastAPI route without any additional handling.

    Args:
        db (Session): SQLAlchemy database session, injected by FastAPI.
        user (User): The authenticated user, injected by get_current_user.
        tmdb_id (int): TMDB identifier of the film to remove.

    Raises:
        HTTPException 404: If the user has no watchlist entry for this film.
    """
    removed = watchlist_repository.remove(db, user.id, tmdb_id)

    if not removed:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No watchlist entry found for this film."
        )


async def mark_as_watched(
    db: Session, user: User, payload: ViewingHistoryEntryCreate
) -> ViewingHistoryEntryResponse:
    """
    Move a film from the user's watchlist to their viewing history.

    Atomically deletes the watchlist entry and creates the history entry
    in a single database transaction. If either operation fails, neither
    is committed — the user cannot lose a watchlist entry without it
    appearing in history.

    Title and poster are re-fetched from TMDB rather than copied from
    the watchlist entry, in case the data changed since the film was saved.

    Args:
        db (Session): SQLAlchemy database session, injected by FastAPI.
        user (User): The authenticated user, injected by get_current_user.
        payload (ViewingHistoryEntryCreate): Validated data containing
            tmdb_id, and optionally tag_ids, prestige_tier, personal_note.

    Returns:
        ViewingHistoryEntryResponse: The created history entry with all
            fields populated, including title, poster_url, and resolved tags.

    Raises:
        HTTPException 404: If the user has no watchlist entry for this film.
        httpx.HTTPStatusError: If TMDB returns a non-2xx response.
        httpx.RequestError: If the TMDB request cannot be sent.
    """
    watchlist_entry = watchlist_repository.get_by_user_and_tmdb(
        db, user.id, payload.tmdb_id
    )
    if not watchlist_entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No watchlist entry found for this film."
        )

    film_data = await tmdb_client.get_movie_details(payload.tmdb_id)
    meta = extract_metadata(film_data)

    tags = viewing_history_repository.get_tags_by_ids(db, payload.tag_ids)
    history_entry = ViewingHistoryEntry(
        user_id=user.id,
        tmdb_id=payload.tmdb_id,
        **meta,
        tags=tags,
        prestige_tier=payload.prestige_tier,
        personal_note=payload.personal_note
    )

    # Stage both operations on the session before committing so the
    # delete and insert are atomic — one commit, one rollback point.
    db.delete(watchlist_entry)
    db.add(history_entry)
    db.commit()
    db.refresh(history_entry)

    return ViewingHistoryEntryResponse.model_validate(history_entry)
