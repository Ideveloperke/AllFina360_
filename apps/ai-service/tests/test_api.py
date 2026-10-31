from fastapi.testclient import TestClient

from app.schemas import MeetingAnalysis
from app.services.transcription import parse_deepgram_response


def test_health(client: TestClient) -> None:
    assert client.get("/health").json() == {"status": "ok"}


def test_rejects_missing_internal_key(client: TestClient) -> None:
    res = client.post("/v1/meeting-analyses", json={"transcript": "x", "meeting_title": "y"})
    assert res.status_code == 401


def test_analysis_unavailable_without_anthropic_key(client: TestClient) -> None:
    res = client.post(
        "/v1/meeting-analyses",
        json={"transcript": "hello", "meeting_title": "Review"},
        headers={"x-internal-api-key": "test-key"},
    )
    assert res.status_code == 503


def test_parse_deepgram_utterances() -> None:
    result = parse_deepgram_response(
        {
            "metadata": {"duration": 12.5},
            "results": {
                "utterances": [
                    {"speaker": 0, "start": 0.0, "end": 2.0, "transcript": "Hi Jane."},
                    {"speaker": 1, "start": 2.1, "end": 4.0, "transcript": "Hello."},
                ]
            },
        }
    )
    assert result.text == "Speaker 1: Hi Jane.\nSpeaker 2: Hello."
    assert result.duration_seconds == 12.5
    assert len(result.segments) == 2


def test_analysis_schema_is_strict_json_schema() -> None:
    schema = MeetingAnalysis.model_json_schema()
    assert set(schema["required"]) >= {"summary", "action_items", "follow_up_email"}
