"""
"""
import asyncio
from pydantic import BaseModel
from dataclasses import dataclass
from app.external.mistral_ai_client import chat_mistral_json
from sqlalchemy.orm import Session
from app.schemas.recommendation import (
    DiscoverRequest, DiscoverResponse,
    RefineRequest, RecommendationResponse,
    SwipeCard
)
from app.models.user import User
from app.repositories import (
    viewing_history_repository, watchlist_repository
)
from app.services.film_service import get_film_details




class _MistralDiscoverFilm(BaseModel):
    tmdb_id: int
    reason: str


class _MistralRefineFilm(_MistralDiscoverFilm):
    match_score: int


class _MistralDiscoverResponse(BaseModel):
    films: list[_MistralDiscoverFilm]


class _MistralRefineResponse(BaseModel):
    films: list[_MistralRefineFilm]


@dataclass
class _UserContext:
    """
    """
    age: int | None
    platforms: list
    viewing_history: list
    watchlist: list


_AUDIENCE_HINTS = {
    "Just me": "The user is looking for a movie to watch alone - no consensus needed, can go niche or demanding.",
    "On a date": "The user is on a romantic date - prefer feel-good, fun or mildly thrilling films, if a horror movie is asked don't go to extremes, avoid anything too heavy or controversial.",
    "As a couple": "The user is watching as a couple - they probably have similar tastes and film culture, so try offering a large variety of options.",
    "With friends": "The user is with a group of friends - preferably suggest fun movies, interesting but not too hard to follow, ones that can spark conversation and debate.",
    "With a group": "The user is part of a large or medium-sized group - preferably chooses a mainstream movie enjoyed by many people, not too niche.",
    "With family": "The user is with their family - keep your suggestions broadly enjoyable and appropriate for all ages.",
}

_MOOD_HINTS = {
    "Comfort me": "something warm, cozy and reassuring",
    "Make me laugh": "something fun, light-hearted and entertaining",
    "Make me feel something": "something emotional, moving and memorable",
    "Keep me on edge": "something suspenseful, with mystery or thriller elements",
    "Blow my mind": "something epic, spectacular and unforgettable",
    "Terrifies me": "something genuinely scary with real horror",
    "Make me think": "something clever, thought-provoking and layered",
    "Surprise me": "something unexpected, original and unusual",
    "I'm open to anything": "any genre - prioritize quality and match to other criteria",
}


_DESIRE_HINTS = {
    "Something easy": "Preferably pick fun, accessible movies that are lighthearted and easygoing, easily followed even if the viewer is distracted.",
    "Something immersive": "Preferably pick gripping, captivating and immersive movies in which you can lose yourself, speculate, and be misguided.",
    "Something challenging": "Preferably pick complex, and layerd movies, challenging yet rewarding films, favored by discerning movie buffs or sharp-eyed critics.",
    "Something familiar": "Preferably pick movies close to the user's taste (similar to their viewing history and watchlist) or that are part of the same franchises, and movies that have reached a wide audience and have likely already been seen by most people.",
    "Something out of my comfort zone": "Preferably pick movies movies that are outside the user's usual tastes (different to their viewing history and watchlist), unusual and original choices and on little-known films."
}

_DISCOVER_SYSTEM_PROMPT = """
You are a film recommendation expert.Your task is to suggest
exactly 6 diverse movies that the user might want to watch.
To do this, you rely on the user's answers to a questionnaire,
their viewing history, and their watchlist of movies they'd like
to see. Try to make varied suggestions.
Respond only in this JSON format - no text before or after:
{
    "films" : [
        {
            "tmdb_id": 4547,
            "reason": "Because you wanted to watch a modern thriller, under two hours long, with a strong female lead..."
        }, ...
    ]
}
Fields:
- tmdb_id: integer, the real TMDB movie ID (e.g. 238 for The Godfather)
- reason: string, 2-3 sentences addressed to the viewer explaining why
this specific film matches their answers (uses proper and polite language)
Only suggest real films with valid TMDB IDs. No TV series, no TV movies,
no pornographic content.
""".strip()

def _load_user_context(user: User, db: Session) -> _UserContext:
    return _UserContext(
        age=user.age,
        platforms=user.platforms,
        viewing_history=viewing_history_repository.get_by_user(db, user.id),
        watchlist=watchlist_repository.get_by_user(db, user.id),
    )


def _build_user_prompt(request: DiscoverRequest, user_context: _UserContext) -> str:
    """
    """
    audience_hint = _AUDIENCE_HINTS.get(request.audience)
    mood_hints = [_MOOD_HINTS.get(m, m) for m in request.mood]

    if len(mood_hints) == 1:
        mood_hint = f"The viewer wants {mood_hints[0]}."
    else:
        mood_hint = f"The viewer wants {mood_hints[0]}, and also {mood_hints[1]}."
    desire_hint = _DESIRE_HINTS.get(request.desire)

    user_prompt = f"""
    VIEWER PROFILE:
    - Age: {user_context.age or  'unknown'}
    - Audience: {audience_hint}
    - Mood: {mood_hint}
    - Desire: {desire_hint}
    """
    if request.preferences:
        user_prompt += f"\n- Preferences: {', '.join(request.preferences)}"

    if request.dealbreakers:
        user_prompt += f"\n- Deal breakers: {', '.join(request.dealbreakers)}"

    if request.notes:
        user_prompt += f"\n- Notes: {request.notes}"
        user_prompt += "\nNote: If additional notes are inconsistent or fall outside the scope of a movie recommendation, please disregard them."

    if user_context.viewing_history:
        user_prompt += f"\n- User's Viewing History: {', '.join(
            f"{e.title or 'Unknown'} ({e.tmdb_id})"
            for e in user_context.viewing_history
        )}"
        user_prompt += "\nNote: Never suggest movies that are already logged into the user's viewing history."

    if user_context.watchlist:
            user_prompt += f"\n- User's Watchlist: {', '.join(
                f"{e.title or 'Unknown'} ({e.tmdb_id})"
                for e in user_context.watchlist
            )}"

    return user_prompt


async def _build_swipe_card(
    mistral_film: _MistralDiscoverFilm,
    user_platform_names: set[str],
) -> SwipeCard | None:
    """
    """
    try:
        film = await get_film_details(mistral_film.tmdb_id)
        available = bool(
            film.streaming_platforms
            and set(film.streaming_platforms) & user_platform_names
        )
        return SwipeCard(
            **film.model_dump(),
            reason=mistral_film.reason,
            available_on_my_platforms=available,
        )
    except Exception:
        return None


async def discover(
        request: DiscoverRequest, user: User, db:Session
        ) -> DiscoverResponse:
    """
    """
    user_context = _load_user_context(user, db)
    user_prompt = _build_user_prompt(request, user_context)

    raw_dict = (
        await chat_mistral_json(
            _DISCOVER_SYSTEM_PROMPT,
            user_prompt,
            temperature=0.9
            )
        )
    raw = _MistralDiscoverResponse.model_validate(raw_dict)

    user_platform_names = {p.name for p in user_context.platforms}
    tasks = [_build_swipe_card(f, user_platform_names) for f in raw.films]
    results = await asyncio.gather(*tasks)
    cards = [c for c in results if c is not None]
    return DiscoverResponse(cards=cards)


async def refine(
        request: RefineRequest, user: User, db:Session
        ) -> RecommendationResponse:
    """
    """
    raw: _MistralDiscoverResponse
    return
