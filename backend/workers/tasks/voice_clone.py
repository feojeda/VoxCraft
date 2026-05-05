"""Celery task for cloned voice generation.

Processes voice clone jobs: fetches the cloned voice from the database,
calls the TTS engine with the reference audio, and saves output audio.
"""

import asyncio
import logging

from workers.celery_app import celery_app
from workers.engine.model_manager import get_model_manager

logger = logging.getLogger(__name__)


@celery_app.task(bind=True, name="workers.tasks.voice_clone")
def generate_voice_clone(
    self,
    job_id: str,
    text: str,
    voice_id: str,
    language: str = "auto",
    x_vector_only_mode: bool = False,
) -> None:
    """Celery task: generate speech using a cloned voice.

    Args:
        self: Bound Celery task instance.
        job_id: The job's unique identifier.
        text: Text to synthesize.
        voice_id: ID of the cloned voice to use.
        language: Language name or 'auto'.
        x_vector_only_mode: Copy only timbre for cross-lingual voice clone.
    """
    # Import here to avoid circular imports at module level
    from app.services.audio_service import audio_service
    from app.services.job_manager import job_manager

    async def _run() -> None:
        from sqlalchemy import select

        from app.core.database import async_session_factory
        from app.models.voice import ClonedVoice

        # Step 1: Mark as processing
        await job_manager.update_job_status(job_id, "processing", progress=0)

        # Step 2: Fetch cloned voice from DB
        async with async_session_factory() as session:
            result = await session.execute(
                select(ClonedVoice).where(ClonedVoice.id == voice_id)
            )
            voice = result.scalar_one_or_none()

        if voice is None:
            await job_manager.fail_job(job_id, f"Cloned voice '{voice_id}' not found")
            logger.error("Job %s: cloned voice %s not found", job_id, voice_id)
            return

        # Step 3: Get engine and generate
        model_manager = get_model_manager()
        engine = model_manager.get_engine()

        # Use cached prompt if available (avoids sending audio every time)
        if voice.voice_clone_prompt_b64:
            result = engine.synthesize_voice_clone_with_prompt(
                text=text,
                voice_clone_prompt_b64=voice.voice_clone_prompt_b64,
                language=language,
            )
        else:
            result = engine.synthesize_voice_clone(
                text=text,
                ref_audio=voice.audio_path,
                ref_text=voice.ref_text,
                language=language,
                x_vector_only_mode=voice.x_vector_only_mode,
            )

        await job_manager.update_job_status(job_id, "processing", progress=50)

        # Step 4: Save WAV
        wav_path = audio_service.save_wav(result.audio, result.sample_rate, job_id)

        # Step 5: Convert to MP3
        mp3_path = audio_service.convert_to_mp3(wav_path, job_id)

        # Step 6: Mark as completed
        await job_manager.complete_job(job_id, str(wav_path), str(mp3_path))
        logger.info(
            "Job %s: voice clone completed using voice %s",
            job_id,
            voice_id,
        )

    try:
        asyncio.run(_run())
    except Exception as e:
        logger.exception("Job %s: voice clone failed", job_id)
        try:
            asyncio.run(job_manager.fail_job(job_id, str(e)))
        except Exception as fail_err:
            logger.error("Job %s: also failed to record failure: %s", job_id, fail_err)
