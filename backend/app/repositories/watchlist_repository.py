"""
Watchlist Repository

This module provides data access functions for the WatchlistEntry entity.
It is the only layer in the application that communicates directly with the
database for watchlist operations.

All functions receive a SQLAlchemy Session as their first argument,
injected by FastAPI via the get_db() dependency.

Functions:
    - create: persist a new watchlist entry
    - get_by_user: retrieve all watchlist entries for a user
    - get_by_user_and_tmdb: retrieve a specific entry by user and film
    - remove: delete a watchlist entry
"""

from app.models.watchlist_entry import WatchlistEntry
from sqlalchemy.orm import Session
from sqlalchemy import select
from uuid import UUID


def create(db: Session, entry: WatchlistEntry) -> WatchlistEntry:
    """
    Persist a new WatchlistEntry instance to the database.

    Adds the entry to the session, commits the transaction, then refreshes
    the instance to load all server-generated values (id, created_at,
    updated_at).

    Args:
        db (Session): SQLAlchemy database session.
        entry (WatchlistEntry): Entry instance to persist. Must have
            user_id and tmdb_id set before being passed here.

    Returns:
        WatchlistEntry: The persisted entry with all database-generated
            fields populated.
    """
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


def get_by_user(db: Session, user_id: UUID) -> list[WatchlistEntry]:
    """
    Retrieve all watchlist entries for a given user.

    Args:
        db (Session): SQLAlchemy database session.
        user_id (UUID): UUID of the user whose watchlist to retrieve.

    Returns:
        list[WatchlistEntry]: All entries belonging to the user.
            Returns an empty list if the user has no watchlist entries.
    """
    return db.execute(
        select(WatchlistEntry)
        .where(WatchlistEntry.user_id == user_id)
    ).scalars().all()


def get_by_user_and_tmdb(
    db: Session, user_id: UUID, tmdb_id: int
) -> WatchlistEntry | None:
    """
    Retrieve a specific watchlist entry by user and TMDB film ID.

    Used by remove() and by the service layer to check whether a user
    has already added a given film to their watchlist.

    Args:
        db (Session): SQLAlchemy database session.
        user_id (UUID): UUID of the user.
        tmdb_id (int): TMDB identifier of the film.

    Returns:
        WatchlistEntry: The matching entry, or None if not found.
    """
    return db.execute(
        select(WatchlistEntry)
        .where(WatchlistEntry.user_id == user_id)
        .where(WatchlistEntry.tmdb_id == tmdb_id)
    ).scalar_one_or_none()


def remove(db: Session, user_id: UUID, tmdb_id: int) -> bool:
    """
    Delete a watchlist entry identified by user and TMDB film ID.

    Fetches the entry first to confirm it exists. Returns False if not
    found so the service layer can raise an appropriate HTTP error
    without coupling the repository to FastAPI.

    Args:
        db (Session): SQLAlchemy database session.
        user_id (UUID): UUID of the user who owns the entry.
        tmdb_id (int): TMDB identifier of the film to remove.

    Returns:
        bool: True if the entry was found and deleted, False otherwise.
    """
    entry = get_by_user_and_tmdb(db, user_id, tmdb_id)

    if not entry:
        return False

    db.delete(entry)
    db.commit()
    return True
