"""
Shared helper for extracting cacheable metadata from a TMDB movie
detail response.

Used by watchlist_service, viewing_history_service, and library_service
so the extraction logic lives in exactly one place.
"""

_POSTER_BASE_URL = "https://image.tmdb.org/t/p/w500"
# Platform logos are fetched at original resolution — they're small PNGs
# and TMDB doesn't offer useful intermediate sizes for logos.
LOGO_BASE_URL = "https://image.tmdb.org/t/p/original"


def extract_metadata(film_data: dict) -> dict:
    """
    Extract all cacheable fields from a get_movie_details() response.

    Returns a dict ready to be unpacked as keyword arguments into a
    WatchlistEntry or ViewingHistoryEntry constructor.

    All values are None-safe: missing or empty TMDB fields become None
    so the frontend can handle them gracefully.

    Args:
        film_data (dict): Raw TMDB movie detail response (with credits).

    Returns:
        dict: Keys: title, poster_url, year, director, synopsis, genres,
            runtime.
    """
    poster_path = film_data.get("poster_path")
    poster_url = _POSTER_BASE_URL + poster_path if poster_path else None

    release_date = film_data.get("release_date") or ""
    year = int(release_date[:4]) if len(release_date) >= 4 else None

    crew = film_data.get("credits", {}).get("crew", [])
    directors = [p["name"] for p in crew if p.get("job") == "Director"]
    director = ", ".join(directors) if directors else None

    synopsis = film_data.get("overview") or None
    genres = [g["name"] for g in film_data.get("genres", [])] or None
    runtime_raw = film_data.get("runtime")
    runtime = (
        runtime_raw
        if isinstance(runtime_raw, int) and runtime_raw > 0
        else None
    )

    return {
        "title": film_data.get("title"),
        "poster_url": poster_url,
        "year": year,
        "director": director,
        "synopsis": synopsis,
        "genres": genres,
        "runtime": runtime,
    }
