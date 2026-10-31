from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Settings from env vars; apps/ai-service/.env overrides the repo root .env."""

    model_config = SettingsConfigDict(
        env_file=("../../.env", ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    ai_service_api_key: str = Field(min_length=1)
    anthropic_api_key: str | None = None
    anthropic_model: str = "claude-opus-5-5"
    deepgram_api_key: str | None = None
    deepgram_model: str = "nova-3"
    # Largest recording the service will download (bytes).
    max_recording_bytes: int = 1024 * 1024 * 1024


@lru_cache
def get_settings() -> Settings:
    return Settings()
