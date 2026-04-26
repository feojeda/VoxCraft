"""Generation history endpoints.

Provides list and delete operations for a user's TTS generation jobs.
"""

import logging
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.job import Job
from app.models.user import User
from app.schemas.history import HistoryItemResponse, HistoryListResponse

logger = logging.getLogger(__name__)

router = APIRouter(tags=["history"])


def _build_audio_urls(job: Job) -> tuple[str | None, str | None]:
    """Build relative audio URLs from job file paths."""
    wav_url = f"/api/audio/{job.id}/wav" if job.audio_wav_path else None
    mp3_url = f"/api/audio/{job.id}/mp3" if job.audio_mp3_path else None
    return wav_url, mp3_url


@router.get("/history", response_model=HistoryListResponse)
async def list_history(
    skip: int = 0,
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> HistoryListResponse:
    """List the authenticated user's generation history.

    Returns paginated jobs ordered by creation date (newest first).
    """
    # Count total
    count_result = await db.execute(
        select(Job).where(Job.user_id == current_user.id)
    )
    total = len(count_result.scalars().all())

    # Fetch paginated items
    result = await db.execute(
        select(Job)
        .where(Job.user_id == current_user.id)
        .order_by(Job.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    jobs = result.scalars().all()

    items: list[HistoryItemResponse] = []
    for job in jobs:
        wav_url, mp3_url = _build_audio_urls(job)
        items.append(
            HistoryItemResponse(
                id=job.id,
                text=job.text,
                voice_name=job.voice_name,
                status=job.status,
                mode=job.mode,
                speed=job.speed,
                created_at=job.created_at,
                completed_at=job.completed_at,
                audio_wav_url=wav_url,
                audio_mp3_url=mp3_url,
                error_message=job.error_message,
            )
        )

    return HistoryListResponse(items=items, total=total)


@router.get("/history/{job_id}", response_model=HistoryItemResponse)
async def get_history_item(
    job_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> HistoryItemResponse:
    """Get a single history item by ID."""
    job = await db.get(Job, job_id)
    if job is None or job.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Job not found")

    wav_url, mp3_url = _build_audio_urls(job)
    return HistoryItemResponse(
        id=job.id,
        text=job.text,
        voice_name=job.voice_name,
        status=job.status,
        mode=job.mode,
        speed=job.speed,
        created_at=job.created_at,
        completed_at=job.completed_at,
        audio_wav_url=wav_url,
        audio_mp3_url=mp3_url,
        error_message=job.error_message,
    )


@router.delete("/history/{job_id}", status_code=204)
async def delete_history(
    job_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    """Delete a history item and its associated audio files."""
    job = await db.get(Job, job_id)
    if job is None or job.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Job not found")

    # Remove audio files from disk if they exist
    if job.audio_wav_path:
        try:
            Path(job.audio_wav_path).unlink(missing_ok=True)
        except Exception as e:
            logger.warning("Failed to delete WAV file for job %s: %s", job_id, e)

    if job.audio_mp3_path:
        try:
            Path(job.audio_mp3_path).unlink(missing_ok=True)
        except Exception as e:
            logger.warning("Failed to delete MP3 file for job %s: %s", job_id, e)

    await db.delete(job)
    await db.commit()

    logger.info("Deleted history item %s for user %s", job_id, current_user.id)
