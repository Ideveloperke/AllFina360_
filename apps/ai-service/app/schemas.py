"""Request/response models. Field names match apps/api/src/ai/ai-client.service.ts."""

from typing import Literal

from pydantic import BaseModel, Field, HttpUrl


class TranscriptionRequest(BaseModel):
    audio_url: HttpUrl


class TranscriptSegment(BaseModel):
    speaker: str
    start: float
    end: float
    text: str


class TranscriptionResponse(BaseModel):
    text: str
    segments: list[TranscriptSegment]
    duration_seconds: float | None
    provider: str


class MeetingAnalysisRequest(BaseModel):
    transcript: str = Field(min_length=1, max_length=2_000_000)
    meeting_title: str = Field(min_length=1, max_length=200)
    client_name: str | None = None
    advisor_name: str | None = None


# --- Structured output schema Claude must fill in ---


class ActionItem(BaseModel):
    description: str = Field(description="One concrete task, written as an imperative sentence.")
    owner: Literal["advisor", "client", "other"]
    due_date: str | None = Field(
        description="ISO date (YYYY-MM-DD) only if a date was explicitly agreed; otherwise null."
    )


class FollowUpEmail(BaseModel):
    subject: str
    body: str = Field(description="Plain-text email from the advisor to the client.")


class MeetingAnalysis(BaseModel):
    summary: str = Field(description="3-6 sentence neutral summary of the meeting.")
    key_points: list[str] = Field(description="Decisions, goals, concerns and life events raised.")
    action_items: list[ActionItem]
    follow_up_email: FollowUpEmail
    compliance_flags: list[str] = Field(
        description=(
            "Statements a compliance officer should review, each quoting or closely "
            "paraphrasing the transcript. Empty list if none."
        )
    )


class MeetingAnalysisResponse(MeetingAnalysis):
    model: str
