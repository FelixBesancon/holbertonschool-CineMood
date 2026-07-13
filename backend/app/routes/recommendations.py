"""
Recommendation Routes

Implements the two-step film recommendation flow:

Routes:
    - POST /recommendations/discover: generate 6 swipe cards from quiz answers
    - POST /recommendations/refine:   produce final picks from quiz + swipes
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.recommendation import (
    DiscoverRequest, DiscoverResponse,
    RefineRequest, RecommendationResponse
    )
from app.services import recommendation_service

router = APIRouter(prefix="/recommendations", tags=["recommendations"])


@router.post("/discover", response_model=DiscoverResponse)
async def discover(
    request: DiscoverRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> DiscoverResponse:
    """
    Step 1 — generate 6 swipe cards from quiz answers.

    Builds a Mistral prompt from the quiz answers and server-side user context
    (age, viewing history, watchlist, platforms), requests 7 film suggestions,
    enriches each with TMDB metadata, and returns up to 6 SwipeCard objects
    for the frontend swipe deck.

    Args:
        request: Quiz answers and platform filter flag.
        current_user: Authenticated user injected by JWT dependency.
        db: SQLAlchemy session injected by get_db.

    Returns:
        DiscoverResponse with up to 6 SwipeCard objects.

    Raises:
        HTTPException 500: If Mistral or TMDB returns an unrecoverable error.
    """
    try:
        return await recommendation_service.discover(request, current_user, db)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )


@router.post("/refine", response_model=RecommendationResponse)
async def refine(
    request: RefineRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> RecommendationResponse:
    """
    Step 2 — produce final picks from quiz answers + swipe signals.

    Scores liked films via Mistral, suggests 3 new films, picks 0-2 from the
    watchlist, enriches all via TMDB, and assembles the final recommendation
    response: a perfect_match, up to 4 suggestions,
    and up to 2 watchlist picks.

    Args:
        request: Quiz answers, platform filter flag,
                 liked and rejected TMDB IDs.
        current_user: Authenticated user injected by JWT dependency.
        db: SQLAlchemy session injected by get_db.

    Returns:
        RecommendationResponse with perfect_match,
        suggestions, from_watchlist.

    Raises:
        HTTPException 500: If Mistral or TMDB returns an unrecoverable error.
    """
    try:
        return await recommendation_service.refine(request, current_user, db)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )
