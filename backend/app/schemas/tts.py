"""Pydantic schemas for TTS generation requests and responses.

Validates user input for text-to-speech synthesis and defines
the shape of job status responses returned to the frontend.
"""

from datetime import datetime

from pydantic import BaseModel, Field


class TTSRequest(BaseModel):
    """Request body for creating a new TTS generation job.

    The text field has a maximum length of 50000 characters to prevent
    abuse (per threat model T-01-01). Speed is clamped between 0.5 and 2.0.
    """

    text: str = Field(..., min_length=1, max_length=50000, description="Text to synthesize")
    speaker: str = Field(..., description="Speaker name (e.g., 'ryan', 'serena')")
    language: str = Field(default="auto", description="Language or 'auto'")
    speed: float = Field(default=1.0, ge=0.5, le=2.0, description="Speed multiplier 0.5-2.0")
    instruct: str | None = Field(default=None, description="Natural language instruction for style/emotion")


class TTSJobResponse(BaseModel):
    """Response returned immediately after creating a TTS job (HTTP 202)."""

    job_id: str
    status: str

    model_config = {"from_attributes": True}


class JobStatusResponse(BaseModel):
    """Full job status response for polling endpoints.

    Includes progress percentage (0-100), audio URLs when complete,
    and error details on failure.
    """

    id: str
    status: str
    progress: int
    text: str
    language: str
    speaker: str
    speed: float
    instruct: str | None
    audio_wav_path: str | None
    audio_mp3_path: str | None
    error_message: str | None
    created_at: datetime | None
    completed_at: datetime | None

    model_config = {"from_attributes": True}
