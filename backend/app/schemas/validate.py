"""
Validation Utilities

This module provides reusable validation helper functions used by the
Pydantic schemas of the CinéMood application.

These functions are intentionally kept independent of Pydantic and
SQLAlchemy so they can be reused across multiple schemas without
duplication.

Functions:
    - is_string: checks that a value is a string instance
    - is_between: checks that a numeric value falls within a range
    - email_format: checks that a string matches a valid email pattern
    - password_strength: checks digit and special character requirements
"""

from typing import Any
import re


def is_string(value: Any, name: str) -> None:
    """
    Check that a value is a string instance.

    Args:
        value (any): The value to check.
        name (str): Field name used in the error message.

    Raises:
        ValueError: If the value is not a string.
    """
    if not isinstance(value, str):
        raise ValueError(f"{name} must be a string.")
    return


def is_between(value: int, name: str, min_value: int, max_value: int) -> None:
    """
    Validate that a numeric value falls within an inclusive range.

    Args:
        value (int): Numeric value to validate.
        name (str): Field name used in the error message.
        min_value (int): Minimum allowed value (inclusive).
        max_value (int): Maximum allowed value (inclusive).

    Raises:
        ValueError: If the value is outside the inclusive range.
    """
    if not min_value <= value <= max_value:
        raise ValueError(
            f"{name} must be between {min_value} and {max_value} included."
        )
    return


def email_format(value: str) -> None:
    """
    Validate that a string matches a basic email format.

    Checks for the presence of a local part, an @ symbol, a domain,
    and a top-level domain. Does not perform DNS resolution.

    Args:
        value (str): Email address to validate.

    Raises:
        ValueError: If the string does not match the expected pattern.
    """
    if not re.match(r"[^@]+@[^@]+\.[^@]+", value):
        raise ValueError("Invalid Email format")
    return


def password_strength(value: str) -> None:
    """
    Validate that a password meets the minimum complexity requirements.

    Requirements:
        - At least one digit (0-9)
        - At least one special character among: ! @ # $ % ^ & * ( ) , . ?
          \" : { } | < >

    Length validation (8-64 characters) is handled separately by
    is_between() before this function is called.

    Args:
        value (str): Plain-text password to validate.

    Raises:
        ValueError: If the password does not contain at least one digit.
        ValueError: If the password does not contain at least one
            special character.
    """
    if not re.search(r"\d", value):
        raise ValueError("Password must contain at least one digit.")
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", value):
        raise ValueError(
            "Password must contain at least one special character."
        )
    return
