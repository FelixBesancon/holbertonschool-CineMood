"""
Viewing History Routes

This module defines the FastAPI router for viewing history endpoints.
It handles HTTP concerns only — authentication, error mapping, and
response forwarding. All business logic is delegated to
viewing_history_service.

Routes:
    - GET    /history:             retrieve the current user's viewing history
    - POST   /history:             log a film in the current user's history
    - PATCH  /history/{tmdb_id}:   update tags/prestige/note on an existing entry
    - DELETE /history/{tmdb_id}:   remove a film from the current user's history
"""

from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
import httpx

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.services import viewing_history_service
from app.schemas.viewing_history import (
    ViewingHistoryEntryCreate, ViewingHistoryEntryUpdate, ViewingHistoryEntryResponse
)


router = APIRouter(prefix="/history", tags=["history"])


@router.get("", response_model=list[ViewingHistoryEntryResponse])
def get_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieve the authenticated user's full viewing history.

    Returns:
        list[ViewingHistoryEntryResponse]: All entries in the user's
            history. Returns an empty list if none exist.

    Raises:
        HTTPException 401: If the request is not authenticated.
    """
    return viewing_history_service.get_history(db, current_user)


@router.post("", response_model=ViewingHistoryEntryResponse, status_code=status.HTTP_201_CREATED)
async def log_film(
    payload: ViewingHistoryEntryCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Log a film in the authenticated user's viewing history.

    Fetches title and poster from TMDB at log time so the history list
    can be displayed without additional API calls.

    Args:
        payload (ViewingHistoryEntryCreate): tmdb_id, optional tag_ids,
            optional prestige_tier, and optional personal_note.

    Returns:
        ViewingHistoryEntryResponse: The created entry with all fields
            populated, including title, poster_url, and resolved tags.

    Raises:
        HTTPException 401: If the request is not authenticated.
        HTTPException 409: If the film is already in the user's history.
        HTTPException 422: If the payload fails validation.
        HTTPException 404: If TMDB does not recognise the tmdb_id.
        HTTPException 503: If TMDB is unreachable.
    """
    try:
        return await viewing_history_service.create_entry(db, current_user, payload)
    except IntegrityError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Film {payload.tmdb_id} is already in your history."
        )
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 404:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Film {payload.tmdb_id} not found."
            )
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Film service temporarily unavailable."
        )
    except httpx.RequestError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Could not reach the film database. Please try again later."
        )


@router.patch("/{tmdb_id}", response_model=ViewingHistoryEntryResponse)
def update_film(
    tmdb_id: int,
    payload: ViewingHistoryEntryUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update tags, prestige tier, and/or personal note on a history entry.

    Args:
        tmdb_id (int): TMDB identifier of the film to update.
        payload (ViewingHistoryEntryUpdate): Fields to update.

    Returns:
        ViewingHistoryEntryResponse: The updated entry.

    Raises:
        HTTPException 401: If the request is not authenticated.
        HTTPException 404: If the user has no history entry for this film.
    """
    return viewing_history_service.update_entry(db, current_user, tmdb_id, payload)


@router.delete("/{tmdb_id}", status_code=status.HTTP_200_OK)
def remove_film(
    tmdb_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Remove a film from the authenticated user's viewing history.

    Args:
        tmdb_id (int): TMDB identifier of the film to remove.

    Returns:
        dict: Confirmation message.

    Raises:
        HTTPException 401: If the request is not authenticated.
        HTTPException 404: If the user has no history entry for this film.
    """
    viewing_history_service.remove_entry(db, current_user, tmdb_id)
    return {"detail": "Film removed from history."}
