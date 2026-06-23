"""
Quick manual test for the discover() service function.
Run from the backend/ directory: python test_discover.py

Requires a running PostgreSQL database and valid .env credentials
(MISTRAL_AI_API_KEY, TMDB_READ_ACCESS_TOKEN, DATABASE_URL).
"""
import asyncio
from app.database import SessionLocal
from app.repositories.user_repository import get_by_email
from app.schemas.recommendation import DiscoverRequest
from app.services.recommendation_service import discover


TEST_EMAIL = "f.besancon@hotmail.fr"  # ← remplace par un vrai user en DB

TEST_REQUEST = DiscoverRequest(
    audience="Juste me",
    mood=["Surprise me"],
    desire="Something immersive",
    preferences=["Over 90 minutes"],
    dealbreakers=["No musicals"],
    notes="No film with Brad Pitt. I want at least 1 film from Steven Spielberg !",
)


async def main():
    db = SessionLocal()
    try:
        user = get_by_email(db, TEST_EMAIL)
        if not user:
            print(f"No user found with email: {TEST_EMAIL}")
            return

        print(f"User: {user.first_name} {user.last_name}")
        print(f"Platforms: {[p.name for p in user.platforms]}\n")
        print("Calling Mistral + TMDB...\n")

        result = await discover(TEST_REQUEST, user, db)

        print(f"Got {len(result.cards)} swipe cards:\n")
        for i, card in enumerate(result.cards, 1):
            print(f"[{i}] {card.title} ({card.year}) — dir. {card.director}")
            print(f"    Genres : {', '.join(card.genres or [])}")
            print(f"    Runtime: {card.runtime} min")
            print(f"    On my platforms: {card.available_on_my_platforms}")
            print(f"    Reason : {card.reason}")
            print()
    finally:
        db.close()


asyncio.run(main())

"""
User: Felix Besancon
Platforms: ['Netflix', 'Apple TV', 'Disney Plus', 'M6+', 'Canal+', 'TF1+', 'Amazon Prime Video', 'HBO Max', 'Arte']

Calling Mistral + TMDB...

Got 5 swipe cards:

[1] Fantastic Four: Rise of the Silver Surfer (2007) — dir. Tim Story
    Genres : Science Fiction, Adventure, Action
    Runtime: 92 min
    On my platforms: True
    Reason : For a Fincher-style thriller, you won't find one more stylish or suspenseful than this. Its layered narrative and dark atmosphere make it a perfect match for your taste in clever, thought-provoking films that challenge the viewer.

[2] Back to the Future (1985) — dir. Robert Zemeckis
    Genres : Adventure, Comedy, Science Fiction
    Runtime: 116 min
    On my platforms: True
    Reason : This neo-noir mystery thrives on intricate plotting and moral ambiguity, offering plenty to dissect and discuss. It’s a masterclass in tension, perfectly suited for viewing alone when you can engage deeply with its many twists.

[3] The Matrix (1999) — dir. Lana Wachowski
    Genres : Action, Science Fiction
    Runtime: 136 min
    On my platforms: True
    Reason : A psychological thriller that plays with perception and reality, this film demands careful attention but rewards it with a haunting payoff. Its sharp critique of society and media makes it a standout pick for discerning viewers.

[4] Fuck My Tits 4 (2008) — dir. Chris Charming
    Genres : 
    Runtime: 124 min
    On my platforms: False
    Reason : This underrated gem blends heist and thriller genres with razor-sharp dialogue and unexpected depth. Its clever structure and suspenseful pacing make it ideal for a solitary viewing session where you can fully appreciate its nuances.

[5] Forrest Gump (1994) — dir. Robert Zemeckis
    Genres : Comedy, Drama, Romance
    Runtime: 142 min
    On my platforms: True
    Reason : A gripping noir-style thriller with a complex protagonist and a plot that keeps you guessing. Its black-and-white visuals add a timeless quality, while its exploration of morality and justice aligns perfectly with your preferences.
"""
