"""
Recommendation Service

Implements the two-step film recommendation flow:

  Step 1 - discover()
    Builds a Mistral prompt from the quiz answers and server-side user context
    (age, viewing history, watchlist). Mistral returns 8 film suggestions as
    title + year pairs. The service resolves each to a real TMDB ID via
    search_movie(), enriches with full metadata, checks platform availability,
    and returns up to 6 SwipeCard objects for the swipe deck.

    Title + year is used instead of asking Mistral for TMDB IDs directly,
    because LLMs reliably know film titles but frequently hallucinate numeric
    database identifiers. Disambiguation is handled by filtering search results
    on release year (±1 tolerance) and ranking by popularity.

  Step 2 - refine()
    Re-sends the quiz answers alongside the TMDB IDs liked/rejected during
    swiping. Mistral produces a tighter shortlist of 5 films with a match_score
    per film. The service resolves, enriches, and sorts them descending by score,
    respecting the user's platform filter if requested.

Internal helpers (prefixed _) are pure functions where possible:
  _load_user_context   - DB I/O only, returns a _UserContext bundle
  _build_user_prompt   - pure string builder from quiz + user context
  _build_refine_prompt - extends _build_user_prompt with swipe signals
  _resolve_film        - async: search_movie → filter → get_film_details
  _build_swipe_card    - async: _resolve_film → SwipeCard (None on failure)
"""

import asyncio
from dataclasses import dataclass
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.external.mistral_ai_client import chat_mistral_json
from app.schemas.recommendation import (
    DiscoverRequest, DiscoverResponse, SwipeCard,
    RefineRequest, RecommendationResponse, FilmRecommendation,
)
from app.models.user import User
from app.repositories import viewing_history_repository, watchlist_repository
from app.services.film_service import search_and_get_film


# ── Internal Mistral response schemas ───────────────────────────────────────
# These are never exposed outside this module. They validate the raw JSON
# dict returned by chat_mistral_json() before enrichment with TMDB data.

class _MistralFilm(BaseModel):
    """
    A single film suggestion as returned by Mistral.

    Uses title + year instead of tmdb_id: LLMs know film titles reliably
    but frequently hallucinate numeric database identifiers.
    """
    title: str
    year: int
    reason: str


class _MistralRefineFilm(_MistralFilm):
    """Extends _MistralFilm with a match score for the refine step."""
    match_score: int


class _MistralDiscoverResponse(BaseModel):
    """Wrapper for Mistral's discover response (list of film suggestions)."""
    films: list[_MistralFilm]


class _MistralRefineResponse(BaseModel):
    """Wrapper for Mistral's refine response (scored film suggestions)."""
    films: list[_MistralRefineFilm]


# ── User context bundle ──────────────────────────────────────────────────────

@dataclass
class _UserContext:
    """
    All server-side user data needed to build a Mistral prompt.

    Loaded once per request by _load_user_context() and passed to the
    prompt builders. Avoids threading a db Session through helper functions.

    Attributes:
        age: User's age, or None if not provided.
        platforms: User's configured streaming platforms (Platform ORM objects).
        viewing_history: All films the user has logged (ViewingHistoryEntry list).
            Used to tell Mistral which films to exclude from suggestions.
        watchlist: Films the user wants to watch (WatchlistEntry list).
            Used to hint at the user's taste profile.
    """
    age: int | None
    platforms: list
    viewing_history: list
    watchlist: list


# ── Hint lookup tables ───────────────────────────────────────────────────────
# Maps front-end chip labels to richer natural-language descriptions injected
# into the Mistral prompt. Keeps prompt-building logic out of the data layer.

_AUDIENCE_HINTS = {
    "Just me": "watching alone - no consensus needed, can go niche or demanding.",
    "On a date": "on a romantic date - prefer feel-good, fun or mildly thrilling films. Avoid anything too heavy, controversial, or disturbing.",
    "As a couple": "watching as a couple - they likely have similar tastes, so variety is welcome.",
    "With friends": "with a group of friends - fun, interesting but easy to follow, ideally a conversation-starter.",
    "With a group": "with a large group - mainstream appeal, nothing too niche or divisive.",
    "With family": "with family - broadly enjoyable and appropriate for all ages.",
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
    "I'm open to anything": "any genre - prioritize quality and fit with other criteria",
}

_DESIRE_HINTS = {
    "Something easy": "fun, accessible, lighthearted - easily followed even if the viewer is distracted.",
    "Something immersive": "gripping and captivating - a film you can lose yourself in.",
    "Something challenging": "complex and layered - rewarding for discerning viewers or critics.",
    "Something familiar": "close to the user's existing taste - similar to their history, mainstream, widely seen.",
    "Something out of my comfort zone": "outside the user's usual tastes - unusual, original, little-known.",
}


# ── System prompts ───────────────────────────────────────────────────────────

