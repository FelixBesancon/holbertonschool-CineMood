"""
Tests for watchlist endpoints.

Covers:
    - POST  /watchlist              (add film)
    - GET   /watchlist              (list films)
    - DELETE /watchlist/{tmdb_id}  (remove film)
    - POST  /watchlist/{tmdb_id}/watched  (mark as watched → moves to history)

TMDB API calls are mocked with AsyncMock — no real network calls are made.
"""

import pytest
import httpx
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi import status

from app.models.tag import Tag


# ---------------------------------------------------------------------------
# Mock TMDB data
# ---------------------------------------------------------------------------

TMDB_ID = 27205  # Inception
TMDB_ID_2 = 550  # Fight Club

MOCK_MOVIE_DETAILS = {
    "id": TMDB_ID,
    "title": "Inception",
    "release_date": "2010-07-16",
    "poster_path": "/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg",
    "overview": "A thief who steals corporate secrets through dream-sharing.",
    "genres": [{"id": 28, "name": "Action"}, {"id": 878, "name": "Science Fiction"}],
    "runtime": 148,
    "credits": {
        "crew": [{"job": "Director", "name": "Christopher Nolan", "department": "Directing"}],
        "cast": [{"name": "Leonardo DiCaprio", "order": 0}],
    },
}

MOCK_MOVIE_DETAILS_2 = {
    **MOCK_MOVIE_DETAILS,
    "id": TMDB_ID_2,
    "title": "Fight Club",
    "release_date": "1999-10-15",
}


def make_http_error(status_code: int) -> httpx.HTTPStatusError:
    mock_response = MagicMock()
    mock_response.status_code = status_code
    return httpx.HTTPStatusError("error", request=MagicMock(), response=mock_response)


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

_USER_A = {
    "first_name": "Alice",
    "last_name": "Watchlist",
    "email": "alice.wl@test.com",
    "password": "Test1234!",
}

_USER_B = {
    "first_name": "Bob",
    "last_name": "Watchlist",
    "email": "bob.wl@test.com",
    "password": "Test1234!",
}


@pytest.fixture()
def auth_headers(client):
    client.post("/auth/register", json=_USER_A)
    res = client.post("/auth/login", json={"email": _USER_A["email"], "password": _USER_A["password"]})
    return {"Authorization": f"Bearer {res.json()['token']}"}


@pytest.fixture()
def other_auth_headers(client):
    client.post("/auth/register", json=_USER_B)
    res = client.post("/auth/login", json={"email": _USER_B["email"], "password": _USER_B["password"]})
    return {"Authorization": f"Bearer {res.json()['token']}"}


@pytest.fixture()
def seeded_tags(db_session):
    tags = [
        Tag(name="Feel-Good Movie", description="Leaves you with a smile"),
        Tag(name="Masterpiece", description="Everything just works."),
    ]
    for tag in tags:
        db_session.add(tag)
    db_session.commit()
    for tag in tags:
        db_session.refresh(tag)
    return tags


@pytest.fixture()
def saved_film(client, auth_headers):
    """Add Inception to user A's watchlist and return the response body."""
    with patch("app.external.tmdb_client.get_movie_details",
               new=AsyncMock(return_value=MOCK_MOVIE_DETAILS)):
        res = client.post("/watchlist", json={"tmdb_id": TMDB_ID}, headers=auth_headers)
    return res.json()


# ---------------------------------------------------------------------------
# POST /watchlist
# ---------------------------------------------------------------------------

