"""
Recommendation Service

Implements the two-step film recommendation flow:

  Step 1 - discover()
    Builds a Mistral prompt from the quiz answers and server-side user context
    (age, viewing history, watchlist). Mistral returns 7 film suggestions as
    title + year pairs. The service resolves each to a real TMDB ID via
    search_and_get_film(), enriches with full metadata, checks platform
    availability, and returns up to 6 SwipeCard objects for the swipe deck.

    Title + year is used instead of asking Mistral for TMDB IDs directly,
    because LLMs reliably know film titles but frequently hallucinate numeric
    database identifiers. Disambiguation is handled by filtering search results
    on release year (±1 tolerance) and ranking by popularity.

  Step 2 - refine()
    One Mistral call (medium model, temp 0.7) handles two tasks:
      - TASK 1: score each liked film (list of ints, same order as input)
      - TASK 2: suggest exactly 4 new films (notes field takes highest priority)
      - TASK 3: pick 0-2 films from the user's watchlist
    Liked films are fetched directly from TMDB by the service and inserted into
    the result pool with their Mistral-assigned scores. Rejected films are
    excluded both in the prompt and mechanically by the service. All films are
    TMDB-enriched in parallel, sorted by match_score, and assembled into
    perfect_match / suggestions (up to 5) / from_watchlist (up to 2).

Internal helpers (prefixed _) are pure functions where possible:
  _load_user_context   - DB I/O only, returns a _UserContext bundle
  _build_user_prompt   - pure string builder from quiz + user context
  _build_refine_prompt - extends _build_user_prompt with swipe signals
  _resolve_id_to_label - async: tmdb_id → "Title (Year)" string for the refine prompt
  _build_swipe_card    - async: search_and_get_film → SwipeCard (None on failure)
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
from app.services.film_service import search_and_get_film, get_film_details


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


class _MistralLikedEval(BaseModel):
    """Score + reason for a single liked film, evaluated in TASK 1 of the refine prompt."""
    reason: str
    match_score: int


class _MistralRefineResponse(BaseModel):
    """Wrapper for Mistral's refine response: liked evals + new suggestions + watchlist picks."""
    liked_films: list[_MistralLikedEval] = []
    new_suggestions: list[_MistralRefineFilm]
    from_watchlist: list[_MistralRefineFilm] = []


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
- If the viewer provided a SPECIFIC REQUEST (notes field), at least 3 of the 7
  must directly address it.
- If the viewer's SPECIFIC REQUEST mentions a director, actor, or franchise, VERIFY the film's association with them before suggesting it. If uncertain, EXCLUDE the film.
- For director/actor requests: prioritize films where the person is the PRIMARY director/lead actor (not a minor role).
- Never invent a film to match a director/actor request. If no real film fits, suggest a similar film and explain the limitation.


EXAMPLES OF GOOD RESPONSES:
- Request: "Films by Christopher Nolan"
  → Suggest "Inception (2010)", "The Dark Knight (2008)" (Nolan as director)
  → EXCLUDE "Memento (2000)" if the user already saw it (check VIEWING HISTORY)
- Request: "Films with Leonardo DiCaprio"
  → Suggest "The Revenant (2015)" (DiCaprio as lead actor)
  → EXCLUDE "Don't Look Up (2021)" if it's in VIEWING HISTORY
""".strip()

_REFINE_SYSTEM_PROMPT = """
You are a film recommendation expert.
Complete three tasks using the viewer profile provided:

TASK 1 — EVALUATE THE LIKED FILMS
For each film in LIKED FILMS (in the same order), write a reason (2-3 sentences
addressed to the viewer) explaining why this film is a strong match for tonight,
and assign a match_score (0–100) based on how well it fits the viewer profile.
Return one object per film, in the same order as the LIKED FILMS list.
If LIKED FILMS is empty, return an empty array.

TASK 2 — 4 NEW FILM SUGGESTIONS
Suggest EXACTLY 4 new theatrical films that match the viewer profile.
These films must NOT appear in LIKED FILMS, REJECTED FILMS, VIEWING HISTORY, or WATCHLIST.
Use LIKED FILMS as a positive taste signal — identify common style, tone, era, themes.
Use REJECTED FILMS as a negative taste signal — avoid similar style, tone, genre.
If the viewer provided a SPECIFIC REQUEST (notes field), it takes highest priority
over all other criteria — at least 1 of the 3 films must directly address it.
Vary genres, eras, and styles across the 3 picks.

TASK 3 — WATCHLIST PICKS
From the viewer's WATCHLIST, select 0 to 2 films that genuinely fit tonight's mood.
If none fit, or if there is no watchlist, return an empty list — never force a match.

Respond ONLY with this JSON — no text before or after:
{
  "liked_films": [
    {"reason": "2-3 sentences to the viewer", "match_score": 95},
    {"reason": "...", "match_score": 88}
  ],
  "new_suggestions": [
    {"title": "...", "year": 1999, "reason": "2-3 sentences to the viewer", "match_score": 92}
  ],
  "from_watchlist": [
    {"title": "...", "year": 2005, "reason": "Why this watchlist film fits tonight", "match_score": 78}
  ]
}

