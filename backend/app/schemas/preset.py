"""Pydantic schemas for voice preset requests and responses.
"""

from datetime import datetime

from pydantic import BaseModel


class VoicePresetCreateRequest(BaseModel):
    """Request body for creating a voice preset."""

    name: str
    speed: float
    emotion_preset: str | None = None
    instruct: str | None = None


class VoicePresetResponse(BaseModel):
    """Public voice preset response."""

    id: str
    name: str
    speed: float
    emotion_preset: str | None
    instruct: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class VoicePresetListResponse(BaseModel):
    """Paginated list of voice presets."""

    presets: list[VoicePresetResponse]
    total: int
