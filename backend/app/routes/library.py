"""
Library Routes

Cross-domain endpoints that operate on both watchlist and viewing history.

Routes:
    - POST /library/refresh: re-sync all cached TMDB metadata for the current user
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
import httpx

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.services import library_service

router = APIRouter(prefix="/library", tags=["library"])


@router.post("/refresh")
async def refresh_library(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Re-fetch TMDB metadata for all watchlist and history entries of the user.

    Useful after the initial data migration or when metadata (poster, title,
    director) may have drifted from what is stored in the database.
    Skips entries whose tmdb_id TMDB no longer recognises.

    Returns:
        dict: Number of entries refreshed and skipped.

    Raises:
        HTTPException 401: If the request is not authenticated.
    """
    return await library_service.refresh_library(db, current_user)
