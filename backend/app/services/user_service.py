"""
User Service

This module provides business-logic functions for user and platform operations.
It acts as the intermediary between the route handlers and the repository layer,
converting raw ORM objects into validated Pydantic response schemas.

All functions receive a SQLAlchemy Session injected by FastAPI's get_db()
dependency and delegate database access to user_repository.

Functions:
    - get_all_platforms: return all seeded streaming platforms as PlatformResponse
"""

from sqlalchemy.orm import Session
from app.repositories import user_repository
from app.schemas.user import PlatformResponse
from app.services._tmdb_metadata import LOGO_BASE_URL


def get_all_platforms(db: Session) -> list[PlatformResponse]:
    """
    Return all streaming platforms available in CinéMood.

    Retrieves the full platform catalogue from the database and serializes
    each row into a PlatformResponse schema. The list is ordered alphabetically
    by platform name (enforced at the repository level).

    logo_url is built here by prepending LOGO_BASE_URL to the logo_path stored
    in the database (a TMDB relative path, e.g. /pbpMk2JmcoNnQwx5JGpXngfoWtp.jpg).
    This keeps the storage format lean while returning a ready-to-use URL.

    Args:
        db (Session): SQLAlchemy database session.

    Returns:
        list[PlatformResponse]: All platforms with id, name, logo_url (full
            CDN URL) and is_free fields.
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
