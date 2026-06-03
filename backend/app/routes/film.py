"""
Film Routes

This module defines the FastAPI router for film-related endpoints.
It handles HTTP concerns only — query parameter extraction, error
mapping, and response forwarding. All business logic is delegated
to film_service.

Routes:
    - GET /films/search: search the TMDB catalog by title
    - GET /films/{tmdb_id}: fetch full metadata for a single film
"""

import httpx
from fastapi import APIRouter, Query, HTTPException, status
from app.schemas.film import Film
from app.services import film_service

router = APIRouter(prefix="/films", tags=["films"])


@router.get("/search", response_model=list[Film], status_code=status.HTTP_200_OK)
async def search_films(query: str = Query(..., min_length=1)):
    """
    Search the TMDB catalog by movie title.

    Args:
        query (str): Movie title to search for. Minimum 1 character.

    Returns:
        list[Film]: Partial Film objects (tmdb_id, title, year,
            poster_url, synopsis). Fields unavailable from the search
            endpoint (genres, cast, director, etc.) are None.

    Raises:
        HTTPException 503: If TMDB returns an error or is unreachable.
    """
    try:
        return await film_service.search_films(query)
    except httpx.HTTPStatusError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Film search service is temporarily unavailable."
        )
    except httpx.RequestError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Could not reach the film database. Please try again later."
        )


@router.get("/{tmdb_id}", response_model=Film, status_code=status.HTTP_200_OK)
async def get_film_details(tmdb_id: int):
    """
    Fetch full metadata for a single film by its TMDB identifier.

    Args:
        tmdb_id (int): TMDB unique identifier of the movie.

    Returns:
        Film: Fully populated Film object including genres, cast,
            director, runtime, and streaming platforms.

    Raises:
        HTTPException 404: If TMDB does not recognise the tmdb_id.
        HTTPException 503: If TMDB returns another error or is unreachable.
    """
    try:
        return await film_service.get_film_details(tmdb_id)
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 404:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Film {tmdb_id} not found."
            )
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Film detail service is temporarily unavailable."
        )
    except httpx.RequestError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Could not reach the film database. Please try again later."
        )
