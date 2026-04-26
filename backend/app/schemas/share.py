"""Pydantic schemas for share link endpoints."""

from datetime import datetime

from pydantic import BaseModel


class ShareCreateRequest(BaseModel):
    """Request to create a share link for a completed job."""

    job_id: str
    expires_at: datetime | None = None


class ShareResponse(BaseModel):
    """Share link details."""

    id: str
    token: str
    job_id: str
    created_at: datetime
    expires_at: datetime | None
    revoked_at: datetime | None
    is_active: bool
    share_url: str


class ShareListResponse(BaseModel):
    """Paginated share link list."""

    items: list[ShareResponse]
    total: int


class SharePublicResponse(BaseModel):
    """Public share page metadata (no auth required)."""

    token: str
    text: str
    voice_name: str | None
    audio_wav_url: str | None
    audio_mp3_url: str | None
    created_at: datetime
