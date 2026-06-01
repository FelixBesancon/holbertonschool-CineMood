"""
Auth endpoint tests for the CinéMood API.

Covers the /auth/register and /auth/login routes using an in-memory
SQLite database provided by the conftest fixtures. Each test gets a
clean database, so tests are fully isolated from one another.
"""

import pytest
from fastapi import status


VALID_USER = {
    "first_name": "John",
    "last_name": "Doe",
    "email": "JohnDoe@test.com",
    "password": "Test1234!",
    "age": 18
}


def test_register_valid_user(client):
    """A valid registration payload returns 201 and creates the user."""
    response = client.post("/auth/register", json=VALID_USER)
    assert response.status_code == status.HTTP_201_CREATED


def test_user_already_registered(client):
    """Registering the same email twice returns 409 with a descriptive message."""
    client.post("/auth/register", json=VALID_USER)
    response = client.post("/auth/register", json=VALID_USER)
    assert response.status_code == status.HTTP_409_CONFLICT
    assert response.json()["detail"] == "Email already registered"


def test_register_invalid_email(client):
    """A malformed email address is rejected by Pydantic with a 422 response."""
    response = client.post("/auth/register",
        json={
            "first_name": "John",
            "last_name": "Doe",
            "email": "InvalidEmail",
            "password": "Test1234!"
            })
    assert response.status_code == 422


def test_register_invalid_password(client):
    """A password that fails complexity rules is rejected with a 422 response."""
    response = client.post("/auth/register",
        json={
            "first_name": "John",
            "last_name": "Doe",
            "email": "JohnDoe@test.com",
            "password": "InvalidPassword"
            })
    assert response.status_code == 422


def test_login_valid_user(client):
    """Correct credentials after registration return 200 with a JWT token."""
    client.post("/auth/register", json=VALID_USER)
    response = client.post(
        "/auth/login",
        json={
            "email": "JohnDoe@test.com",
            "password": "Test1234!"
            })
    assert response.status_code == status.HTTP_200_OK


def test_login_non_registered_user(client):
    """An unknown email returns 401 with a generic 'Invalid credentials' message."""
    client.post("/auth/register", json=VALID_USER)
    response = client.post("/auth/login",
        json={
            "email": "UnregisteredUser@test.com",
            "password": "Test1234!"
            })
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert response.json()["detail"] == "Invalid credentials"


def test_login_wrong_password(client):
    """A wrong password for a registered email returns 401 — same message as
    unknown email to prevent user enumeration."""
    client.post("/auth/register", json=VALID_USER)
    response = client.post("/auth/login",
        json={
            "email": "JohnDoe@test.com",
            "password": "!4321tseT"
            })
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert response.json()["detail"] == "Invalid credentials"
