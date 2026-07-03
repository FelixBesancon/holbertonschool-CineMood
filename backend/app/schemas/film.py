"""
Film Schema

This module defines the Pydantic schema used to represent film data
returned by the TMDB API throughout the CinéMood application.

The Film schema is a read-only data transfer object: it is never used
to validate user input, only to structure the film metadata fetched
from TMDB before returning it to the frontend.

Schemas defined here:
    - Film: represents the full metadata of a single movie
    - FilmWithStatus: wraps Film with a flag indicating whether the
      authenticated user has already logged this film
"""
from pydantic import BaseModel
from app.schemas.platform import PlatformResponse


class Film(BaseModel):
    """
    Schema representing the metadata of a single movie.

    Built from data returned by the TMDB API (via tmdb_client).
    All fields except tmdb_id and title are optional because TMDB
    does not guarantee their presence for every movie.

    This schema is never used to validate incoming user data —
    it only structures outgoing film metadata sent to the frontend.

    Attributes:
        tmdb_id (int): TMDB's unique identifier for the movie.
            Used as the stable reference key throughout the application.
        title (str): Movie title returned by TMDB.
        year (int, optional): Release year, extracted from TMDB's
            release_date field.
        genres (list[str], optional): List of genre names
            (e.g. ["Action", "Drama"]).
        poster_url (str, optional): Full URL of the movie poster image,
            constructed from TMDB's poster_path.
        synopsis (str, optional): Movie overview / plot summary.
        director (list[str], optional): Names of every director, extracted
            from TMDB's credits crew list (a film can have several).
        cast (list[str], optional): List of actor names, extracted
            from TMDB's credits cast list.
        runtime (int, optional): Movie duration in minutes.
        streaming_platforms (list[PlatformResponse], optional): Streaming
            services where the movie is available, restricted to the
            platforms known in CinéMood's own `platforms` table (sourced
            from TMDB's watch/providers endpoint, cross-referenced by
            provider ID). Platforms TMDB reports but that aren't in our
            table are silently omitted.
    """
    tmdb_id: int
    title: str
    year: int | None = None
    poster_url: str | None = None
    synopsis: str | None = None
    genres: list[str] | None = None
    director: list[str] | None = None
    cast: list[str] | None = None
    runtime: int | None = None
    streaming_platforms: list[PlatformResponse] | None = None


class FilmWithStatus(BaseModel):
    """
    Schema wrapping a Film with the authenticated user's history status.

    Returned by GET /films/{tmdb_id} so the frontend can render the
    correct action button (log vs. remove) without a second request.

    Attributes:
        film (Film): Full metadata of the movie.
        in_history (bool): True if the current user has already logged
            this film in their viewing history.
        in_watchlist (bool): True if the current user has already added
            this film in their watchlist.
    """
    film: Film
    in_history: bool
    in_watchlist: bool
