"""
Application configuration.

Centralises all environment variables using Pydantic Settings.
All settings are loaded once at startup and accessible via the settings instance.
"""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    TMDB_READ_ACCESS_TOKEN: str

    class Config:
        env_file = ".env"


settings = Settings()
