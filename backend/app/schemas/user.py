"""
User Schemas

This module defines the Pydantic schemas used for user-related API
input validation and response serialization in the CinéMood application.

Schemas handle data validation and shape - they are distinct from
SQLAlchemy models, which handle database persistence.

Schemas defined here:
    - UserCreate: validates incoming registration data
    - UserLogin: validates incoming login data
    - UserResponse: shapes the user data returned in API responses
    - AuthResponse: wraps UserResponse with a JWT token on registration
      and login
"""

from pydantic import BaseModel, BeforeValidator, AfterValidator
from typing import Any, Optional, Annotated
from uuid import UUID
from datetime import datetime
from app.schemas import validate


def _string_check(name: str):
    """
    Return a BeforeValidator that checks the raw value is a string.

    Using BeforeValidator ensures the check runs before Pydantic's own
    type coercion, producing a field-specific error message instead of
    Pydantic's generic type error.

    Args:
        name (str): Field name used in the error message.

    Returns:
        Callable: A validator function raising ValueError if the value
            is not a string instance.
    """
    def validator(value: Any) -> Any:
        validate.is_string(value, name)
        return value
    return validator


def validate_first_name_format(value: str) -> str:
    """
    Validate the length of a first name.

    Args:
        value (str): First name, already confirmed as a string
        by BeforeValidator.

    Returns:
        str: The validated first name, unchanged.

    Raises:
        ValueError: If the length is outside the 1-60 character range.
    """
    validate.is_between(len(value), "First Name length", 1, 60)
    return value


def validate_last_name_format(value: str) -> str:
    """
    Validate the length of a last name.

    Args:
        value (str): Last name, already confirmed as a string
        by BeforeValidator.

    Returns:
        str: The validated last name, unchanged.

    Raises:
        ValueError: If the length is outside the 1-60 character range.
    """
    validate.is_between(len(value), "Last Name length", 1, 60)
    return value


def validate_email_format(value: str) -> str:
    """
    Validate the format of an email address.

    Args:
        value (str): Email address, already confirmed as a string
        by BeforeValidator.

    Returns:
        str: The validated email address, unchanged.

    Raises:
        ValueError: If the email format is invalid.
    """
    validate.email_format(value)
    return value


def validate_age(value: Optional[int]) -> Optional[int]:
    """
    Validate that an age value is within a realistic human range.

    Age is optional - if not provided (None), validation is skipped.

    Args:
        value (int | None): Age value received from the request payload.

    Returns:
        int | None: The validated age, unchanged. None if not provided.

    Raises:
        ValueError: If the age is outside the 1-120 range.
    """
    if value is None:
        return value
    validate.is_between(value, "Age", 1, 120)
    return value


def validate_password_strength(value: str) -> str:
    """
    Validate the length and complexity of a plain-text password.

    Checks that the password length is between 8 and 64 characters,
    then delegates complexity checks (digit, special character) to
    validate.password_strength().

    Args:
        value (str): Plain-text password, already confirmed as a string
            by BeforeValidator.

    Returns:
        str: The validated password, unchanged.

    Raises:
        ValueError: If the length or complexity requirements are not met.
    """
    validate.is_between(len(value), "Password length", 8, 64)
    validate.password_strength(value)
    return value


ValidFirstName = Annotated[str, BeforeValidator(_string_check(
    "First Name")), AfterValidator(validate_first_name_format)]
ValidLastName = Annotated[str, BeforeValidator(_string_check(
    "Last Name")), AfterValidator(validate_last_name_format)]
ValidEmail = Annotated[str, BeforeValidator(
    _string_check("Email")), AfterValidator(validate_email_format)]
ValidPassword = Annotated[str, BeforeValidator(_string_check(
    "Password")), AfterValidator(validate_password_strength)]
ValidAge = Annotated[Optional[int], AfterValidator(validate_age)]


class UserCreate(BaseModel):
    """
    Schema for incoming user registration data.

    Validates the payload sent to POST /auth/register.
    Password is received in plain text and will be hashed
    by the authentication service before storage.
    The plain-text password is never persisted.

    Attributes:
        first_name (str): User's first name. 1-60 characters.
        last_name (str): User's last name. 1-60 characters.
        email (str): User's email address. Must follow a valid format.
        password (str): Plain-text password. 8-64 characters, must
            contain at least one digit and one special character.
        age (int, optional): User's age. 1-120. Used to filter
            recommendations by age rating (US-14, Could Have).
    """
    first_name: ValidFirstName
    last_name: ValidLastName
    email: ValidEmail
    password: ValidPassword
    age: ValidAge = None


class UserResponse(BaseModel):
    """
    Schema for outgoing user data in API responses.

    Shapes the user information returned after registration,
    login, or profile retrieval. Sensitive fields such as
    hashed_password and is_admin are intentionally excluded.

    Configured with from_attributes=True to allow construction
    directly from a SQLAlchemy User model instance.

    Attributes:
        id (UUID): User's unique identifier.
        created_at (datetime): Timestamp of account creation.
        first_name (str): User's first name.
        last_name (str): User's last name.
        username (str): User's display name.
        email (str): User's email address.
    """
    model_config = {"from_attributes": True}

    id: UUID
    created_at: datetime
    first_name: str
    last_name: str
    username: str
    email: str


class AuthResponse(BaseModel):
    """
    Schema for the response returned on successful registration or login.

    Wraps the user profile with a JWT token that the frontend
    will store in AuthContext and attach to every subsequent
    authenticated request.

    Attributes:
        user (UserResponse): The authenticated user's full profile.
        token (str): JWT access token to be stored client-side.
    """
    user: UserResponse
    token: str


class UserLogin(BaseModel):
    """
    Schema for incoming user login data.

    Validates the payload sent to POST /auth/login.
    Only email and password are required - no other fields
    are needed to authenticate an existing user.

    Email format is validated. Password is not checked for complexity
    at login - only the bcrypt comparison against the stored hash matters.

    Attributes:
        email (str): User's registered email address.
        password (str): Plain-text password to verify against
            the stored bcrypt hash.
    """
    email: ValidEmail
    password: str
