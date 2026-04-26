"""Audio file serving endpoints.

GET /api/audio/{job_id}/wav — Serve WAV audio file.
GET /api/audio/{job_id}/mp3 — Serve MP3 audio file.
"""

import logging
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse

from app.api.deps import get_current_user
from app.models.user import User
from app.services.job_manager import job_manager
from app.services.share_service import share_service

logger = logging.getLogger(__name__)

router = APIRouter(tags=["audio"])


@router.get("/audio/{job_id}/wav")
async def serve_wav(
    job_id: str,
    current_user: User = Depends(get_current_user),
) -> FileResponse:
    """Serve the WAV audio file for a completed job.

    Returns 404 if the job doesn't exist, isn't completed, or the file
    is missing from disk.
    """
    job = await job_manager.get_job(job_id)
    if job is None or job.user_id != current_user.id:
        raise HTTPException(status_code=404, detail=f"Job '{job_id}' not found")
    if job.status != "completed":
        raise HTTPException(
            status_code=404,
            detail=f"Job '{job_id}' is not completed (status: {job.status})",
        )
    if not job.audio_wav_path:
        raise HTTPException(status_code=404, detail="WAV file path not available")

    wav_path = Path(job.audio_wav_path)
    if not wav_path.exists():
        raise HTTPException(status_code=404, detail="WAV file not found on disk")

    return FileResponse(
        path=str(wav_path),
        media_type="audio/wav",
        filename=f"{job_id}.wav",
    )


@router.get("/audio/{job_id}/mp3")
async def serve_mp3(
    job_id: str,
    current_user: User = Depends(get_current_user),
) -> FileResponse:
    """Serve the MP3 audio file for a completed job.

    Returns 404 if the job doesn't exist, isn't completed, or the file
    is missing from disk.
    """
    job = await job_manager.get_job(job_id)
    if job is None or job.user_id != current_user.id:
        raise HTTPException(status_code=404, detail=f"Job '{job_id}' not found")
    if job.status != "completed":
        raise HTTPException(
            status_code=404,
            detail=f"Job '{job_id}' is not completed (status: {job.status})",
        )
    if not job.audio_mp3_path:
        raise HTTPException(status_code=404, detail="MP3 file path not available")

    mp3_path = Path(job.audio_mp3_path)
    if not mp3_path.exists():
        raise HTTPException(status_code=404, detail="MP3 file not found on disk")

    return FileResponse(
        path=str(mp3_path),
        media_type="audio/mpeg",
        filename=f"{job_id}.mp3",
    )


@router.get("/audio/share/{token}/wav")
async def serve_shared_wav(token: str) -> FileResponse:
    """Serve WAV audio for a public share link (no auth required)."""
    share = await share_service.get_share_by_token(token)
    if share is None:
        raise HTTPException(status_code=404, detail="Share link not found or expired")
    job = await job_manager.get_job(share.job_id)
    if job is None or job.status != "completed" or not job.audio_wav_path:
        raise HTTPException(status_code=404, detail="Audio not available")
    wav_path = Path(job.audio_wav_path)
    if not wav_path.exists():
        raise HTTPException(status_code=404, detail="Audio file not found")
    return FileResponse(
        path=str(wav_path),
        media_type="audio/wav",
        filename=f"{share.token}.wav",
    )


@router.get("/audio/share/{token}/mp3")
async def serve_shared_mp3(token: str) -> FileResponse:
    """Serve MP3 audio for a public share link (no auth required)."""
    share = await share_service.get_share_by_token(token)
    if share is None:
        raise HTTPException(status_code=404, detail="Share link not found or expired")
    job = await job_manager.get_job(share.job_id)
    if job is None or job.status != "completed" or not job.audio_mp3_path:
        raise HTTPException(status_code=404, detail="Audio not available")
    mp3_path = Path(job.audio_mp3_path)
    if not mp3_path.exists():
        raise HTTPException(status_code=404, detail="Audio file not found")
    return FileResponse(
        path=str(mp3_path),
        media_type="audio/mpeg",
        filename=f"{share.token}.mp3",
    )
