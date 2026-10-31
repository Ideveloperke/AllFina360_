"""Speech-to-text with speaker diarization via Deepgram's pre-recorded audio API."""

from typing import Any

import httpx

from app.schemas import TranscriptionResponse, TranscriptSegment

DEEPGRAM_URL = "https://api.deepgram.com/v1/listen"


class TranscriptionError(Exception):
    pass


class DeepgramTranscriber:
    def __init__(self, http: httpx.AsyncClient, api_key: str, model: str, max_bytes: int) -> None:
        self._http = http
        self._api_key = api_key
        self._model = model
        self._max_bytes = max_bytes

    async def transcribe(self, audio_url: str) -> TranscriptionResponse:
        # Download first, then upload the bytes: the presigned URL may point at private
        # storage (e.g. local MinIO) that Deepgram cannot reach.
        audio, content_type = await self._download(audio_url)

        res = await self._http.post(
            DEEPGRAM_URL,
            params={
                "model": self._model,
                "diarize": "true",
                "smart_format": "true",
                "punctuate": "true",
                "utterances": "true",
            },
            headers={"Authorization": f"Token {self._api_key}", "Content-Type": content_type},
            content=audio,
            timeout=httpx.Timeout(900.0, connect=10.0),
        )
        if res.status_code >= 400:
            raise TranscriptionError(f"Deepgram error {res.status_code}: {res.text[:500]}")
        return parse_deepgram_response(res.json())

    async def _download(self, url: str) -> tuple[bytes, str]:
        chunks: list[bytes] = []
        size = 0
        async with self._http.stream("GET", url, timeout=httpx.Timeout(300.0)) as res:
            if res.status_code >= 400:
                raise TranscriptionError(f"Could not download recording ({res.status_code})")
            content_type = res.headers.get("content-type", "application/octet-stream")
            async for chunk in res.aiter_bytes():
                size += len(chunk)
                if size > self._max_bytes:
                    raise TranscriptionError("Recording is larger than the allowed maximum")
                chunks.append(chunk)
        return b"".join(chunks), content_type


def parse_deepgram_response(data: dict[str, Any]) -> TranscriptionResponse:
    results = data.get("results", {})
    utterances = results.get("utterances") or []
    segments = [
        TranscriptSegment(
            speaker=f"Speaker {int(u.get('speaker', 0)) + 1}",
            start=float(u["start"]),
            end=float(u["end"]),
            text=u["transcript"],
        )
        for u in utterances
    ]
    if segments:
        text = "\n".join(f"{s.speaker}: {s.text}" for s in segments)
    else:
        channels = results.get("channels") or [{}]
        alternatives = channels[0].get("alternatives") or [{}]
        text = alternatives[0].get("transcript", "")

    duration = data.get("metadata", {}).get("duration")
    return TranscriptionResponse(
        text=text,
        segments=segments,
        duration_seconds=float(duration) if duration is not None else None,
        provider="deepgram",
    )
