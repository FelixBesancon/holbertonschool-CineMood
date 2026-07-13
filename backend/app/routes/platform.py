"""
Platform Routes

This module defines the FastAPI router for platform-related endpoints.
Platforms are read-only reference data — they are seeded once from TMDB's
watch-provider catalogue and never modified by users. This router exposes
them so the frontend can display the full list when a user configures their
streaming subscriptions on the profile page.

Routes:
    - GET /platforms: return all available streaming platforms
"""

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.platform import PlatformResponse
from app.services import user_service

router = APIRouter(prefix="/platforms", tags=["platforms"])


@router.get(
        "",
        response_model=list[PlatformResponse],
        status_code=status.HTTP_200_OK
        )
def get_platforms(db: Session = Depends(get_db)):
    """
    Return all available streaming platforms.

    No authentication required — platforms are public reference data.
    The frontend uses this list to populate the platform selector on the
    user profile page, where users choose which services they subscribe to.

    Returns:
        list[PlatformResponse]: All platforms ordered alphabetically, each
            with id, name, logo_url and is_free fields.
    """
    return user_service.get_all_platforms(db)
