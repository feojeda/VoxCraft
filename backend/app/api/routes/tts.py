"""TTS generation endpoints.

POST /api/generate — Create a new TTS job (returns 202 with job_id).
GET /api/jobs/{job_id} — Poll job status and get audio URLs.
"""

import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.job import Job
from app.models.user import User
from app.models.voice import ClonedVoice
from app.schemas.tts import TTSJobResponse, TTSRequest, JobStatusResponse
from app.services.job_manager import job_manager
from workers.engine.model_manager import SPEAKERS, VALID_SPEAKER_IDS
from workers.tasks.tts_generate import generate_speech
from workers.tasks.voice_clone import generate_voice_clone

logger = logging.getLogger(__name__)

router = APIRouter(tags=["tts"])


def _resolve_voice_name(request: TTSRequest, cloned_voice: ClonedVoice | None) -> str:
    """Compute a human-readable voice label for history display."""
    if request.cloned_voice_id and cloned_voice:
        return cloned_voice.name
    if request.speaker:
        # Look up friendly name from SPEAKERS catalog
        for s in SPEAKERS:
            if s["id"] == request.speaker.lower().strip():
                return s["name"]
        return request.speaker
    if request.mode == "voice-design":
        return "Custom Voice"
    if request.mode == "voice-clone":
        return "Cloned Voice"
    return "Unknown"


@router.post("/generate", status_code=202, response_model=TTSJobResponse)
async def create_tts_job(
    request: TTSRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> TTSJobResponse:
    """Create a new TTS generation job.

    Validates the request, creates a Job record in the database,
    dispatches a Celery task for async processing, and returns
    the job ID with 'queued' status.

    Supports:
    - speech: Use predefined speakers
    - voice-design: Create a voice from text description
    - voice-clone: Clone from reference audio (legacy) or persisted cloned voice
    """
    cloned_voice = None

    # Validate voice source
    if request.cloned_voice_id:
        # Verify cloned voice exists and is owned by user
        cloned_voice = await db.get(ClonedVoice, request.cloned_voice_id)
        if cloned_voice is None:
            raise HTTPException(
                status_code=404,
                detail=f"Cloned voice '{request.cloned_voice_id}' not found",
            )
        if cloned_voice.user_id and cloned_voice.user_id != current_user.id:
            raise HTTPException(status_code=404, detail="Cloned voice not found")
    elif request.mode == "speech":
        if not request.speaker:
            raise HTTPException(status_code=400, detail="speaker is required for speech mode")
        if request.speaker.lower().strip() not in VALID_SPEAKER_IDS:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Invalid speaker '{request.speaker}'. "
                    f"Valid speakers: {sorted(VALID_SPEAKER_IDS)}"
                ),
            )
    elif request.mode == "voice-design":
        if not request.instructions:
            raise HTTPException(
                status_code=400,
                detail="instructions is required for voice-design mode",
            )
    elif request.mode == "voice-clone":
        if not request.ref_audio:
            raise HTTPException(
                status_code=400,
                detail="ref_audio is required for voice-clone mode",
            )

    voice_name = _resolve_voice_name(request, cloned_voice)

    # Create job record
    job = await job_manager.create_job(
        text=request.text,
        mode="voice_clone" if request.cloned_voice_id else request.mode,
        speaker=request.speaker.lower().strip() if request.speaker else None,
        language=request.language,
        speed=request.speed,
        instruct=request.instruct,
        instructions=request.instructions,
        ref_audio=request.ref_audio,
        ref_text=request.ref_text,
        user_id=current_user.id,
        voice_name=voice_name,
    )

    # Dispatch appropriate Celery task
    if request.cloned_voice_id:
        generate_voice_clone.delay(
            job_id=job.id,
            text=request.text,
            voice_id=request.cloned_voice_id,
            language=request.language,
        )
        logger.info(
            "Dispatched voice clone job %s: voice_id=%s, text=%d chars",
            job.id,
            request.cloned_voice_id,
            len(request.text),
        )
    else:
        generate_speech.delay(
            job_id=job.id,
            text=request.text,
            mode=request.mode,
            speaker=request.speaker.lower().strip() if request.speaker else None,
            language=request.language,
            speed=request.speed,
            instruct=request.instruct,
            instructions=request.instructions,
            ref_audio=request.ref_audio,
            ref_text=request.ref_text,
            emotion_preset=request.emotion_preset,
            pronunciation_enabled=request.pronunciation_enabled,
        )
        logger.info(
            "Dispatched TTS job %s: mode=%s, text=%d chars",
            job.id,
            request.mode,
            len(request.text),
        )

    return TTSJobResponse(job_id=job.id, status="queued")


@router.get("/jobs/{job_id}", response_model=JobStatusResponse)
async def get_job_status(
    job_id: str,
    current_user: User = Depends(get_current_user),
) -> JobStatusResponse:
    """Get the current status of a TTS generation job.

    Returns status, progress percentage, and audio URLs when complete.
    """
    job = await job_manager.get_job(job_id)
    if job is None or job.user_id != current_user.id:
        raise HTTPException(status_code=404, detail=f"Job '{job_id}' not found")

    # Build audio URLs from paths when job is completed
    wav_url = f"/api/audio/{job.id}/wav" if job.audio_wav_path else None
    mp3_url = f"/api/audio/{job.id}/mp3" if job.audio_mp3_path else None

    response = JobStatusResponse(
        id=job.id,
        status=job.status,
        progress=job.progress,
        text=job.text,
        mode=job.mode,
        language=job.language,
        speaker=job.speaker,
        speed=job.speed,
        instruct=job.instruct,
        instructions=job.instructions,
        ref_audio=job.ref_audio,
        ref_text=job.ref_text,
        audio_wav_url=wav_url,
        audio_mp3_url=mp3_url,
        error_message=job.error_message,
        created_at=job.created_at,
        completed_at=job.completed_at,
    )

    return response
