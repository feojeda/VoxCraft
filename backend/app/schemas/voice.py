"""Pydantic schemas for voice management requests and responses."""

from datetime import datetime

from pydantic import BaseModel, Field


class VoiceCreateRequest(BaseModel):
    """Request body for creating a new cloned voice.

    Audio file is uploaded as multipart/form-data separately.
    ref_text is the transcript of the reference audio.
    """

    name: str = Field(..., min_length=1, max_length=100, description="Display name for the voice")
    ref_text: str = Field(..., min_length=1, max_length=5000, description="Transcript of the reference audio")


class VoiceUpdateRequest(BaseModel):
    """Request body for renaming a cloned voice."""

    name: str = Field(..., min_length=1, max_length=100, description="New display name")


class VoiceResponse(BaseModel):
    """Response model for a single cloned voice."""

    id: str
    name: str
    audio_path: str
    ref_text: str
    duration_seconds: float
    sample_rate: int
    voice_clone_prompt_b64: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class VoiceListResponse(BaseModel):
    """Response model for listing cloned voices."""

    voices: list[VoiceResponse]
    total: int

    model_config = {"from_attributes": True}
