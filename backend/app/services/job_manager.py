"""Job lifecycle manager.

Handles CRUD operations for TTS generation jobs using async SQLAlchemy
sessions: create, read, status updates, completion, and failure handling.
"""

import logging
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import async_session_factory
from app.models.job import Job

logger = logging.getLogger(__name__)


class JobManager:
    """Async job lifecycle manager for TTS generation tasks.

    All methods use async SQLAlchemy sessions. The Celery task creates
    its own sessions (not via FastAPI dependency injection) since it
    runs outside the request lifecycle.
    """

    async def create_job(
        self,
        text: str,
        mode: str = "speech",
        speaker: str | None = None,
        language: str = "auto",
        speed: float = 1.0,
        instruct: str | None = None,
        instructions: str | None = None,
        ref_audio: str | None = None,
        ref_text: str | None = None,
    ) -> Job:
        """Create a new TTS generation job in queued status.

        Args:
            text: Text to synthesize.
            mode: TTS mode — speech, voice-design, or voice-clone.
            speaker: Speaker identifier (for speech mode).
            language: Language name or 'auto'.
            speed: Speed multiplier (0.5-2.0).
            instruct: Optional style instruction (speech mode).
            instructions: Voice description (voice-design mode).
            ref_audio: Reference audio path/URL/base64 (voice-clone mode).
            ref_text: Transcript of reference audio (voice-clone mode).

        Returns:
            The created Job instance with generated ID.
        """
        job = Job(
            text=text,
            mode=mode,
            speaker=speaker,
            language=language,
            speed=speed,
            instruct=instruct,
            instructions=instructions,
            ref_audio=ref_audio,
            ref_text=ref_text,
            status="queued",
            progress=0,
        )
        async with async_session_factory() as session:
            session.add(job)
            await session.commit()
            await session.refresh(job)
        logger.info("Created job %s: mode=%s, text=%d chars", job.id, mode, len(text))
        return job

    async def get_job(self, job_id: str) -> Job | None:
        """Retrieve a job by ID.

        Args:
            job_id: The job's unique identifier.

        Returns:
            Job instance or None if not found.
        """
        async with async_session_factory() as session:
            result = await session.execute(select(Job).where(Job.id == job_id))
            return result.scalar_one_or_none()

    async def update_job_status(
        self,
        job_id: str,
        status: str,
        progress: int | None = None,
    ) -> None:
        """Update a job's status and optionally its progress.

        Args:
            job_id: The job's unique identifier.
            status: New status string (queued|processing|completed|failed).
            progress: Optional progress percentage (0-100).
        """
        async with async_session_factory() as session:
            result = await session.execute(select(Job).where(Job.id == job_id))
            job = result.scalar_one_or_none()
            if job is None:
                logger.warning("Attempted to update non-existent job %s", job_id)
                return
            job.status = status
            if progress is not None:
                job.progress = progress
            await session.commit()
        logger.info("Job %s → status=%s, progress=%s", job_id, status, progress)

    async def complete_job(
        self,
        job_id: str,
        wav_path: str,
        mp3_path: str,
    ) -> None:
        """Mark a job as completed with output audio file paths.

        Args:
            job_id: The job's unique identifier.
            wav_path: Path to the generated WAV file.
            mp3_path: Path to the generated MP3 file.
        """
        async with async_session_factory() as session:
            result = await session.execute(select(Job).where(Job.id == job_id))
            job = result.scalar_one_or_none()
            if job is None:
                logger.warning("Attempted to complete non-existent job %s", job_id)
                return
            job.status = "completed"
            job.progress = 100
            job.audio_wav_path = wav_path
            job.audio_mp3_path = mp3_path
            job.completed_at = datetime.utcnow()
            await session.commit()
        logger.info("Job %s completed: wav=%s, mp3=%s", job_id, wav_path, mp3_path)

    async def fail_job(self, job_id: str, error_message: str) -> None:
        """Mark a job as failed with an error message.

        Args:
            job_id: The job's unique identifier.
            error_message: Description of what went wrong.
        """
        async with async_session_factory() as session:
            result = await session.execute(select(Job).where(Job.id == job_id))
            job = result.scalar_one_or_none()
            if job is None:
                logger.warning("Attempted to fail non-existent job %s", job_id)
                return
            job.status = "failed"
            job.error_message = error_message
            await session.commit()
        logger.error("Job %s failed: %s", job_id, error_message)


# Module-level singleton for use by Celery tasks.
job_manager = JobManager()
