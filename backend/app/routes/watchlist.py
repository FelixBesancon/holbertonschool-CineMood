"""
Watchlist Routes

This module defines the FastAPI router for watchlist endpoints.
It handles HTTP concerns only — authentication, error mapping, and
response forwarding. All business logic is delegated to
watchlist_service.

Routes:
    - GET    /watchlist:                    retrieve the current user's watchlist
    - POST   /watchlist:                    add a film to the current user's watchlist
    - DELETE /watchlist/{tmdb_id}:          remove a film from the current user's watchlist
    - POST   /watchlist/{tmdb_id}/watched:  move a film from watchlist to viewing history
"""

from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
import httpx

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.services import watchlist_service
from app.schemas.watchlist import (
    WatchlistEntryCreate, WatchlistEntryResponse
)
from app.schemas.viewing_history import (
    ViewingHistoryEntryCreate, ViewingHistoryEntryResponse
)


router = APIRouter(prefix="/watchlist", tags=["watchlist"])


@router.get("", response_model=list[WatchlistEntryResponse])
def get_watchlist(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieve the authenticated user's full watchlist.

    Returns:
        list[WatchlistEntryResponse]: All entries in the user's
            watchlist. Returns an empty list if none exist.

    Raises:
        HTTPException 401: If the request is not authenticated.
    """
    return watchlist_service.get_watchlist(db, current_user)


@router.post("", response_model=WatchlistEntryResponse, status_code=status.HTTP_201_CREATED)
async def add_film(
    payload: WatchlistEntryCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Add a film in the authenticated user's watchlist.

    Fetches title and poster from TMDB at log time so the watchlist
    can be displayed without additional API calls.

    Args:
        payload (WatchlistEntryCreate): tmdb_id.

    Returns:
        WatchlistEntryResponse: The created entry with all fields
            populated, including title and poster_url.

    Raises:
        HTTPException 401: If the request is not authenticated.
        HTTPException 409: If the film is already in the user's watchlist.
        HTTPException 422: If the payload fails validation.
        HTTPException 404: If TMDB does not recognise the tmdb_id.
        HTTPException 503: If TMDB is unreachable.
    """
    try:
        return await watchlist_service.create_entry(db, current_user, payload)
    except IntegrityError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Film {payload.tmdb_id} is already in your watchlist."
        )
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 404:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Film {payload.tmdb_id} not found."
            )
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Watchlist service temporarily unavailable."
        )
    except httpx.RequestError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Could not reach the film database. Please try again later."
        )


@router.delete("/{tmdb_id}", status_code=status.HTTP_200_OK)
def remove_film(
    tmdb_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Remove a film from the authenticated user's watchlist.

    Args:
        tmdb_id (int): TMDB identifier of the film to remove.

    Returns:
        dict: Confirmation message.

    Raises:
        HTTPException 401: If the request is not authenticated.
        HTTPException 404: If the user has no watchlist entry for this film.
    """
    watchlist_service.remove_entry(db, current_user, tmdb_id)
    return {"detail": "Film removed from watchlist."}


@router.post("/{tmdb_id}/watched", response_model=ViewingHistoryEntryResponse, status_code=status.HTTP_201_CREATED)
async def mark_as_watched(
    tmdb_id: int,
    payload: ViewingHistoryEntryCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Move a film from the authenticated user's watchlist to their viewing history.

    The tmdb_id in the URL takes precedence over any tmdb_id in the body.
    The body carries the optional viewing history fields (prestige_tier,
    personal_note, tag_ids) the user can fill in at the moment of marking
    the film as watched.

    Args:
        tmdb_id (int): TMDB identifier of the film to mark as watched.
        payload (ViewingHistoryEntryCreate): Optional history metadata —
            prestige_tier, personal_note, tag_ids.

    Returns:
        ViewingHistoryEntryResponse: The created history entry with all
            fields populated.

    Raises:
        HTTPException 401: If the request is not authenticated.
        HTTPException 404: If the user has no watchlist entry for this film.
        HTTPException 409: If the film is already in the user's history.
        HTTPException 503: If TMDB is unreachable.
    """
    payload.tmdb_id = tmdb_id
    try:
        return await watchlist_service.mark_as_watched(db, current_user, payload)
    except IntegrityError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Film {tmdb_id} is already in your history."
        )
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 404:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Film {tmdb_id} not found."
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
