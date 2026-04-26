"""Celery task for TTS speech generation.

Processes TTS jobs: routes to the correct engine method based on mode,
synthesizes audio, saves WAV/MP3, and updates job status.
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
    mode: str,
    speaker: str | None,
    language: str,
    speed: float,
    instruct: str | None,
    instructions: str | None,
    ref_audio: str | None,
    ref_text: str | None,
) -> None:
    """Celery task: synthesize speech for a TTS job.

    Routes to the correct synthesis method based on mode:
    - speech: predefined speaker
    - voice-design: create voice from description
    - voice-clone: clone from reference audio

    Args:
        self: Bound Celery task instance (for progress updates).
        job_id: The job's unique identifier.
        text: Text to synthesize.
        mode: TTS mode — speech, voice-design, or voice-clone.
        speaker: Speaker ID for speech mode.
        language: Language name or 'auto'.
        speed: Speed multiplier (0.5-2.0).
        instruct: Style instruction for speech mode.
        instructions: Voice description for voice-design mode.
        ref_audio: Reference audio for voice-clone mode.
        ref_text: Transcript of reference audio.
    """
    # Import here to avoid circular imports at module level
    from app.services.audio_service import audio_service
    from app.services.job_manager import job_manager

    async def _run() -> None:
        # Step 1: Mark as processing
        await job_manager.update_job_status(job_id, "processing", progress=0)

        # Step 2: Get engine
        model_manager = get_model_manager()
        engine = model_manager.get_engine()

        # Step 3: Route to correct method based on mode
        if mode == "speech":
            instruct_val = instruct or speed_to_instruct(speed)
            result = engine.synthesize(
                text=text,
                speaker=speaker or "ryan",
                language=language,
                instruct=instruct_val,
            )
        elif mode == "voice-design":
            if not instructions:
                raise ValueError("instructions is required for voice-design mode")
            result = engine.synthesize_voice_design(
                text=text,
                instructions=instructions,
                language=language,
            )
        elif mode == "voice-clone":
            if not ref_audio:
                raise ValueError("ref_audio is required for voice-clone mode")
            result = engine.synthesize_voice_clone(
                text=text,
                ref_audio=ref_audio,
                ref_text=ref_text,
                language=language,
            )
        else:
            raise ValueError(f"Unknown mode: {mode}")

        await job_manager.update_job_status(job_id, "processing", progress=50)

        # Step 4: Save WAV
        wav_path = audio_service.save_wav(result.audio, result.sample_rate, job_id)

        # Step 5: Convert to MP3
        mp3_path = audio_service.convert_to_mp3(wav_path, job_id)

        # Step 6: Mark as completed
        await job_manager.complete_job(job_id, str(wav_path), str(mp3_path))
        logger.info("Job %s: completed successfully", job_id)

    try:
        # Run the async function from synchronous Celery task context
        asyncio.run(_run())
    except ImportError as e:
        # Handle missing dependencies gracefully
        logger.error("Job %s: import error — %s", job_id, e)
        asyncio.run(job_manager.fail_job(job_id, f"Server configuration error: {e}"))
    except Exception as e:
        logger.exception("Job %s: failed with error", job_id)
        try:
            asyncio.run(job_manager.fail_job(job_id, str(e)))
        except Exception as fail_err:
            logger.error("Job %s: also failed to record failure: %s", job_id, fail_err)
