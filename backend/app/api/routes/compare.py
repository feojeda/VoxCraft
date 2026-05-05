"""Voice comparison API endpoints.

Provides a playground to compare multiple voices with the same text.
POST /api/compare — Create a comparison batch (returns batch_id).
GET  /api/compare/{batch_id} — Get comparison results with audio URLs.
"""

import logging
from datetime import datetime
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.batch import BatchJob
from app.models.job import Job
from app.models.user import User
from app.models.voice import ClonedVoice
from app.schemas.compare import CompareRequest, CompareResponse, CompareJobItem
from app.services.job_manager import job_manager
from workers.engine.model_manager import SPEAKERS, VALID_SPEAKER_IDS
from workers.tasks.tts_generate import generate_speech
from workers.tasks.voice_clone import generate_voice_clone
from app.core.database import async_session_factory

logger = logging.getLogger(__name__)

router = APIRouter(tags=["compare"])


def _resolve_voice_name(speaker_id: str | None, cloned_voice: ClonedVoice | None) -> str:
    """Return a human-readable voice label."""
    if cloned_voice:
        return cloned_voice.name
    if speaker_id:
        for s in SPEAKERS:
            if s["id"] == speaker_id.lower().strip():
                return s["name"]
        return speaker_id
    return "Unknown"


@router.post("/compare", status_code=202, response_model=CompareResponse)
async def create_comparison(
    request: CompareRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CompareResponse:
    """Create a voice comparison batch.

    Generates one TTS job per voice configuration using the same text.
    Returns a batch_id for polling results.
    """
    # Pre-fetch cloned voices
    cloned_voices: dict[str, ClonedVoice] = {}
    result = await db.execute(
        select(ClonedVoice).where(
            (ClonedVoice.user_id == current_user.id) | (ClonedVoice.user_id.is_(None))
        )
    )
    for voice in result.scalars().all():
        cloned_voices[voice.id] = voice

    # Validate voice configs
    for idx, cfg in enumerate(request.voices):
        if cfg.mode == "speech":
            if not cfg.speaker or cfg.speaker.lower().strip() not in VALID_SPEAKER_IDS:
                raise HTTPException(
                    status_code=400,
                    detail=f"Voice #{idx + 1}: invalid speaker '{cfg.speaker}'",
                )
        elif cfg.mode == "voice-clone":
            if not cfg.cloned_voice_id:
                raise HTTPException(
                    status_code=400,
                    detail=f"Voice #{idx + 1}: cloned_voice_id is required for voice-clone mode",
                )
            if cfg.cloned_voice_id not in cloned_voices:
                raise HTTPException(
                    status_code=404,
                    detail=f"Voice #{idx + 1}: cloned voice '{cfg.cloned_voice_id}' not found",
                )
        elif cfg.mode == "voice-design":
            if not cfg.instructions:
                raise HTTPException(
                    status_code=400,
                    detail=f"Voice #{idx + 1}: instructions is required for voice-design mode",
                )

    # Create batch job
    batch = BatchJob(
        id=str(uuid4().hex[:16]),
        user_id=current_user.id,
        status="processing",
        total_items=len(request.voices),
        completed_count=0,
        failed_count=0,
    )
    db.add(batch)
    await db.commit()
    await db.refresh(batch)

    jobs: list[CompareJobItem] = []

    for cfg in request.voices:
        voice_name = _resolve_voice_name(cfg.speaker, cloned_voices.get(cfg.cloned_voice_id or ""))

        # Create job
        job = await job_manager.create_job(
            text=request.text,
            mode=cfg.mode,
            speaker=cfg.speaker.lower().strip() if cfg.speaker else None,
            language=request.language,
            speed=request.speed,
            instruct=cfg.instruct,
            instructions=cfg.instructions,
            user_id=current_user.id,
            voice_name=voice_name,
        )

        # Link to batch
        async with async_session_factory() as session:
            job_db = await session.get(Job, job.id)
            if job_db:
                job_db.batch_id = batch.id
                await session.commit()

        # Dispatch Celery task
        if cfg.mode == "voice-clone" and cfg.cloned_voice_id:
            generate_voice_clone.delay(
                job_id=job.id,
                text=request.text,
                voice_id=cfg.cloned_voice_id,
                language=request.language,
            )
        else:
            generate_speech.delay(
                job_id=job.id,
                text=request.text,
                mode=cfg.mode,
                speaker=cfg.speaker.lower().strip() if cfg.speaker else None,
                language=request.language,
                speed=request.speed,
                instruct=cfg.instruct,
                instructions=cfg.instructions,
                ref_audio=None,
                ref_text=None,
                emotion_preset=cfg.emotion_preset,
                pronunciation_enabled=False,
            )

        jobs.append(
            CompareJobItem(
                job_id=job.id,
                voice_name=voice_name,
                status=job.status,
                progress=0,
            )
        )
        logger.info(
            "Compare batch %s: dispatched job %s for voice %s",
            batch.id,
            job.id,
            voice_name,
        )

    return CompareResponse(
        batch_id=batch.id,
        jobs=jobs,
        total=len(jobs),
        completed_count=0,
        failed_count=0,
        status="processing",
        created_at=batch.created_at.isoformat() if batch.created_at else None,
    )


@router.get("/compare/{batch_id}", response_model=CompareResponse)
async def get_comparison(
    batch_id: str,
    current_user: User = Depends(get_current_user),
) -> CompareResponse:
    """Get the status and results of a voice comparison batch."""
    async with async_session_factory() as session:
        batch = await session.get(BatchJob, batch_id)
        if batch is None or batch.user_id != current_user.id:
            raise HTTPException(status_code=404, detail="Comparison batch not found")

        result = await session.execute(
            select(Job)
            .where(Job.batch_id == batch_id)
            .order_by(Job.created_at.asc())
        )
        jobs = result.scalars().all()

    jobs_response: list[CompareJobItem] = []
    for job in jobs:
        wav_url = f"/api/audio/{job.id}/wav" if job.audio_wav_path else None
        mp3_url = f"/api/audio/{job.id}/mp3" if job.audio_mp3_path else None
        jobs_response.append(
            CompareJobItem(
                job_id=job.id,
                voice_name=job.voice_name or job.speaker or "Unknown",
                status=job.status,
                progress=job.progress,
                audio_wav_url=wav_url,
                audio_mp3_url=mp3_url,
                error_message=job.error_message,
                created_at=job.created_at.isoformat() if job.created_at else None,
                completed_at=job.completed_at.isoformat() if job.completed_at else None,
            )
        )

    completed_count = sum(1 for j in jobs if j.status == "completed")
    failed_count = sum(1 for j in jobs if j.status == "failed")

    # Update batch counts if changed
    if batch.completed_count != completed_count or batch.failed_count != failed_count:
        async with async_session_factory() as session:
            batch_db = await session.get(BatchJob, batch_id)
            if batch_db:
                batch_db.completed_count = completed_count
                batch_db.failed_count = failed_count
                if completed_count + failed_count == batch_db.total_items:
                    batch_db.status = "completed" if failed_count == 0 else "failed"
                    if batch_db.completed_at is None:
                        batch_db.completed_at = datetime.utcnow()
                await session.commit()
        batch.completed_count = completed_count
        batch.failed_count = failed_count

    return CompareResponse(
        batch_id=batch.id,
        jobs=jobs_response,
        total=batch.total_items,
        completed_count=completed_count,
        failed_count=failed_count,
        status=batch.status,
        created_at=batch.created_at.isoformat() if batch.created_at else None,
        completed_at=batch.completed_at.isoformat() if batch.completed_at else None,
    )
