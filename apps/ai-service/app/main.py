from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

import httpx
from anthropic import AsyncAnthropic
from fastapi import FastAPI

from app.config import get_settings
from app.routers import v1
from app.services.analysis import MeetingAnalyzer


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    settings = get_settings()
    app.state.http = httpx.AsyncClient(follow_redirects=True)
    anthropic_client = (
        AsyncAnthropic(api_key=settings.anthropic_api_key) if settings.anthropic_api_key else None
    )
    app.state.analyzer = (
        MeetingAnalyzer(anthropic_client, settings.anthropic_model) if anthropic_client else None
    )
    try:
        yield
    finally:
        await app.state.http.aclose()
        if anthropic_client:
            await anthropic_client.close()


app = FastAPI(title="AllFina AI Service", version="0.1.0", lifespan=lifespan)
app.include_router(v1.router)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
