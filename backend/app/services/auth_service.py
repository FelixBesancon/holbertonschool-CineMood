"""
Authentication Service

This module implements the business logic for user authentication
in the CinéMood application.

It orchestrates the full registration flow: input validation is
handled upstream by Pydantic schemas, and data persistence is
delegated to the user repository. This service is responsible for
the steps in between: duplicate detection, password hashing,
user construction, and JWT generation.

Functions:
    - register_user: handle the full user registration flow
"""

from dotenv import load_dotenv
import os
from sqlalchemy.orm import Session
from app.repositories import user_repository
from app.schemas.user import UserCreate, UserResponse, AuthResponse
from app.models.user import User
import bcrypt
import jwt
from fastapi import HTTPException, status


load_dotenv()
SECRET_KEY = os.getenv("SECRET_KEY")


def register_user(db: Session, user: UserCreate) -> AuthResponse:
    """
    Handle the full user registration flow.

    Orchestrates duplicate detection, password hashing, user creation,
    and JWT generation. Raises an HTTP exception if the email is already
    registered, so the exception propagates directly to the FastAPI route
    and is returned as a 409 response without any additional handling.

    Args:
        db (Session): SQLAlchemy database session, injected by FastAPI
            via the get_db() dependency.
        user (UserCreate): Validated registration payload. Password is
            received in plain text and hashed before storage.

    Returns:
        AuthResponse: The created user's profile wrapped with a JWT
            access token.

    Raises:
        HTTPException 409: If the email address is already registered.
    """
    if user_repository.get_by_email(db, user.email) is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered"
        )

    hashed_password = bcrypt.hashpw(
        user.password.encode('utf-8'),
        bcrypt.gensalt()
    )

    username = user.first_name + user.last_name

    user_created = User(
        first_name=user.first_name,
        last_name=user.last_name,
        username=username,
        email=user.email,
        hashed_password=hashed_password.decode('utf-8'),
        age=user.age
    )

    user_repository.create(db, user_created)

    return AuthResponse(
        user=UserResponse.model_validate(user_created),
        token=jwt.encode(
            {"sub": str(user_created.id)},
            SECRET_KEY,
            algorithm="HS256"
        )
    )
