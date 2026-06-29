"""
Mistral AI API Client

Handles all communication with the Mistral AI API using the official
mistralai SDK for type-safe, async-ready requests.

Authentication uses the API key loaded from environment via pydantic_settings.
The client instance is created once at module level and reused across all
calls — avoids creating a new connection pool on every request.

The response_format={"type": "json_object"} parameter guarantees a valid JSON
response from the model without relying on prompt instructions to shape the
output format.

Model: mistral-medium-latest
Documentation: https://docs.mistral.ai/api/
"""

import json
from mistralai import Mistral
from app.config import settings

MISTRAL_MODEL = "mistral-medium-latest"

# Default temperature for recommendation requests: balanced between creativity
# (varied suggestions) and determinism (reliable JSON structure).
DEFAULT_TEMPERATURE = 0.7

# Module-level client reused across all requests.
# timeout=30s: Mistral can be slow under load; 30s avoids hanging indefinitely.
_client = Mistral(api_key=settings.MISTRAL_AI_API_KEY, timeout_ms=30_000)


async def chat_mistral_json(
    system_prompt: str, user_prompt: str,
    temperature: float = DEFAULT_TEMPERATURE,
    ) -> dict:
    """
    Send a chat request to Mistral AI and return the response as a parsed dict.

    Uses the json_object response format to guarantee valid, parseable JSON
    output regardless of the model's natural tendencies. The caller is
    responsible for validating the structure of the returned dict against
    the expected schema.

    Args:
        system_prompt (str): System instruction shaping the model's behavior —
            defines its role, expected output format, and hard constraints.
        user_prompt (str): The actual request content built from the user's
            questionnaire answers and profile data.
        temperature (float): Sampling temperature between 0.0 and 1.0.
            Lower values (0.0-0.3) give more deterministic output;
            higher values (0.7-1.0) give more varied suggestions.
            Defaults to 0.7.

    Returns:
        dict: Parsed JSON object from the model's response content.

    Raises:
        MistralAPIException: If the Mistral API returns a non-2xx status.
        json.JSONDecodeError: If the response content cannot be parsed as JSON.
            Should not occur with json_object format, but guarded for safety.
        IndexError: If the API returns an empty choices list (unexpected state).
    """
    response = await _client.chat.complete_async(
        model=MISTRAL_MODEL,
        response_format={"type": "json_object"},
        temperature=temperature,
        max_tokens=1024,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
    )
    return json.loads(response.choices[0].message.content)
