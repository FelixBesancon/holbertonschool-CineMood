"""
Interactive manual test for the full recommendation flow.
Run from backend/: python -m test_recommendation

Calls discover(), displays swipe cards, prompts for liked/rejected choices,
then calls refine() and displays the structured results.

Requires a running PostgreSQL database and valid .env credentials.
"""

import asyncio
from app.database import SessionLocal
from app.repositories.user_repository import get_by_email
from app.schemas.recommendation import DiscoverRequest, RefineRequest
from app.services.recommendation_service import discover, refine


TEST_EMAIL = "f.besancon@hotmail.fr"

TEST_REQUEST = DiscoverRequest(
    audience="With family",
    mood=["Surprise me"],
    desire="Something immersive",
    notes="I want a movie like Toy Story, from Pixar",
)


def _parse_choices(raw: str, cards: list) -> list[int]:
    """Convert comma-separated card numbers (1-based) to tmdb_ids."""
    if not raw.strip():
        return []
    ids = []
    for part in raw.split(","):
        try:
            idx = int(part.strip()) - 1
            if 0 <= idx < len(cards):
                ids.append(cards[idx].tmdb_id)
        except ValueError:
            pass
    return ids


async def main() -> None:
    db = SessionLocal()
    try:
        user = get_by_email(db, TEST_EMAIL)
        if not user:
            print(f"No user found with email: {TEST_EMAIL}")
            return

        print(f"User   : {user.first_name} {user.last_name}")
        print(f"Platforms: {[p.name for p in user.platforms] or 'none'}\n")

        # ── DISCOVER ──────────────────────────────────────────────────────
        print("━━━ STEP 1 · DISCOVER ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
        print("Calling Mistral + TMDB…\n")

        discover_result = await discover(TEST_REQUEST, user, db)
        cards = discover_result.cards

        if not cards:
            print("No cards returned — check Mistral response and TMDB resolution.")
            return

        for i, card in enumerate(cards, 1):
            platform_tag = "✓ on your platforms" if card.available_on_my_platforms else "✗ not on your platforms"
            print(f"[{i}] {card.title} ({card.year})  ·  {card.director or '?'}  ·  {card.runtime or '?'} min  ·  {platform_tag}")
            print(f"    Genres : {', '.join(card.genres or [])}")
            print(f"    Reason : {card.reason}")
            print()

        # ── SWIPE ─────────────────────────────────────────────────────────
        print("━━━ SWIPE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
        liked_raw    = input("Films you LIKED    (numbers, comma-separated — Enter to skip): ")
        rejected_raw = input("Films you REJECTED (numbers, comma-separated — Enter to skip): ")

        liked_ids    = _parse_choices(liked_raw, cards)
        rejected_ids = _parse_choices(rejected_raw, cards)

        all_swiped = set(liked_ids) | set(rejected_ids)
        skipped    = not all_swiped
        if skipped:
            print("\n(Swipe step skipped — refine will rely on quiz answers only.)")
        else:
            liked_titles    = [c.title for c in cards if c.tmdb_id in liked_ids]
            rejected_titles = [c.title for c in cards if c.tmdb_id in rejected_ids]
            print(f"\nLiked    : {liked_titles or 'none'}")
            print(f"Rejected : {rejected_titles or 'none'}")

        # ── REFINE ────────────────────────────────────────────────────────
        print("\n━━━ STEP 2 · REFINE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
        print("Calling Mistral + TMDB…\n")

        refine_request = RefineRequest(
            **TEST_REQUEST.model_dump(),
            filter_platforms=True,
            liked_tmdb_ids=liked_ids,
            rejected_tmdb_ids=rejected_ids,
        )

        refine_result = await refine(refine_request, user, db)

        pm = refine_result.perfect_match
        print("🏆  PERFECT MATCH")
        print(f"    {pm.title} ({pm.year})  ·  score {pm.match_score}/100")
        print(f"    {pm.reason}\n")

        if refine_result.suggestions:
            print("✨  SUGGESTIONS")
            for film in refine_result.suggestions:
                platform_tag = "✓" if film.available_on_my_platforms else "✗"
                print(f"    [{film.match_score}/100] {platform_tag} {film.title} ({film.year})")
                print(f"    {film.reason}")
            print()

        if refine_result.from_watchlist:
            print("📋  FROM YOUR WATCHLIST")
            for film in refine_result.from_watchlist:
                print(f"    [{film.match_score}/100] {film.title} ({film.year})")
                print(f"    {film.reason}")
            print()

        if not refine_result.suggestions and not refine_result.from_watchlist:
            print("(Only a perfect match was returned — the pool was very small.)")

    finally:
        db.close()


asyncio.run(main())
