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


class _MistralRefineResponse(BaseModel):
    """Wrapper for Mistral's refine response (scored film suggestions)."""
    perfect_match: _MistralRefineFilm
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
""".strip()

_REFINE_SYSTEM_PROMPT = """
You are a film recommendation expert.
Your task is to produce a structured final recommendation by following
these four steps in order:

STEP 1 — EVALUATE LIKED SWIPE CARDS
You are given films the viewer swiped right on (LIKED FILMS).
Select at most 3 that best match their profile.
Use the REJECTED FILMS as a negative signal: if a liked film shares too much
style, tone, or genre with the rejected ones, score it lower or skip it.

STEP 2 — FIND 3 NEW SUGGESTIONS
Suggest exactly 3 new films that:
- Match ALL viewer criteria (mood, desire, preferences, deal breakers)
- Are NOT in the viewing history
- Are NOT in the watchlist
- Are NOT in the rejected list
- Are NOT already selected from LIKED FILMS
Use rejected films as a negative taste signal — avoid what they imply the viewer dislikes.
Use liked films as a positive taste signal — identify the common style, tone, era or theme.

STEP 3 — PICK FROM WATCHLIST
From the viewer's watchlist, select 0 to 2 films that genuinely fit tonight's mood.
If none fit, or if the user has no watchlist, return an empty list — never force a match.

STEP 4 — SCORE AND ASSEMBLE
Assign a match_score (0–100) to every film selected in Steps 1, 2, and 3.
Sort all films by match_score descending, then assemble the response:
- perfect_match: the single highest-scoring film
- suggestions: the next 2 to 4 highest-scoring films that are NOT from the watchlist
  (if a liked film is already in the watchlist, place it in from_watchlist instead)
- from_watchlist: all watchlist picks from Step 3, plus any liked film that was in the watchlist
  (0 to 2 films maximum; can be empty)
- If the pool exceeds the limit, drop the lowest-scoring non-watchlist film.

IMPORTANT RULES:
- Never suggest any film from REJECTED FILMS (hard exclusion).
- All suggested films must be different, not repetitions.
- Only suggest real theatrical films you are confident exist.
- No TV series, TV movies, short films, or adult content.

Respond ONLY with this JSON — no text before or after:
{
  "perfect_match": {"title": "...", "year": 1999, "reason": "2-3 sentences to the viewer", "match_score": 97},
  "new_suggestions": [
    {"title": "...", "year": 2003, "reason": "...", "match_score": 88},
    {"title": "...", "year": 2010, "reason": "...", "match_score": 82}
  ],
  "from_watchlist": [
    {"title": "...", "year": 2005, "reason": "Why this watchlist film fits tonight's mood", "match_score": 75}
  ]
}

Fields:
- title: exact film title as it appears internationally
- year: integer, theatrical release year
- reason: 2-3 sentences addressed to the viewer explaining why this film is a
  strong match, referencing their swipe feedback where relevant
- match_score: integer 0–100, how confidently this film matches the full profile
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


def _build_refine_prompt(
    request: RefineRequest,
    ctx: _UserContext,
    liked_labels: list[str],
    rejected_labels: list[str],
) -> str:
    """
    Build the refine prompt by extending _build_user_prompt with swipe signals.

    Adds a SWIPE FEEDBACK block so Mistral can infer taste from liked/rejected
    films by name (e.g. "Se7en (1995)") rather than opaque numeric IDs.
    Adds a platform preference line when filter_platforms is True.

    Args:
        request: RefineRequest including liked/rejected TMDB IDs and platform flag.
        ctx: Server-side user context loaded by _load_user_context().
        liked_labels: Resolved "Title (Year)" strings for liked films.
        rejected_labels: Resolved "Title (Year)" strings for rejected films.

    Returns:
        Full prompt string combining viewer profile and swipe feedback.
    """
    base = _build_user_prompt(request, ctx)

    liked = ", ".join(liked_labels) or "none"
    rejected = ", ".join(rejected_labels) or "none"

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

