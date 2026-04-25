"""Celery task for TTS speech generation.

Processes TTS jobs: loads the engine via ModelManager, splits long text
into chunks, synthesizes each chunk, concatenates audio, saves WAV/MP3,
and updates job status throughout the lifecycle.
"""

import asyncio
import logging
import re
from typing import TYPE_CHECKING

from workers.celery_app import celery_app
from workers.engine.model_manager import get_model_manager, speed_to_instruct

if TYPE_CHECKING:
    import numpy as np

logger = logging.getLogger(__name__)


def split_text(text: str, max_chars: int = 400) -> list[str]:
    """Split text into chunks at sentence boundaries.

    Tries three levels of splitting in order:
    1. Sentence boundaries (.!?)
    2. Comma/semicolon boundaries
    3. Hard split at max_chars

    Args:
        text: The text to split.
        max_chars: Maximum characters per chunk (default 400).

    Returns:
        List of non-empty text chunks.
    """
    if not text or not text.strip():
        return []

    text = text.strip()

    # If text fits in one chunk, return it directly
    if len(text) <= max_chars:
        return [text]

    chunks: list[str] = []
    current_chunk = ""

    # First try: split at sentence boundaries (.!?)
    sentences = re.split(r"(?<=[.!?])\s+", text)

    for sentence in sentences:
        if not sentence.strip():
            continue

        # If adding this sentence would exceed max_chars
        if current_chunk and len(current_chunk) + len(sentence) + 1 > max_chars:
            chunks.append(current_chunk.strip())
            current_chunk = sentence
        else:
            if current_chunk:
                current_chunk += " " + sentence
            else:
                current_chunk = sentence

    if current_chunk.strip():
        chunks.append(current_chunk.strip())

    # Handle any chunk that's still too long — split at commas/semicolons
    final_chunks: list[str] = []
    for chunk in chunks:
        if len(chunk) <= max_chars:
            final_chunks.append(chunk)
        else:
            # Split at comma/semicolon
            sub_parts = re.split(r"(?<=[,;])\s+", chunk)
            sub_chunk = ""
            for part in sub_parts:
                if not part.strip():
                    continue
                if sub_chunk and len(sub_chunk) + len(part) + 1 > max_chars:
                    final_chunks.append(sub_chunk.strip())
                    sub_chunk = part
                else:
                    if sub_chunk:
                        sub_chunk += " " + part
                    else:
                        sub_chunk = part
            if sub_chunk.strip():
                final_chunks.append(sub_chunk.strip())

    # Handle any chunk that's STILL too long — hard split
    result: list[str] = []
    for chunk in final_chunks:
        if len(chunk) <= max_chars:
            result.append(chunk)
        else:
            for i in range(0, len(chunk), max_chars):
                part = chunk[i : i + max_chars].strip()
                if part:
                    result.append(part)

    return [c for c in result if c.strip()]


@celery_app.task(bind=True, name="workers.tasks.tts_generate")
def generate_speech(
    self,
    job_id: str,
    text: str,
    speaker: str,
    language: str,
    speed: float,
) -> None:
    """Celery task: synthesize speech for a TTS job.

    Processes the job through the full pipeline:
    1. Update status to processing
    2. Split long text into chunks
    3. Synthesize each chunk via QwenTTSEngine
    4. Concatenate audio segments
    5. Save WAV and convert to MP3
    6. Mark job as completed (or failed on error)

    Args:
        self: Bound Celery task instance (for progress updates).
        job_id: The job's unique identifier.
        text: Text to synthesize.
        speaker: Speaker ID (e.g., 'ryan').
        language: Language name or 'auto'.
        speed: Speed multiplier (0.5-2.0).
    """
    # Import here to avoid circular imports and GPU-only deps at module level
    from app.services.audio_service import audio_service
    from app.services.job_manager import job_manager

    async def _run() -> None:
        # Step 1: Mark as processing
        await job_manager.update_job_status(job_id, "processing", progress=0)

        # Step 2: Get engine and compute instruct from speed
        model_manager = get_model_manager()
        engine = model_manager.get_engine()
        instruct = speed_to_instruct(speed)

        # Step 3: Split text into chunks
        chunks = split_text(text, max_chars=400)
        logger.info(
            "Job %s: processing %d chunks for %d chars",
            job_id,
            len(chunks),
            len(text),
        )

        # Step 4: Synthesize each chunk
        audio_segments: list["np.ndarray"] = []
        total_chunks = len(chunks)

        for i, chunk in enumerate(chunks):
            logger.info("Job %s: synthesizing chunk %d/%d", job_id, i + 1, total_chunks)

            result = engine.synthesize(
                text=chunk,
                speaker=speaker,
                language=language,
                instruct=instruct,
            )
            audio_segments.append(result.audio)

            # Update progress: 10% for setup, 80% for synthesis, 10% for saving
            progress = int(10 + (i + 1) / total_chunks * 80)
            await job_manager.update_job_status(job_id, "processing", progress=progress)

        # Step 5: Concatenate audio segments
        if not audio_segments:
            raise ValueError("No audio segments produced")

        import numpy as np

        final_audio = np.concatenate(audio_segments)

        # Step 6: Save WAV
        wav_path = audio_service.save_wav(final_audio, result.sample_rate, job_id)

        # Step 7: Convert to MP3
        mp3_path = audio_service.convert_to_mp3(wav_path, job_id)

        # Step 8: Mark as completed
        await job_manager.complete_job(job_id, str(wav_path), str(mp3_path))
        logger.info("Job %s: completed successfully", job_id)

    try:
        # Run the async function from synchronous Celery task context
        asyncio.run(_run())
    except ImportError as e:
        # Handle missing GPU/ML libraries gracefully
        logger.error("Job %s: import error — %s", job_id, e)
        asyncio.run(job_manager.fail_job(job_id, f"Server configuration error: {e}"))
    except Exception as e:
        logger.exception("Job %s: failed with error", job_id)
        try:
            asyncio.run(job_manager.fail_job(job_id, str(e)))
        except Exception as fail_err:
            logger.error("Job %s: also failed to record failure: %s", job_id, fail_err)
