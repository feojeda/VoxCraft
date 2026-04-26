"""Pydantic schemas for generation history responses.

Defines the shape of history list and item responses returned to the frontend.
"""

from datetime import datetime

from pydantic import BaseModel


class HistoryItemResponse(BaseModel):
    """Single generation history item."""

    id: str
    text: str
    voice_name: str | None
    status: str
    mode: str
    speed: float
    created_at: datetime | None
    completed_at: datetime | None
    audio_wav_url: str | None
    audio_mp3_url: str | None
    error_message: str | None

    model_config = {"from_attributes": True}


class HistoryListResponse(BaseModel):
    """Paginated list of generation history items."""

    items: list[HistoryItemResponse]
    total: int
