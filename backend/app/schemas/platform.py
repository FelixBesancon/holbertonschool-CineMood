"""
Platform Schemas

This module defines the Pydantic schemas used for platform-related API
responses and input validation in the CinéMood application.

Schemas defined here:
    - PlatformResponse:  outgoing platform data (GET /platforms, embedded
                         in UserResponse via GET /users/me)
    - PlatformListUpdate: payload for PUT /users/me/platforms
"""

from pydantic import BaseModel, ConfigDict


class PlatformResponse(BaseModel):
    """
    Schema for a streaming platform entry returned by the API.

    Used by GET /platforms (full catalogue) and embedded in UserResponse
    (user's selected platforms). Serialized from the Platform ORM model
    via from_attributes=True — the Platform.logo_url property handles
    building the full CDN URL from the stored logo_path.

    Attributes:
        id (int): TMDB watch-provider ID (e.g. 8 for Netflix).
        name (str): Human-readable platform name.
        logo_url (str): Full CDN URL to the platform logo, built from the
            TMDB relative path (https://image.tmdb.org/t/p/original + path).
        is_free (bool): True if the platform requires no paid subscription.
    """
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    logo_url: str
    is_free: bool


class PlatformListUpdate(BaseModel):
    """
    Payload for PUT /users/me/platforms.

    Replaces the user's entire platform list with the provided IDs.
    Sending an empty list clears all platforms. Unknown IDs are silently
    ignored (only valid seeded IDs are linked).

    Attributes:
        platform_ids (list[int]): TMDB watch-provider IDs of the platforms
            to associate with the user. Defaults to an empty list.
    """
    platform_ids: list[int] = []
