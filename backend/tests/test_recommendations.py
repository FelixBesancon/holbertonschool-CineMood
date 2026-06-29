"""
Tests for the recommendation endpoints.

Covers:
    - POST /recommendations/discover
    - POST /recommendations/refine

Authentication and input validation are tested without calling external APIs
(Mistral and TMDB). The happy path (real Mistral + TMDB calls) is covered by
the manual test script and is intentionally excluded from the automated suite
to avoid network dependency and API costs in CI.
"""

import pytest
from fastapi import status

_USER = {
    "first_name": "Test",
    "last_name": "User",
    "username": "testuser_rec",
    "email": "rec@test.com",
    "password": "Valid1!pass",
}

VALID_QUIZ = {
    "audience": "Just me",
    "mood": ["Surprise me"],
    "desire": "Something immersive",
    "preferences": [],
    "dealbreakers": [],
    "notes": "",
    "filter_platforms": True,
}

VALID_REFINE = {
    **VALID_QUIZ,
    "liked_tmdb_ids": [],
    "rejected_tmdb_ids": [],
}


@pytest.fixture()
def auth_headers(client):
    client.post("/auth/register", json=_USER)
    res = client.post("/auth/login", json={"email": _USER["email"], "password": _USER["password"]})
    return {"Authorization": f"Bearer {res.json()['token']}"}


class TestDiscoverAuth:
    def test_discover_requires_auth(self, client):
        res = client.post("/recommendations/discover", json=VALID_QUIZ)
        assert res.status_code == status.HTTP_403_FORBIDDEN

    def test_discover_rejects_invalid_token(self, client):
        res = client.post(
            "/recommendations/discover",
            json=VALID_QUIZ,
            headers={"Authorization": "Bearer not-a-real-token"},
        )
        assert res.status_code == status.HTTP_401_UNAUTHORIZED


class TestDiscoverValidation:
    def test_discover_missing_audience(self, client, auth_headers):
        payload = {**VALID_QUIZ}
        del payload["audience"]
        res = client.post("/recommendations/discover", json=payload, headers=auth_headers)
        assert res.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    def test_discover_missing_mood(self, client, auth_headers):
        payload = {**VALID_QUIZ}
        del payload["mood"]
        res = client.post("/recommendations/discover", json=payload, headers=auth_headers)
        assert res.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    def test_discover_missing_desire(self, client, auth_headers):
        payload = {**VALID_QUIZ}
        del payload["desire"]
        res = client.post("/recommendations/discover", json=payload, headers=auth_headers)
        assert res.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    def test_discover_optional_fields_have_defaults(self, client, auth_headers):
        """preferences, dealbreakers and notes are optional — omitting them is valid."""
        payload = {
            "audience": "Just me",
            "mood": ["Surprise me"],
            "desire": "Something immersive",
            "filter_platforms": False,
        }
        res = client.post("/recommendations/discover", json=payload, headers=auth_headers)
        assert res.status_code != status.HTTP_422_UNPROCESSABLE_ENTITY


class TestRefineAuth:
    def test_refine_requires_auth(self, client):
        res = client.post("/recommendations/refine", json=VALID_REFINE)
        assert res.status_code == status.HTTP_403_FORBIDDEN

    def test_refine_rejects_invalid_token(self, client):
        res = client.post(
            "/recommendations/refine",
            json=VALID_REFINE,
            headers={"Authorization": "Bearer not-a-real-token"},
        )
        assert res.status_code == status.HTTP_401_UNAUTHORIZED


class TestRefineValidation:
    def test_refine_missing_liked_ids(self, client, auth_headers):
        payload = {**VALID_REFINE}
        del payload["liked_tmdb_ids"]
        res = client.post("/recommendations/refine", json=payload, headers=auth_headers)
        assert res.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    def test_refine_missing_rejected_ids(self, client, auth_headers):
        payload = {**VALID_REFINE}
        del payload["rejected_tmdb_ids"]
        res = client.post("/recommendations/refine", json=payload, headers=auth_headers)
        assert res.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    def test_refine_accepts_empty_swipe_lists(self, client, auth_headers):
        """Empty liked/rejected lists are valid — user may have skipped the swipe step."""
        payload = {**VALID_REFINE, "liked_tmdb_ids": [], "rejected_tmdb_ids": []}
        res = client.post("/recommendations/refine", json=payload, headers=auth_headers)
        assert res.status_code != status.HTTP_422_UNPROCESSABLE_ENTITY
