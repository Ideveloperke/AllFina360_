import logging
from typing import Annotated

import anthropic
from fastapi import APIRouter, Depends, HTTPException, status

from app.deps import get_analyzer, get_transcriber
from app.schemas import (
    MeetingAnalysisRequest,
    MeetingAnalysisResponse,
    TranscriptionRequest,
    TranscriptionResponse,
)
from app.security import require_internal_key
from app.services.analysis import AnalysisError, MeetingAnalyzer
from app.services.transcription import DeepgramTranscriber, TranscriptionError

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/v1", dependencies=[Depends(require_internal_key)])


@router.post("/transcriptions")
async def create_transcription(
    body: TranscriptionRequest,
    transcriber: Annotated[DeepgramTranscriber, Depends(get_transcriber)],
) -> TranscriptionResponse:
    try:
        return await transcriber.transcribe(str(body.audio_url))
    except TranscriptionError as e:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, str(e)) from e


@router.post("/meeting-analyses")
async def create_meeting_analysis(
    body: MeetingAnalysisRequest,
    analyzer: Annotated[MeetingAnalyzer, Depends(get_analyzer)],
) -> MeetingAnalysisResponse:
    try:
        return await analyzer.analyze(body)
    except AnalysisError as e:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, str(e)) from e
    except anthropic.RateLimitError as e:
        # 503 lets the API's job queue retry with backoff.
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Claude rate limit hit") from e
    except anthropic.APIStatusError as e:
        logger.exception("Claude API error")
        raise HTTPException(
            status.HTTP_502_BAD_GATEWAY, f"Claude API error ({e.status_code})"
        ) from e
    except anthropic.APIConnectionError as e:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, "Could not reach Claude API") from e
