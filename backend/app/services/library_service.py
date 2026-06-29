"""
Library Service

Handles cross-domain operations that span both the watchlist and the viewing
history (e.g. refreshing cached TMDB metadata for all of a user's entries).
"""

from sqlalchemy.orm import Session
from app.repositories import watchlist_repository, viewing_history_repository
from app.external import tmdb_client
from app.services._tmdb_metadata import extract_metadata
from app.models.user import User
import httpx


async def refresh_library(db: Session, user: User) -> dict:
    """
    Re-fetch TMDB metadata for every watchlist and history entry of the user.

    Iterates all entries sequentially and updates year, director, synopsis,
    genres, runtime, title, and poster_url from the live TMDB API. Entries
    for which TMDB returns an error are silently skipped so a single bad
    tmdb_id cannot abort the whole refresh.

    Args:
        db (Session): SQLAlchemy database session.
        user (User): The authenticated user whose library is being refreshed.

    Returns:
        dict: { "refreshed": int, "skipped": int } counts.
    """
    watchlist_entries = watchlist_repository.get_by_user(db, user.id)
    history_entries = viewing_history_repository.get_by_user(db, user.id)

    refreshed = 0
    skipped = 0

    for entry in [*watchlist_entries, *history_entries]:
        try:
            film_data = await tmdb_client.get_movie_details(entry.tmdb_id)
            meta = extract_metadata(film_data)
            for field, value in meta.items():
                setattr(entry, field, value)
            refreshed += 1
        except (httpx.HTTPStatusError, httpx.RequestError):
            skipped += 1

    db.commit()
    return {"refreshed": refreshed, "skipped": skipped}
