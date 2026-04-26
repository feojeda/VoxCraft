"""Pydantic schemas for pronunciation dictionary requests and responses."""

from datetime import datetime

from pydantic import BaseModel, Field


class PronunciationEntryRequest(BaseModel):
    """Request body for creating a pronunciation dictionary entry."""

    word: str = Field(..., min_length=1, max_length=100, description="Word to replace")
    replacement: str = Field(..., min_length=1, max_length=100, description="Replacement text")


class PronunciationEntryResponse(BaseModel):
    """Response model for a single pronunciation entry."""

    id: str
    word: str
    replacement: str
    created_at: datetime

    model_config = {"from_attributes": True}


class PronunciationListResponse(BaseModel):
    """Response model for listing pronunciation entries."""

    entries: list[PronunciationEntryResponse]
    total: int

    model_config = {"from_attributes": True}
