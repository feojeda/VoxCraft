"""TTS generation endpoints.

POST /api/generate — Create a new TTS job (returns 202 with job_id).
GET /api/jobs/{job_id} — Poll job status and get audio URLs.
"""

import logging

from fastapi import APIRouter, HTTPException

from app.api.deps import get_db
from app.models.job import Job
from app.schemas.tts import TTSJobResponse, TTSRequest, JobStatusResponse
from app.services.job_manager import job_manager
from workers.engine.model_manager import VALID_SPEAKER_IDS
from workers.tasks.tts_generate import generate_speech

logger = logging.getLogger(__name__)

router = APIRouter(tags=["tts"])


@router.post("/generate", status_code=202, response_model=TTSJobResponse)
async def create_tts_job(request: TTSRequest) -> TTSJobResponse:
    """Create a new TTS generation job.

    Validates the request, creates a Job record in the database,
    dispatches a Celery task for async processing, and returns
    the job ID with 'queued' status.

    The actual TTS synthesis happens in the Celery worker.
    """
    # Validate speaker against known speaker list (per T-03-05)
    if request.speaker.lower().strip() not in VALID_SPEAKER_IDS:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Invalid speaker '{request.speaker}'. "
                f"Valid speakers: {sorted(VALID_SPEAKER_IDS)}"
            ),
        )

    # Create job record
    job = await job_manager.create_job(
        text=request.text,
        speaker=request.speaker.lower().strip(),
        language=request.language,
        speed=request.speed,
        instruct=request.instruct,
    )

    # Dispatch Celery task
    generate_speech.delay(
        job_id=job.id,
        text=request.text,
        speaker=request.speaker.lower().strip(),
        language=request.language,
        speed=request.speed,
    )

    logger.info("Dispatched TTS job %s: speaker=%s, text=%d chars", job.id, request.speaker, len(request.text))

    return TTSJobResponse(job_id=job.id, status="queued")


@router.get("/jobs/{job_id}", response_model=JobStatusResponse)
async def get_job_status(job_id: str) -> JobStatusResponse:
    """Get the current status of a TTS generation job.

    Returns status, progress percentage, and audio URLs when complete.
    """
    job = await job_manager.get_job(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail=f"Job '{job_id}' not found")

    # Build audio URLs from paths when job is completed
    response = JobStatusResponse.model_validate(job)

    return response