_DISCOVER_SYSTEM_PROMPT = """
You are a film recommendation expert.
Your task is to suggest exactly 7 diverse theatrical films matching the viewer profile provided.
Vary genres, eras, and styles across picks.

Respond ONLY with this JSON - no text before or after:
{
  "films": [
    {
      "title": "Se7en",
      "year": 1995,
      "reason": "Because you wanted a Fincher-style thriller that unsettles and challenges..."
    }
  ]
}

Fields:
- title: exact film title as it appears internationally (use the original or most common English title)
- year: integer, theatrical release year
- reason: 1-2 sentences addressed directly to the viewer ("you") explaining why
  THIS specific film matches their answers - do not write generic descriptions,
  use proper and polite language

Rules:
- Only suggest real theatrical films you are confident exist
- No TV series, TV movies, short films, or adult/pornographic content
- The reason must describe the actual film identified by title and year
- Never suggest a film listed in the viewer's viewing history
""".strip()

_REFINE_SYSTEM_PROMPT = """
You are a film recommendation expert. Using the viewer profile and their swipe
feedback (liked and rejected films), suggest exactly 5 films they will love.

Respond ONLY with this JSON - no text before or after:
{
  "films": [
    {
      "title": "Se7en",
      "year": 1995,
      "reason": "Building on your love of dark thrillers...",
      "match_score": 94
    }
  ]
}

Fields:
- title: exact film title as it appears internationally
- year: integer, theatrical release year
- reason: 2-3 sentences addressed to the viewer explaining why this film is a
  strong match, referencing their swipe feedback where relevant
- match_score: integer 0–100, how confidently this film matches the full profile

Rules:
- Only suggest real theatrical films you are confident exist
- No TV series, TV movies, short films, or pornographic content
- Sort by match_score descending
- Never suggest a film from the viewer's viewing history or rejected swipes
""".strip()


# ── Prompt builders ──────────────────────────────────────────────────────────

def _load_user_context(user: User, db: Session) -> _UserContext:
    """
    Load all server-side user data needed for prompt construction.

    Called once at the start of discover() and refine(). Bundles the result
    into a _UserContext so prompt builders receive a single clean argument
    instead of a db session.

    Args:
        user: Authenticated user ORM object (platforms already eager-loaded).
        db: Active SQLAlchemy session for history and watchlist queries.

    Returns:
        _UserContext with age, platforms, viewing_history, and watchlist.
    """
    return _UserContext(
        age=user.age,
        platforms=user.platforms,
        viewing_history=viewing_history_repository.get_by_user(db, user.id),
        watchlist=watchlist_repository.get_by_user(db, user.id),
    )


def _build_user_prompt(request: DiscoverRequest, ctx: _UserContext) -> str:
    """
    Build the user-facing prompt block from quiz answers and user context.

    Pure function - no I/O. Used by both discover() (directly) and refine()
    (via _build_refine_prompt, which appends swipe signals on top).

    Args:
        request: Quiz answers from the frontend (DiscoverRequest or subtype).
        ctx: Server-side user context loaded by _load_user_context().

    Returns:
        A formatted multi-line string ready to be sent as the user message
        to Mistral AI.
    """
    audience_hint = _AUDIENCE_HINTS.get(request.audience, request.audience)

    mood_hints = [_MOOD_HINTS.get(m, m) for m in request.mood]
    if len(mood_hints) == 1:
        mood_line = f"The viewer wants {mood_hints[0]}."
    else:
        mood_line = f"The viewer wants {mood_hints[0]}, and also {mood_hints[1]}."

    desire_hint = _DESIRE_HINTS.get(request.desire, request.desire)

    lines = [
        "VIEWER PROFILE:",
        f"- Age: {ctx.age or 'unknown'}",
        f"- Context: the viewer is {audience_hint}",
        f"- Mood: {mood_line}",
        f"- Desired experience: {desire_hint}",
    ]

    if request.preferences:
        lines.append(f"- Preferences: {', '.join(request.preferences)}")

    if request.dealbreakers:
        lines.append(f"- Deal breakers: {', '.join(request.dealbreakers)}")

    if request.notes:
        lines.append("- Specific Request (user's free-form note) - must be respected, takes priority over other criteria:")
        lines.append(f"{request.notes}")
        lines.append("(Disregard the requests that are inconsistent or irrelevant to film recommendations.)")

    if ctx.viewing_history:
        history_str = ", ".join(
            f"{e.title or 'Unknown'} ({e.tmdb_id})"
            for e in ctx.viewing_history
        )
        lines.append(f"\nVIEWING HISTORY (never suggest these):\n{history_str}")

    if ctx.watchlist:
        watchlist_str = ", ".join(
            f"{e.title or 'Unknown'} ({e.tmdb_id})"
            for e in ctx.watchlist
        )
        lines.append(f"\nWATCHLIST (user wants to see these - similar style welcome):\n{watchlist_str}")

    return "\n".join(lines)


