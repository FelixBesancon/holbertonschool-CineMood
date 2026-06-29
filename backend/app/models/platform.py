"""
Platform

Streaming platforms available for selection in a user's profile.
Seeded once at setup via seeds/seed_platforms.py and never modified by users.
"""

from sqlalchemy import Boolean, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Platform(Base):
    """
    SQLAlchemy model representing a streaming platform available in CinéMood.

    Rows are seeded once from TMDB's watch-provider catalogue and are never
    created or modified through the API. Users can attach platforms to their
    profile via the ``user_platforms`` association table defined in user.py.

    The ``id`` column intentionally mirrors the TMDB provider ID (e.g. 8 for
    Netflix, 119 for Amazon Prime Video). This allows the film service to
    cross-reference streaming availability returned by TMDB's
    ``/watch/providers`` endpoint directly against the platform rows stored
    in the database without any extra mapping step.

    Attributes:
        id (int): TMDB watch-provider ID, used as the primary key.
        name (str): Human-readable platform name. Maximum 100 characters.
            Unique across the table.
        logo_path (str): Relative path to the platform logo on TMDB's CDN
            (e.g. ``/pbpMk2JmcoNnQwx5JGpXngfoWtp.jpg``). Prepend
            ``https://image.tmdb.org/t/p/original`` to build the full URL.
        is_free (bool): True if the platform is available without a paid
            subscription (e.g. Arte, TF1+, Pluto TV).
    """

    __tablename__ = "platforms"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    logo_path: Mapped[str] = mapped_column(String(255), nullable=False)
    is_free: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    @property
    def logo_url(self) -> str:
        """Full CDN URL built from the TMDB relative logo path."""
        return f"https://image.tmdb.org/t/p/original{self.logo_path}"
