from typing import Annotated

from fastapi import Depends, HTTPException, Request, status

from app.config import Settings, get_settings
from app.services.analysis import MeetingAnalyzer
from app.services.transcription import DeepgramTranscriber


def get_analyzer(request: Request) -> MeetingAnalyzer:
    analyzer: MeetingAnalyzer | None = request.app.state.analyzer
    if analyzer is None:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "ANTHROPIC_API_KEY is not set")
    return analyzer


def get_transcriber(
    request: Request, settings: Annotated[Settings, Depends(get_settings)]
) -> DeepgramTranscriber:
    if not settings.deepgram_api_key:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "DEEPGRAM_API_KEY is not set")
    return DeepgramTranscriber(
        request.app.state.http,
        settings.deepgram_api_key,
        settings.deepgram_model,
        settings.max_recording_bytes,
    )