class TestAddToWatchlist:

    def test_no_token_returns_403(self, client):
        assert client.post("/watchlist", json={"tmdb_id": TMDB_ID}).status_code == status.HTTP_403_FORBIDDEN

    def test_missing_tmdb_id_returns_422(self, client, auth_headers):
        assert client.post("/watchlist", json={}, headers=auth_headers).status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    def test_success_returns_201(self, client, auth_headers):
        with patch("app.external.tmdb_client.get_movie_details",
                   new=AsyncMock(return_value=MOCK_MOVIE_DETAILS)):
            res = client.post("/watchlist", json={"tmdb_id": TMDB_ID}, headers=auth_headers)
        assert res.status_code == status.HTTP_201_CREATED

    def test_caches_title_and_poster(self, client, auth_headers):
        with patch("app.external.tmdb_client.get_movie_details",
                   new=AsyncMock(return_value=MOCK_MOVIE_DETAILS)):
            body = client.post("/watchlist", json={"tmdb_id": TMDB_ID}, headers=auth_headers).json()
        assert body["title"] == "Inception"
        assert body["poster_url"].startswith("https://image.tmdb.org")

    def test_caches_enriched_metadata(self, client, auth_headers):
        with patch("app.external.tmdb_client.get_movie_details",
                   new=AsyncMock(return_value=MOCK_MOVIE_DETAILS)):
            body = client.post("/watchlist", json={"tmdb_id": TMDB_ID}, headers=auth_headers).json()
        assert body["year"] == 2010
        assert body["director"] == "Christopher Nolan"
        assert "Action" in body["genres"]
        assert body["runtime"] == 148

    def test_response_has_timestamps_and_id(self, client, auth_headers):
        with patch("app.external.tmdb_client.get_movie_details",
                   new=AsyncMock(return_value=MOCK_MOVIE_DETAILS)):
            body = client.post("/watchlist", json={"tmdb_id": TMDB_ID}, headers=auth_headers).json()
        assert "id" in body
        assert "created_at" in body
        assert "updated_at" in body

    def test_duplicate_returns_409(self, client, auth_headers, saved_film):
        with patch("app.external.tmdb_client.get_movie_details",
                   new=AsyncMock(return_value=MOCK_MOVIE_DETAILS)):
            res = client.post("/watchlist", json={"tmdb_id": TMDB_ID}, headers=auth_headers)
        assert res.status_code == status.HTTP_409_CONFLICT

    def test_tmdb_404_returns_404(self, client, auth_headers):
        with patch("app.external.tmdb_client.get_movie_details",
                   new=AsyncMock(side_effect=make_http_error(404))):
            res = client.post("/watchlist", json={"tmdb_id": 999999999}, headers=auth_headers)
        assert res.status_code == status.HTTP_404_NOT_FOUND

    def test_tmdb_error_returns_503(self, client, auth_headers):
        with patch("app.external.tmdb_client.get_movie_details",
                   new=AsyncMock(side_effect=make_http_error(500))):
            res = client.post("/watchlist", json={"tmdb_id": TMDB_ID}, headers=auth_headers)
        assert res.status_code == status.HTTP_503_SERVICE_UNAVAILABLE

    def test_tmdb_network_error_returns_503(self, client, auth_headers):
        with patch("app.external.tmdb_client.get_movie_details",
                   new=AsyncMock(side_effect=httpx.RequestError("timeout"))):
            res = client.post("/watchlist", json={"tmdb_id": TMDB_ID}, headers=auth_headers)
        assert res.status_code == status.HTTP_503_SERVICE_UNAVAILABLE


# ---------------------------------------------------------------------------
# GET /watchlist
# ---------------------------------------------------------------------------

class TestGetWatchlist:

    def test_no_token_returns_403(self, client):
        assert client.get("/watchlist").status_code == status.HTTP_403_FORBIDDEN

    def test_empty_watchlist(self, client, auth_headers):
        res = client.get("/watchlist", headers=auth_headers)
        assert res.status_code == status.HTTP_200_OK
        assert res.json() == []

    def test_contains_saved_film(self, client, auth_headers, saved_film):
        entries = client.get("/watchlist", headers=auth_headers).json()
        assert len(entries) == 1
        assert entries[0]["tmdb_id"] == TMDB_ID

    def test_entry_has_metadata(self, client, auth_headers, saved_film):
        entry = client.get("/watchlist", headers=auth_headers).json()[0]
        assert entry["title"] == "Inception"
        assert entry["year"] == 2010
        assert entry["director"] == "Christopher Nolan"

    def test_isolated_per_user(self, client, auth_headers, other_auth_headers, saved_film):
        assert client.get("/watchlist", headers=other_auth_headers).json() == []

    def test_multiple_films(self, client, auth_headers):
        with patch("app.external.tmdb_client.get_movie_details",
                   new=AsyncMock(return_value=MOCK_MOVIE_DETAILS)):
            client.post("/watchlist", json={"tmdb_id": TMDB_ID}, headers=auth_headers)
        with patch("app.external.tmdb_client.get_movie_details",
                   new=AsyncMock(return_value=MOCK_MOVIE_DETAILS_2)):
            client.post("/watchlist", json={"tmdb_id": TMDB_ID_2}, headers=auth_headers)
        assert len(client.get("/watchlist", headers=auth_headers).json()) == 2


# ---------------------------------------------------------------------------
# DELETE /watchlist/{tmdb_id}
# ---------------------------------------------------------------------------

class TestRemoveFromWatchlist:

    def test_no_token_returns_403(self, client):
        assert client.delete(f"/watchlist/{TMDB_ID}").status_code == status.HTTP_403_FORBIDDEN

    def test_success_returns_200(self, client, auth_headers, saved_film):
        res = client.delete(f"/watchlist/{TMDB_ID}", headers=auth_headers)
        assert res.status_code == status.HTTP_200_OK

    def test_entry_gone_after_remove(self, client, auth_headers, saved_film):
        client.delete(f"/watchlist/{TMDB_ID}", headers=auth_headers)
        assert client.get("/watchlist", headers=auth_headers).json() == []

    def test_not_in_watchlist_returns_404(self, client, auth_headers):
        res = client.delete(f"/watchlist/{TMDB_ID}", headers=auth_headers)
        assert res.status_code == status.HTTP_404_NOT_FOUND

    def test_cannot_remove_another_users_entry(self, client, auth_headers, other_auth_headers, saved_film):
        res = client.delete(f"/watchlist/{TMDB_ID}", headers=other_auth_headers)
        assert res.status_code == status.HTTP_404_NOT_FOUND

    def test_other_users_entry_intact_after_failed_remove(
            self, client, auth_headers, other_auth_headers, saved_film):
        client.delete(f"/watchlist/{TMDB_ID}", headers=other_auth_headers)
        assert len(client.get("/watchlist", headers=auth_headers).json()) == 1


