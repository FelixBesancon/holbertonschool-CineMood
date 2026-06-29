"""
Users Routes

This module defines the FastAPI router for user profile endpoints.
All routes require authentication (JWT via the get_current_user dependency).

Routes:
    - GET   /users/me:           return the authenticated user's profile
    - PATCH /users/me:           partially update the user's profile fields
    - GET   /users/me/platforms: return the user's selected streaming platforms
    - PUT   /users/me/platforms: replace the user's streaming platform list
"""

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.services import user_service
from app.schemas.user import UserResponse, UserUpdate
from app.schemas.platform import PlatformResponse, PlatformListUpdate

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserResponse, status_code=status.HTTP_200_OK)
def get_user_profile(current_user: User = Depends(get_current_user)):
    """
    Return the authenticated user's full profile.

    The current user is loaded by the get_current_user dependency, including
    their selected platforms (eager-loaded via the User.platforms relationship).
    No extra database query is performed in this handler.

    Returns:
        UserResponse: The user's profile with id, names, email, age,
            and the list of selected streaming platforms.
    """
    return user_service.get_profile(current_user)


@router.patch("/me", response_model=UserResponse, status_code=status.HTTP_200_OK)
def update_user_profile(
    payload: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Partially update the authenticated user's profile.

    Only fields present in the request body are written to the database.
    Sending a field as null clears it (for nullable fields like age).
    Fields absent from the payload are left unchanged.

    Args:
        payload (UserUpdate): Partial update with any combination of
            first_name, last_name, username, age.

    Returns:
        UserResponse: The updated user profile.
    """
    return user_service.update_user(db, current_user, payload)


@router.get(
    "/me/platforms",
    response_model=list[PlatformResponse],
    status_code=status.HTTP_200_OK,
)
def get_user_platforms(current_user: User = Depends(get_current_user)):
    """
    Return the streaming platforms selected by the authenticated user.

    Platforms are already eager-loaded on the current user object.
    No extra database query is performed in this handler.

    Returns:
        list[PlatformResponse]: The user's selected platforms. Empty list
            if no platforms have been selected yet.
    """
    return user_service.get_user_platforms(current_user)


@router.put(
    "/me/platforms",
    response_model=list[PlatformResponse],
    status_code=status.HTTP_200_OK,
)
def update_user_platforms(
    payload: PlatformListUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Replace the authenticated user's streaming platform list.

    The provided list completely replaces the current selection — this is a
    PUT (full replacement), not a PATCH (partial update). Sending an empty
    list clears all platforms. Unknown platform IDs are silently ignored.

    Args:
        payload (PlatformListUpdate): List of TMDB watch-provider IDs to set.

    Returns:
        list[PlatformResponse]: The user's new platform list after update.
    """
    return user_service.update_user_platforms(db, current_user, payload.platform_ids)
