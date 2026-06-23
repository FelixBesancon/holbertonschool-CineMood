"""
Recommendation Schemas

Pydantic models for the two-step recommendation flow:

  Step 1 — Discover (POST /recommendations/discover)
    The frontend sends quiz answers and a platform filter flag.
    Mistral returns 6 diverse films; the service enriches them with TMDB
    metadata and platform availability, then returns SwipeCard objects.

  Step 2 — Refine (POST /recommendations/refine)
    After swiping, the frontend resends the same quiz answers plus the
    TMDB IDs of liked and rejected films. Mistral uses the swipe signals
    to produce a tighter shortlist; the service enriches and scores each
    film, returning FilmRecommendation objects.

User context (age, viewing history, watchlist, platform subscriptions) is
never sent by the frontend — the service fetches it server-side from the
database using the authenticated user's identity and injects it into the
Mistral prompt automatically.

Request hierarchy:
    QuizAnswers
    └── DiscoverRequest  (+ filter_platforms)
          └── RefineRequest  (+ liked_tmdb_ids, rejected_tmdb_ids)

Response hierarchy:
    Film  (schemas/film.py)
    └── SwipeCard            (+ reason, available_on_my_platforms)
          └── FilmRecommendation  (+ match_score)

    DiscoverResponse        { cards: list[SwipeCard] }
    RecommendationResponse  { films: list[FilmRecommendation] }
"""

from pydantic import BaseModel
from app.schemas.film import Film


class QuizAnswers(BaseModel):
    """
    Structured answers from the recommendation questionnaire.

    Shared base for both DiscoverRequest and RefineRequest so that the
    full quiz context is always available when building the Mistral prompt.

    Attributes:
        audience (str): Who is watching — e.g. "Just me", "With family".
            Maps to Q1 of the questionnaire (single required answer).
        mood (list[str]): What the viewer wants the film to do —
            e.g. ["Make me think", "Keep me on edge"].
            Maps to Q2 (1 to 2 answers required).
        desire (list[str]): The type of viewing experience wanted —
            e.g. "Something challenging".
            Maps to Q3 (single required answer).
        preferences (list[str]): Optional soft constraints —
            e.g. ["Highly rated only", "Under 2 hours"].
            Maps to Q4 (0 to many, all optional).
        dealbreakers (list[str]): Hard exclusions the film must not have —
            e.g. ["No subtitles", "No sad ending"].
            Maps to Q5 (0 to 2, optional).
        notes (str): Free-text field from the last questionnaire step,
            allowing the user to specify a director, actor, era, genre,
            or anything else. Empty string when not filled in.
    """
    audience: str
    mood: list[str]
    desire: str
    preferences: list[str] = []
    dealbreakers: list[str] = []
    notes: str = ""


class DiscoverRequest(QuizAnswers):
    """
    Request body for POST /recommendations/discover.

    Sent after the user completes the questionnaire. The service builds
    a Mistral prompt from the quiz answers plus server-side user context
    (age, viewing history, watchlist) to suggest 6 diverse films
    for the swipe deck.

    """
    pass


class RefineRequest(DiscoverRequest):
    """
    Request body for POST /recommendations/refine.

    Sent after the user has swiped through the discover deck. Extends
    DiscoverRequest with the user's platform subscriptions and the
    swipe signals so the service can build a richer Mistral prompt:
    the original quiz answers are re-sent alongside the
    IDs of liked and rejected films, allowing the model to infer taste
    more precisely and produce a tighter, higher-confidence shortlist.

    Attributes:
        filter_platforms (bool): When True, the Mistral prompt instructs
            the model to prioritize films available on the user's configured
            streaming platforms. Platform availability is then verified
            per film via TMDB's watch/providers endpoint.
            Defaults to True.
        liked_tmdb_ids (list[int]): TMDB IDs of films the user swiped
            right on (accepted / interested).
        rejected_tmdb_ids (list[int]): TMDB IDs of films the user swiped
            left on (rejected / not interested).
    """
    filter_platforms: bool = True
    liked_tmdb_ids: list[int]
    rejected_tmdb_ids: list[int]


class SwipeCard(Film):
    """
    A film card displayed in the swipe deck after the discover step.

    Extends Film (full TMDB metadata) with two recommendation-specific
    fields added by the service after Mistral and TMDB enrichment.

    Attributes:
        reason (str): A 2-3 sentence explanation from Mistral of why this
            film matches the viewer's quiz answers.
        available_on_my_platforms (bool): True if the film is available
            on at least one of the user's configured streaming platforms,
            verified via TMDB's watch/providers endpoint for France (FR).
            Always False when filter_platforms is False or the user has
            no platforms configured.
    """
    reason: str
    available_on_my_platforms: bool


class DiscoverResponse(BaseModel):
    """
    Response body for POST /recommendations/discover.

    Attributes:
        cards (list[SwipeCard]): Ordered list of film cards for the swipe
            deck. The service requests 6 films from Mistral; the list may
            be shorter if TMDB enrichment fails for some of them.
    """
    cards: list[SwipeCard]


class FilmRecommendation(SwipeCard):
    """
    A refined film recommendation produced after the swipe step.

    Extends SwipeCard with a match score that Mistral computes taking
    into account both the original quiz answers and the swipe signals
    (liked / rejected films).

    Attributes:
        match_score (int): Confidence score between 0 and 100 indicating
            how well this film matches the viewer's expressed preferences.
            Provided directly by Mistral based on the full prompt context.
    """
    match_score: int


class RecommendationResponse(BaseModel):
    """
    Response body for POST /recommendations/refine.

    Attributes:
        films (list[FilmRecommendation]): Ordered list of refined film
            recommendations, sorted by match_score descending.
            Typically 3 to 5 films.
    """
    films: list[FilmRecommendation]