# ---------------------------------------------------------------------------
# POST /watchlist/{tmdb_id}/watched
# ---------------------------------------------------------------------------

class TestMarkAsWatched:

    def test_no_token_returns_403(self, client):
        res = client.post(f"/watchlist/{TMDB_ID}/watched", json={"tmdb_id": TMDB_ID})
        assert res.status_code == status.HTTP_403_FORBIDDEN

    def test_not_in_watchlist_returns_404(self, client, auth_headers):
        with patch("app.external.tmdb_client.get_movie_details",
                   new=AsyncMock(return_value=MOCK_MOVIE_DETAILS)):
            res = client.post(f"/watchlist/{TMDB_ID}/watched", json={"tmdb_id": TMDB_ID}, headers=auth_headers)
        assert res.status_code == status.HTTP_404_NOT_FOUND

    def test_success_returns_201(self, client, auth_headers, saved_film):
        with patch("app.external.tmdb_client.get_movie_details",
                   new=AsyncMock(return_value=MOCK_MOVIE_DETAILS)):
            res = client.post(f"/watchlist/{TMDB_ID}/watched", json={"tmdb_id": TMDB_ID}, headers=auth_headers)
        assert res.status_code == status.HTTP_201_CREATED

    def test_film_removed_from_watchlist(self, client, auth_headers, saved_film):
        with patch("app.external.tmdb_client.get_movie_details",
                   new=AsyncMock(return_value=MOCK_MOVIE_DETAILS)):
            client.post(f"/watchlist/{TMDB_ID}/watched", json={"tmdb_id": TMDB_ID}, headers=auth_headers)
        assert client.get("/watchlist", headers=auth_headers).json() == []

    def test_film_appears_in_history(self, client, auth_headers, saved_film):
        with patch("app.external.tmdb_client.get_movie_details",
                   new=AsyncMock(return_value=MOCK_MOVIE_DETAILS)):
            client.post(f"/watchlist/{TMDB_ID}/watched", json={"tmdb_id": TMDB_ID}, headers=auth_headers)
        history = client.get("/history", headers=auth_headers).json()
        assert len(history) == 1
        assert history[0]["tmdb_id"] == TMDB_ID

    def test_history_entry_has_enriched_metadata(self, client, auth_headers, saved_film):
        with patch("app.external.tmdb_client.get_movie_details",
                   new=AsyncMock(return_value=MOCK_MOVIE_DETAILS)):
            body = client.post(f"/watchlist/{TMDB_ID}/watched", json={"tmdb_id": TMDB_ID}, headers=auth_headers).json()
        assert body["year"] == 2010
        assert body["director"] == "Christopher Nolan"
        assert "Action" in body["genres"]
        assert body["runtime"] == 148

    def test_with_prestige_and_note(self, client, auth_headers, saved_film):
        payload = {"tmdb_id": TMDB_ID, "prestige_tier": "Platinum", "personal_note": "Incredible."}
        with patch("app.external.tmdb_client.get_movie_details",
                   new=AsyncMock(return_value=MOCK_MOVIE_DETAILS)):
            body = client.post(f"/watchlist/{TMDB_ID}/watched", json=payload, headers=auth_headers).json()
        assert body["prestige_tier"] == "Platinum"
        assert body["personal_note"] == "Incredible."

    def test_with_tags(self, client, auth_headers, saved_film, seeded_tags):
        payload = {"tmdb_id": TMDB_ID, "tag_ids": [seeded_tags[0].id]}
        with patch("app.external.tmdb_client.get_movie_details",
                   new=AsyncMock(return_value=MOCK_MOVIE_DETAILS)):
            body = client.post(f"/watchlist/{TMDB_ID}/watched", json=payload, headers=auth_headers).json()
        assert len(body["tags"]) == 1
        assert body["tags"][0]["name"] == seeded_tags[0].name

    def test_already_in_history_returns_409(self, client, auth_headers, saved_film):
        with patch("app.external.tmdb_client.get_movie_details",
                   new=AsyncMock(return_value=MOCK_MOVIE_DETAILS)):
            client.post(f"/watchlist/{TMDB_ID}/watched", json={"tmdb_id": TMDB_ID}, headers=auth_headers)
            # Re-add to watchlist to attempt a second mark-as-watched
            client.post("/watchlist", json={"tmdb_id": TMDB_ID}, headers=auth_headers)
            res = client.post(f"/watchlist/{TMDB_ID}/watched", json={"tmdb_id": TMDB_ID}, headers=auth_headers)
        assert res.status_code == status.HTTP_409_CONFLICT
