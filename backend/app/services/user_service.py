"""
User Service

This module provides business-logic functions for user and platform operations.
It acts as the intermediary between the route handlers and the repository layer,
converting raw ORM objects into validated Pydantic response schemas.

All functions receive a SQLAlchemy Session injected by FastAPI's get_db()
dependency (where needed) and delegate database access to user_repository.

Functions:
    - get_all_platforms:      return all seeded platforms as PlatformResponse
    - get_profile:            serialize the current user into UserResponse
    - update_user:            apply a partial PATCH to the user's profile
    - get_user_platforms:     return the user's selected platforms
    - update_user_platforms:  replace the user's platform list
"""

from sqlalchemy.orm import Session
from app.models.user import User
from app.repositories import user_repository
from app.schemas.platform import PlatformResponse
from app.schemas.user import UserResponse, UserUpdate
from app.services._tmdb_metadata import LOGO_BASE_URL


def get_all_platforms(db: Session) -> list[PlatformResponse]:
    """
    Return all streaming platforms available in CinéMood.

    Retrieves the full platform catalogue from the database and serializes
    each row into a PlatformResponse schema. logo_url is built here by
    prepending LOGO_BASE_URL to the logo_path stored in the database.

    Args:
        db (Session): SQLAlchemy database session.

    Returns:
        list[PlatformResponse]: All platforms ordered alphabetically, each
            with id, name, logo_url (full CDN URL) and is_free fields.
    """
    platforms = user_repository.get_all_platforms(db)
    return [
        PlatformResponse.model_validate({
            "id": p.id,
            "name": p.name,
            "logo_url": f"{LOGO_BASE_URL}{p.logo_path}",
            "is_free": p.is_free,
        })
        for p in platforms
    ]


def get_profile(user: User) -> UserResponse:
    """
    Serialize the authenticated user's profile into a UserResponse.

    The user object is already loaded by the get_current_user dependency,
    including their platforms (lazy="joined"). No extra DB query is needed.

    Args:
        user (User): The authenticated SQLAlchemy User instance.

    Returns:
        UserResponse: The user's full profile including platforms.
    """
    return UserResponse.model_validate(user)


def update_user(db: Session, user: User, payload: UserUpdate) -> UserResponse:
    """
    Apply a partial update to the authenticated user's profile.

    Only fields explicitly provided in the request body (tracked via
    model_fields_set) are written to the database. Absent fields leave
    the corresponding column unchanged. Sending null for age clears it.

    Args:
        db (Session): SQLAlchemy database session.
        user (User): The authenticated SQLAlchemy User instance to update.
        payload (UserUpdate): Partial update data. Only set fields are applied.

    Returns:
        UserResponse: The updated user profile.
    """
    if "first_name" in payload.model_fields_set:
        user.first_name = payload.first_name
    if "last_name" in payload.model_fields_set:
        user.last_name = payload.last_name
    if "username" in payload.model_fields_set:
        user.username = payload.username
    if "age" in payload.model_fields_set:
        user.age = payload.age
    db.commit()
    db.refresh(user)
    return UserResponse.model_validate(user)


def get_user_platforms(user: User) -> list[PlatformResponse]:
    """
    Return the streaming platforms selected by the authenticated user.

    Platforms are already loaded on the user object (lazy="joined"),
    so no extra DB query is needed. The Platform.logo_url property
    builds the full CDN URL from the stored logo_path.

    Args:
        user (User): The authenticated SQLAlchemy User instance.

    Returns:
        list[PlatformResponse]: The user's selected platforms.
    """
    return [PlatformResponse.model_validate(p) for p in user.platforms]


def update_user_platforms(
    db: Session, user: User, platform_ids: list[int]
) -> list[PlatformResponse]:
    """
    Replace the authenticated user's platform list.

    Fetches Platform rows for the given IDs and assigns them to the user,
    overwriting any previous selection. An empty list clears all platforms.
    Unknown IDs are silently ignored (no matching row in the platforms table).

    Args:
        db (Session): SQLAlchemy database session.
        user (User): The authenticated SQLAlchemy User instance.
        platform_ids (list[int]): TMDB watch-provider IDs to set.

    Returns:
        list[PlatformResponse]: The user's new platform list after update.
    """
    user.platforms = user_repository.get_platforms_by_ids(db, platform_ids)
    db.commit()
    db.refresh(user)
    return [PlatformResponse.model_validate(p) for p in user.platforms]
