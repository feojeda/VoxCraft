"""Pronunciation dictionary REST endpoints.

Provides CRUD operations for pronunciation dictionary entries:
- POST /api/pronunciation — Create entry
- GET /api/pronunciation — List all entries
- DELETE /api/pronunciation/{entry_id} — Delete entry
"""

import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.models.pronunciation import PronunciationDict
from app.schemas.pronunciation import (
    PronunciationEntryRequest,
    PronunciationEntryResponse,
    PronunciationListResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/pronunciation", tags=["pronunciation"])


@router.post("", status_code=201, response_model=PronunciationEntryResponse)
async def create_entry(
    request: PronunciationEntryRequest,
    db: AsyncSession = Depends(get_db),
) -> PronunciationEntryResponse:
    """Create a new pronunciation dictionary entry.

    Rejects duplicate words (case-insensitive) with 409 Conflict.
    """
    # Check for existing word (case-insensitive)
    result = await db.execute(
        select(PronunciationDict).where(
            PronunciationDict.word.ilike(request.word)
        )
    )
    existing = result.scalar_one_or_none()
    if existing is not None:
        raise HTTPException(
            status_code=409,
            detail=f"Pronunciation entry for '{request.word}' already exists",
        )

    entry = PronunciationDict(
        word=request.word,
        replacement=request.replacement,
    )
    db.add(entry)
    await db.commit()
    await db.refresh(entry)

    logger.info("Created pronunciation entry: %s → %s", entry.word, entry.replacement)
    return PronunciationEntryResponse.model_validate(entry)


@router.get("", response_model=PronunciationListResponse)
async def list_entries(
    db: AsyncSession = Depends(get_db),
) -> PronunciationListResponse:
    """List all pronunciation dictionary entries ordered alphabetically."""
    result = await db.execute(
        select(PronunciationDict).order_by(PronunciationDict.word)
    )
    entries = result.scalars().all()
    return PronunciationListResponse(
        entries=[PronunciationEntryResponse.model_validate(e) for e in entries],
        total=len(entries),
    )


@router.delete("/{entry_id}", status_code=204)
async def delete_entry(
    entry_id: str,
    db: AsyncSession = Depends(get_db),
) -> None:
    """Delete a pronunciation dictionary entry."""
    entry = await db.get(PronunciationDict, entry_id)
    if entry is None:
        raise HTTPException(
            status_code=404,
            detail=f"Pronunciation entry '{entry_id}' not found",
        )

    await db.delete(entry)
    await db.commit()

    logger.info("Deleted pronunciation entry %s", entry_id)
