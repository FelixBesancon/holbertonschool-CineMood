"""
Viewing History Service

This module implements the business logic for viewing history operations
in the CinéMood application.

It orchestrates entry creation, history retrieval, and entry removal.
Input validation is handled upstream by Pydantic schemas, and data
persistence is delegated to the viewing history repository.

Functions:
    - create_entry: log a new film in the user's viewing history
    - get_history: retrieve the full viewing history of a user
    - remove_entry: remove a film from the user's viewing history
"""

from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.repositories import viewing_history_repository
from app.schemas.viewing_history import ViewingHistoryEntryCreate, ViewingHistoryEntryResponse
from app.models.viewing_history_entry import ViewingHistoryEntry
from app.models.user import User


def create_entry(
    db: Session, user: User, payload: ViewingHistoryEntryCreate
) -> ViewingHistoryEntryResponse:
    """
    Log a new film in the user's viewing history.

    Resolves tag IDs to Tag instances, constructs the ViewingHistoryEntry,
    and delegates persistence to the repository. SQLAlchemy manages the
    viewing_history_tags join table automatically on commit.

    Args:
        db (Session): SQLAlchemy database session, injected by FastAPI.
        user (User): The authenticated user, injected by get_current_user.
        payload (ViewingHistoryEntryCreate): Validated creation data
            containing tmdb_id, tag_ids, prestige_tier, and personal_note.

    Returns:
        ViewingHistoryEntryResponse: The created entry with all fields
            populated, including resolved tag objects.
    """
    tags = viewing_history_repository.get_tags_by_ids(db, payload.tag_ids)
    entry = ViewingHistoryEntry(
        user_id=user.id,
        tmdb_id=payload.tmdb_id,
        tags=tags,
        prestige_tier=payload.prestige_tier,
        personal_note=payload.personal_note
    )
    created = viewing_history_repository.create(db, entry)
    return ViewingHistoryEntryResponse.model_validate(created)


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
    return [ViewingHistoryEntryResponse.model_validate(entry) for entry in entries]


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