def _build_refine_prompt(request: RefineRequest, ctx: _UserContext) -> str:
    """
    Build the refine prompt by extending _build_user_prompt with swipe signals.

    Adds a SWIPE FEEDBACK block so Mistral can infer taste from liked/rejected
    films, and a platform preference line when filter_platforms is True.

    Args:
        request: RefineRequest including liked/rejected TMDB IDs and platform flag.
        ctx: Server-side user context loaded by _load_user_context().

    Returns:
        Full prompt string combining viewer profile and swipe feedback.
    """
    base = _build_user_prompt(request, ctx)

    liked = ", ".join(str(i) for i in request.liked_tmdb_ids) or "none"
    rejected = ", ".join(str(i) for i in request.rejected_tmdb_ids) or "none"

    swipe_lines = [
        "\nSWIPE FEEDBACK:",
        f"- Liked (suggest similar style/tone): {liked}",
        f"- Rejected (avoid similar): {rejected}",
    ]

    if request.filter_platforms and ctx.platforms:
        platform_names = ", ".join(p.name for p in ctx.platforms)
        swipe_lines.append(f"- Prioritize films available on: {platform_names}")

    return base + "\n" + "\n".join(swipe_lines)


# ── TMDB enrichment ──────────────────────────────────────────────────────────

async def _build_swipe_card(
    mistral_film: _MistralFilm,
    user_platform_names: set[str],
) -> SwipeCard | None:
    """
    Enrich one Mistral film suggestion into a SwipeCard.

    Resolves the title + year to a real TMDB film, checks whether it is
    available on any of the user's streaming platforms, and assembles the
    SwipeCard combining TMDB metadata with Mistral's reason string.

    Args:
        mistral_film: A single film suggestion from Mistral's JSON response.
        user_platform_names: Set of platform names configured by the user,
            used to compute available_on_my_platforms.

    Returns:
        SwipeCard if resolution and enrichment succeed, None otherwise.
        None is returned silently - callers filter it out of the results list.
    """
    try:
        film = await search_and_get_film(mistral_film.title, mistral_film.year)
        if film is None:
            return None
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


# ── Public service functions ─────────────────────────────────────────────────

async def discover(
    request: DiscoverRequest,
    user: User,
    db: Session,
) -> DiscoverResponse:
    """
    Step 1 of the recommendation flow: generate swipe cards.

    Builds a Mistral prompt from the quiz answers and server-side user context,
    requests 8 diverse film suggestions (to tolerate resolution failures),
    enriches each with TMDB metadata in parallel, and returns the first 6
    successfully resolved cards.

    Args:
        request: Quiz answers from the frontend.
        user: Authenticated user (platforms eager-loaded).
        db: Active SQLAlchemy session for history/watchlist queries.

    Returns:
        DiscoverResponse containing up to 6 SwipeCard objects.
    """
    ctx = _load_user_context(user, db)
    user_prompt = _build_user_prompt(request, ctx)

    raw_dict = await chat_mistral_json(
        _DISCOVER_SYSTEM_PROMPT, user_prompt, temperature=0.9
    )
    raw = _MistralDiscoverResponse.model_validate(raw_dict)

    user_platform_names = {p.name for p in ctx.platforms}
    tasks = [_build_swipe_card(f, user_platform_names) for f in raw.films]
    results = await asyncio.gather(*tasks)

    cards = [c for c in results if c is not None][:6]
    return DiscoverResponse(cards=cards)


async def refine(
    request: RefineRequest,
    user: User,
    db: Session,
) -> RecommendationResponse:
    """
    Step 2 of the recommendation flow: refine using swipe signals.

    Builds a Mistral prompt combining the original quiz answers with liked
    and rejected film IDs from the swipe step. Requests 5 scored suggestions,
    enriches each with TMDB metadata in parallel, sorts by match_score
    descending, and returns the successfully resolved films.

    Args:
        request: Quiz answers + swipe results + platform filter flag.
        user: Authenticated user (platforms eager-loaded).
        db: Active SQLAlchemy session for history/watchlist queries.

    Returns:
        RecommendationResponse with FilmRecommendation objects sorted by
        match_score descending.
    """
    ctx = _load_user_context(user, db)
    user_prompt = _build_refine_prompt(request, ctx)

    raw_dict = await chat_mistral_json(
        _REFINE_SYSTEM_PROMPT, user_prompt, temperature=0.4
    )
    raw = _MistralRefineResponse.model_validate(raw_dict)

    user_platform_names = {p.name for p in ctx.platforms}
    tasks = [_build_swipe_card(f, user_platform_names) for f in raw.films]
    results = await asyncio.gather(*tasks)

    films = [
        FilmRecommendation(**card.model_dump(), match_score=mistral_film.match_score)
        for card, mistral_film in zip(results, raw.films)
        if card is not None
    ]
    films.sort(key=lambda f: f.match_score, reverse=True)
    return RecommendationResponse(films=films)
