"""
User Repository

This module provides data access functions for the User and Platform entities.
It is the only layer in the application that communicates directly
with the database for these operations.

All functions receive a SQLAlchemy Session as their first argument,
injected by FastAPI via the get_db() dependency.

Functions:
    - get_all_platforms:     return all seeded streaming platforms
    - get_free_platforms:    return platforms that require no paid subscription
    - get_platforms_by_ids:  return Platform rows for a given list of IDs
    - get_by_email:          retrieve a user by email address
    - get_by_id:             retrieve a user by UUID (used by auth dependency)
    - create:                persist a new user and return the created instance
"""

from app.models.user import User
from app.models.platform import Platform
from sqlalchemy.orm import Session
from sqlalchemy import select
from uuid import UUID


def get_all_platforms(db: Session) -> list[Platform]:
    """
    Return all streaming platforms ordered alphabetically by name.

    Used by the platform service to populate the list shown on the
    user profile page. Platforms are seeded once and are never created
    or modified through the API.

    Args:
        db (Session): SQLAlchemy database session.

    Returns:
        list[Platform]: All Platform instances, ordered by name ascending.
    """
    return db.execute(
        select(Platform).order_by(Platform.name)
    ).scalars().all()


def get_free_platforms(db: Session) -> list[Platform]:
    """
    Return all streaming platforms that require no paid subscription.

    Called at user registration to auto-assign free platforms to new accounts,
    so every user starts with a useful default set without any extra step.

    Args:
        db (Session): SQLAlchemy database session.

    Returns:
        list[Platform]: Platform instances where is_free=True, ordered by name.
    """
    return db.execute(
        select(Platform)
        .where(Platform.is_free is True)
        .order_by(Platform.name)
    ).scalars().all()


def get_platforms_by_ids(
        db: Session,
        platform_ids: list[int]
        ) -> list[Platform]:
    """
    Return Platform rows whose IDs are in the provided list.

    Used by the user service when replacing a user's platform list via
    PUT /users/me/platforms. IDs that do not match any seeded platform
    are silently absent from the result — no error is raised for unknown IDs.

    Args:
        db (Session): SQLAlchemy database session.
        platform_ids (list[int]): TMDB watch-provider IDs to look up.

    Returns:
        list[Platform]: Matching Platform instances. May be shorter than
            platform_ids if some IDs do not exist.
    """
    if not platform_ids:
        return []
    return db.execute(
        select(Platform).where(Platform.id.in_(platform_ids))
    ).scalars().all()


def get_by_email(db: Session, email: str) -> User | None:
    """
    Retrieve a user by their email address.

    Used during registration to check for duplicate emails,
    and during login to retrieve the user before password verification.

    Args:
        db (Session): SQLAlchemy database session.
        email (str): Email address to look up.

    Returns:
        User: The matching user instance, or None if not found.
    """
    return db.execute(
        select(User)
        .where(User.email == email)
    ).unique().scalar_one_or_none()


def get_by_id(db: Session, user_id: str) -> User | None:
    """
    Retrieve a user by their UUID.

    Used by the authentication dependency to load the current user
    from the JWT subject claim. The id is received as a string because
    JWT payloads are always strings. It is explicitly converted to a
    UUID object before the comparison so the query works correctly with
    both PostgreSQL and SQLite (SQLite's UUID type requires a UUID object,
    not a raw string).

    Args:
        db (Session): SQLAlchemy database session.
        user_id (str): UUID of the user as a string.

    Returns:
        User: The matching user instance, or None if not found or
            if user_id is not a valid UUID string.
    """
    try:
        uid = UUID(user_id)
    except (ValueError, AttributeError):
        return None
    # .unique() is required because lazy="joined"
    # on User.platforms produces multiple rows per user
    # (one per platform) in the result set.
    return db.execute(
        select(User)
        .where(User.id == uid)
    ).unique().scalar_one_or_none()


def create(db: Session, user: User) -> User:
    """
    Persist a new User instance to the database.

    Adds the user to the session, commits the transaction, then
    refreshes the instance to load all server-generated values
    such as id, created_at, and updated_at.

    Args:
        db (Session): SQLAlchemy database session.
        user (User): User instance to persist. Must have all required
            fields set before being passed to this function.

    Returns:
        User: The persisted user instance with all database-generated
            fields populated.
    """
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
