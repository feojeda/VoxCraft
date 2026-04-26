"""Pydantic schemas for batch processing endpoints."""

from datetime import datetime

from pydantic import BaseModel

from app.schemas.tts import JobStatusResponse


class BatchItemResponse(BaseModel):
    """Single item within a batch result."""

    job_id: str
    text: str
    voice_name: str | None
    status: str
    error_message: str | None
    audio_wav_url: str | None
    audio_mp3_url: str | None
    created_at: datetime
    completed_at: datetime | None


class BatchResponse(BaseModel):
    """Batch status and items response."""

    id: str
    status: str
    total_items: int
    completed_count: int
    failed_count: int
    created_at: datetime
    completed_at: datetime | None
    items: list[BatchItemResponse]


class BatchListItem(BaseModel):
    """Summary item for batch list view."""

    id: str
    status: str
    total_items: int
    completed_count: int
    failed_count: int
    created_at: datetime
    completed_at: datetime | None


class BatchListResponse(BaseModel):
    """Paginated batch list response."""

    items: list[BatchListItem]
    total: int


class BatchDownloadRequest(BaseModel):
    """ZIP download format selection."""

    format: str = "mp3"  # mp3 | both