async def _resolve_id_to_label(tmdb_id: int) -> str:
    """
    Resolve a TMDB ID to a human-readable label for use in the refine prompt.

    Returns "Title (Year)" so Mistral can understand liked/rejected films by
    name rather than opaque numeric IDs. Falls back to the raw ID string if
    the TMDB lookup fails.
    """
    try:
        film = await get_film_details(tmdb_id)
        return f"{film.title} ({film.year})"
    except Exception:
        return str(tmdb_id)


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

    Resolves liked/rejected TMDB IDs to readable titles, builds the refine prompt,
    calls Mistral, enriches each section with TMDB metadata, then applies a
    service-level safeguard: any film in suggestions that is also in the user's
    watchlist is moved to from_watchlist to respect the schema invariant.

    Raises:
        ValueError: If Mistral returns no resolvable perfect_match film.

    Args:
        request: Quiz answers + swipe results + platform filter flag.
        user: Authenticated user (platforms eager-loaded).
        db: Active SQLAlchemy session for history/watchlist queries.

    Returns:
        RecommendationResponse with FilmRecommendation objects sorted by
        match_score descending.
    """
    ctx = _load_user_context(user, db)

    # Resolve liked/rejected IDs to titles in parallel before building the prompt
    liked_labels, rejected_labels = await asyncio.gather(
        asyncio.gather(*[_resolve_id_to_label(i) for i in request.liked_tmdb_ids]),
        asyncio.gather(*[_resolve_id_to_label(i) for i in request.rejected_tmdb_ids]),
    )

    user_prompt = _build_refine_prompt(request, ctx, list(liked_labels), list(rejected_labels))

    raw_dict = await chat_mistral_json(_REFINE_SYSTEM_PROMPT, user_prompt, temperature=0.3)
    raw = _MistralRefineResponse.model_validate(raw_dict)

    user_platform_names = {p.name for p in ctx.platforms}
    watchlist_ids = {e.tmdb_id for e in ctx.watchlist}

    def to_rec(card: SwipeCard, score: int) -> FilmRecommendation:
        return FilmRecommendation(**card.model_dump(), match_score=score)

    # Enrich all sections in parallel
    pm_card, suggestion_cards, watchlist_cards = await asyncio.gather(
        _build_swipe_card(raw.perfect_match, user_platform_names),
        asyncio.gather(*[_build_swipe_card(f, user_platform_names) for f in raw.new_suggestions]),
        asyncio.gather(*[_build_swipe_card(f, user_platform_names) for f in raw.from_watchlist]),
    )

    suggestions: list[FilmRecommendation] = []
    from_watchlist: list[FilmRecommendation] = []

    # perfect_match — if it's actually a watchlist film, route it there
    pm_film: FilmRecommendation | None = None
    if pm_card is not None:
        rec = to_rec(pm_card, raw.perfect_match.match_score)
        if rec.tmdb_id in watchlist_ids:
            from_watchlist.append(rec)
        else:
            pm_film = rec

    # new_suggestions — same safeguard
    for card, mistral_film in zip(suggestion_cards, raw.new_suggestions):
        if card is None:
            continue
        rec = to_rec(card, mistral_film.match_score)
        if rec.tmdb_id in watchlist_ids:
            from_watchlist.append(rec)
        else:
            suggestions.append(rec)

    # from_watchlist section — deduplicate against what was already routed there
    seen_ids = {f.tmdb_id for f in from_watchlist}
    for card, mistral_film in zip(watchlist_cards, raw.from_watchlist):
        if card is None or card.tmdb_id in seen_ids:
            continue
        from_watchlist.append(to_rec(card, mistral_film.match_score))
        seen_ids.add(card.tmdb_id)

    # If perfect_match was moved to watchlist, promote the best suggestion
    if pm_film is None:
        suggestions.sort(key=lambda f: f.match_score, reverse=True)
        if suggestions:
            pm_film = suggestions.pop(0)

    if pm_film is None:
        raise ValueError("Refine produced no valid perfect_match after TMDB resolution.")

    suggestions.sort(key=lambda f: f.match_score, reverse=True)
    from_watchlist.sort(key=lambda f: f.match_score, reverse=True)

    return RecommendationResponse(
        perfect_match=pm_film,
        suggestions=suggestions,
        from_watchlist=from_watchlist[:2],
    )
