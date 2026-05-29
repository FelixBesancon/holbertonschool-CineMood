"""
BaseModel

This module defines the abstract base class inherited by all persistent
SQLAlchemy models in the CinéMood application.

It centralises the three attributes shared by every entity:
a UUID primary key, a creation timestamp, and a last-updated timestamp.
It also declares the save() and delete() utility methods that will be
implemented once the session management pattern is established.
"""

from app.database import Base
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import func
from uuid import UUID
from datetime import datetime, timezone


class BaseModel(Base):
    """
    Abstract base class for all persistent SQLAlchemy models.

    Inherited by: User, WatchlistEntry, ViewingHistoryEntry.

    This class provides the three attributes shared by every entity,
    avoiding duplication across the codebase. It also declares two
    lifecycle methods (save and delete) that will be implemented
    once the session management pattern is established.

    Attributes:
        id (UUID): Primary key, generated automatically by PostgreSQL
            via gen_random_uuid(). Never modified after creation.
        created_at (datetime): Timestamp set by PostgreSQL at insertion.
            Never modified after creation.
        updated_at (datetime): Timestamp set by PostgreSQL at insertion,
            refreshed automatically by Python on every update via onupdate.

    Notes:
        __abstract__ = True prevents SQLAlchemy from creating a table
        for this class. Only its subclasses will have database tables.
    """

    __abstract__ = True

    id: Mapped[UUID] = mapped_column(
        primary_key=True,
        server_default=func.gen_random_uuid()
    )
    created_at: Mapped[datetime] = mapped_column(
        server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        server_default=func.now(),
        onupdate=lambda: datetime.now(tz=timezone.utc)
    )

    def save(self):
        """
        Refresh the updated_at timestamp and persist the current state.

        This method will be implemented once the SQLAlchemy session
        management pattern is established. It will call db.add(self)
        and db.commit() on the active session.
        """
        pass

    def delete(self):
        """
        Permanently remove this entity from the database.

        This method will be implemented once the SQLAlchemy session
        management pattern is established. It will call db.delete(self)
        and db.commit() on the active session.

        PostgreSQL cascade constraints will automatically remove all
        related records (e.g. deleting a User removes their watchlist
        and viewing history entries).
        """
        pass