Fields:
- liked_films: array of objects (one per LIKED FILM, same order): reason + match_score
- title: exact film title as it appears internationally
- year: integer, theatrical release year
- reason: 2-3 sentences addressed to the viewer explaining the match
- match_score: integer 0–100

Rules:
- Only suggest real theatrical films you are confident exist
- No TV series, TV movies, short films, or adult/pornographic content
- The reason must describe the actual film identified by title and year
- Never suggest any film from LIKED FILMS, REJECTED FILMS, VIEWING HISTORY, or WATCHLIST
  in new_suggestions (watchlist films belong in from_watchlist only)
- If the viewer provided a SPECIFIC REQUEST (notes field), at least 3 of the 7
  must directly address it.
- If the viewer's SPECIFIC REQUEST mentions a director, actor, or franchise, VERIFY the film's association with them before suggesting it. If uncertain, EXCLUDE the film.
- For director/actor requests: prioritize films where the person is the PRIMARY director/lead actor (not a minor role).
- Never invent a film to match a director/actor request. If no real film fits, suggest a similar film and explain the limitation.

EXAMPLES OF GOOD RESPONSES:
- Request: "Films by Christopher Nolan"
  → Suggest "Inception (2010)", "The Dark Knight (2008)" (Nolan as director)
  → EXCLUDE "Memento (2000)" if the user already saw it (check VIEWING HISTORY)
- Request: "Films with Leonardo DiCaprio"
  → Suggest "The Revenant (2015)" (DiCaprio as lead actor)
  → EXCLUDE "Don't Look Up (2021)" if it's in VIEWING HISTORY
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
        lines.append("- SPECIFIC REQUEST (notes field) - highest priority, overrides all other criteria:")
        lines.append(f"  {request.notes}")
        lines.append("  (Disregard only if the request is clearly irrelevant to film recommendations.)")

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


def _build_refine_prompt(
    request: RefineRequest,
    ctx: _UserContext,
    liked_labels: list[str],
    rejected_labels: list[str],
) -> str:
    """
    Build the refine prompt by extending _build_user_prompt with swipe signals.

    Liked films appear with their count so Mistral knows exactly how many
    integers to return in liked_scores. Rejected films are passed as a hard
    exclusion — Mistral is instructed never to suggest them, and the service
    also filters them mechanically as a second safety net.

    Args:
        request: RefineRequest including liked/rejected TMDB IDs and platform flag.
        ctx: Server-side user context loaded by _load_user_context().
        liked_labels: Resolved "Title (Year)" strings for liked films.
        rejected_labels: Resolved "Title (Year)" strings for rejected films.

    Returns:
        Full prompt string combining viewer profile and swipe signals.
    """
    base = _build_user_prompt(request, ctx)
    lines = []

    if liked_labels:
        lines += [
            f"\nLIKED FILMS ({len(liked_labels)} films — evaluate each in liked_films, same order):",
            ", ".join(liked_labels),
        ]

    if rejected_labels:
        lines += [
            "\nREJECTED FILMS (negative taste signal — never suggest these):",
            ", ".join(rejected_labels),
        ]

    if request.filter_platforms and ctx.platforms:
        platform_names = ", ".join(p.name for p in ctx.platforms)
        lines.append(f"\nPrioritize films available on: {platform_names}")

    return base + ("\n" + "\n".join(lines) if lines else "")


# ── TMDB enrichment ──────────────────────────────────────────────────────────

async def _resolve_id_to_label(tmdb_id: int, db: Session) -> str:
    """
    Resolve a TMDB ID to a human-readable label for use in the refine prompt.

    Returns "Title (Year)" so Mistral can understand liked/rejected films by
    name rather than opaque numeric IDs. Falls back to the raw ID string if
    the TMDB lookup fails.
    """
    try:
        film = await get_film_details(tmdb_id, db)
        return f"{film.title} ({film.year})"
    except Exception:
        return str(tmdb_id)


