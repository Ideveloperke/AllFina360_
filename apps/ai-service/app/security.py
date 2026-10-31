import secrets
from typing import Annotated

from fastapi import Depends, Header, HTTPException, status

from app.config import Settings, get_settings


def require_internal_key(
    settings: Annotated[Settings, Depends(get_settings)],
    x_internal_api_key: Annotated[str | None, Header()] = None,
) -> None:
    """This service is internal-only: every call must carry the shared key from apps/api."""
    if x_internal_api_key is None or not secrets.compare_digest(
        x_internal_api_key, settings.ai_service_api_key
    ):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid internal API key")