async def _build_swipe_card(
    mistral_film: _MistralFilm,
    user_platform_ids: set[int],
    db: Session,
) -> SwipeCard | None:
    """
    Enrich one Mistral film suggestion into a SwipeCard.

    Resolves the title + year to a real TMDB film, checks whether it is
    available on any of the user's streaming platforms, and assembles the
    SwipeCard combining TMDB metadata with Mistral's reason string.

    Args:
        mistral_film: A single film suggestion from Mistral's JSON response.
        user_platform_ids: IDs of the platforms configured by the user,
            used to compute available_on_my_platforms.
        db: Active SQLAlchemy session, forwarded to TMDB enrichment to
            filter streaming platforms.

    Returns:
        SwipeCard if resolution and enrichment succeed, None otherwise.
        None is returned silently - callers filter it out of the results list.
    """
    try:
        film = await search_and_get_film(mistral_film.title, mistral_film.year, db)
        if film is None:
            return None
        available = bool(
            film.streaming_platforms
            and {p.id for p in film.streaming_platforms} & user_platform_ids
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
    requests 7 diverse film suggestions (to tolerate resolution failures),
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

    user_platform_ids = {p.id for p in ctx.platforms}
    tasks = [_build_swipe_card(f, user_platform_ids, db) for f in raw.films]
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

    Architecture:
      1. Resolve liked/rejected TMDB IDs to "Title (Year)" labels in parallel.
      2. Single Mistral call (3 tasks): score liked films + suggest 4 new films
         + pick 0-2 from watchlist.
      3. Fetch liked film details from TMDB in parallel with Mistral enrichment.
      4. Service assembly: rejected films filtered mechanically, all results
         merged into one pool, sorted by match_score descending, then split into
         perfect_match (top 1) / suggestions (next up to 5) / from_watchlist (up to 2).

    Liked films use the match_score assigned by Mistral in TASK 1 — no
    arbitrary fixed value. If Mistral returns fewer scores than expected
    (shouldn't happen with the explicit count hint in the prompt), the
    corresponding liked film is skipped rather than scored arbitrarily.

    Raises:
        ValueError: If no resolvable film remains after enrichment.

    Args:
        request: Quiz answers + swipe results + platform filter flag.
        user: Authenticated user (platforms eager-loaded).
        db: Active SQLAlchemy session for history/watchlist queries.

    Returns:
        RecommendationResponse with FilmRecommendation objects sorted by
        match_score descending.
    """
    ctx = _load_user_context(user, db)

    # Resolve liked/rejected IDs to "Title (Year)" labels in parallel
    liked_tuple, rejected_tuple = await asyncio.gather(
        asyncio.gather(*[_resolve_id_to_label(i, db) for i in request.liked_tmdb_ids]),
        asyncio.gather(*[_resolve_id_to_label(i, db) for i in request.rejected_tmdb_ids]),
    )
    liked_labels = list(liked_tuple)
    rejected_labels = list(rejected_tuple)

    # Single Mistral call: 4 new suggestions + watchlist picks
    user_prompt = _build_refine_prompt(request, ctx, liked_labels, rejected_labels)
    raw_dict = await chat_mistral_json(_REFINE_SYSTEM_PROMPT, user_prompt, temperature=0.5)
    raw = _MistralRefineResponse.model_validate(raw_dict)

    user_platform_ids = {p.id for p in ctx.platforms}
    rejected_ids = set(request.rejected_tmdb_ids)
    watchlist_ids = {e.tmdb_id for e in ctx.watchlist}

    # Fetch liked films + enrich Mistral suggestions — all in parallel
    liked_details, new_cards, wl_cards = await asyncio.gather(
        asyncio.gather(*[get_film_details(tid, db) for tid in request.liked_tmdb_ids],
                       return_exceptions=True),
        asyncio.gather(*[_build_swipe_card(f, user_platform_ids, db) for f in raw.new_suggestions]),
        asyncio.gather(*[_build_swipe_card(f, user_platform_ids, db) for f in raw.from_watchlist]),
    )

    pool: list[FilmRecommendation] = []
    from_watchlist: list[FilmRecommendation] = []
    seen_ids: set[int] = set()

    # Include liked films directly — reason + score from Mistral (skip if eval missing)
    for idx, film in enumerate(liked_details):
        if isinstance(film, Exception) or film is None:
            continue
        if film.tmdb_id in rejected_ids or film.tmdb_id in seen_ids:
            continue
        if idx >= len(raw.liked_films):
            continue
        eval_ = raw.liked_films[idx]
        available = bool(
            film.streaming_platforms
            and {p.id for p in film.streaming_platforms} & user_platform_ids
        )
        card = SwipeCard(
            **film.model_dump(),
            reason=eval_.reason,
            available_on_my_platforms=available,
        )
        rec = FilmRecommendation(**card.model_dump(), match_score=eval_.match_score)
        if film.tmdb_id in watchlist_ids:
            from_watchlist.append(rec)
        else:
            pool.append(rec)
        seen_ids.add(film.tmdb_id)

    # Add Mistral new suggestions — filter rejected mechanically
    for card, mf in zip(new_cards, raw.new_suggestions):
        if card is None or card.tmdb_id in rejected_ids or card.tmdb_id in seen_ids:
            continue
        rec = FilmRecommendation(**card.model_dump(), match_score=mf.match_score)
        if card.tmdb_id in watchlist_ids:
            from_watchlist.append(rec)
        else:
            pool.append(rec)
        seen_ids.add(card.tmdb_id)

    # Add Mistral watchlist picks — filter rejected mechanically
    for card, mf in zip(wl_cards, raw.from_watchlist):
        if card is None or card.tmdb_id in rejected_ids or card.tmdb_id in seen_ids:
            continue
        from_watchlist.append(FilmRecommendation(**card.model_dump(), match_score=mf.match_score))
        seen_ids.add(card.tmdb_id)

    if not pool:
        raise ValueError("Refine produced no valid films after TMDB resolution.")

    pool.sort(key=lambda f: f.match_score, reverse=True)
    from_watchlist.sort(key=lambda f: f.match_score, reverse=True)

    pm_film = pool.pop(0)

    return RecommendationResponse(
        perfect_match=pm_film,
        suggestions=pool[:5],
        from_watchlist=from_watchlist[:2],
    )
