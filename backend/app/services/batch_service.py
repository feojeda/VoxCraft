"""Batch processing service for CSV upload and ZIP generation.

Handles the full batch lifecycle: CSV parsing, per-row job creation
with Celery dispatch, batch status tracking, and on-demand ZIP
streaming with manifest.
"""

import csv
import io
import logging
import os
import re
import zipfile
from datetime import datetime

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import async_session_factory
from app.models.batch import BatchJob
from app.models.job import Job
from app.models.voice import ClonedVoice
from app.services.job_manager import job_manager
from workers.engine.model_manager import SPEAKERS, VALID_SPEAKER_IDS
from workers.tasks.tts_generate import generate_speech
from workers.tasks.voice_clone import generate_voice_clone

logger = logging.getLogger(__name__)

MAX_BATCH_ROWS = 100


def parse_csv_rows(file_content: bytes) -> list[dict]:
    """Parse a two-column CSV into a list of dicts.

    Validates headers and enforces the maximum row limit.

    Args:
        file_content: Raw CSV file bytes.

    Returns:
        List of dicts with ``text`` and ``voice`` keys.

    Raises:
        ValueError: If headers are malformed or row count exceeds the limit.
    """
    text = file_content.decode("utf-8-sig")
    reader = csv.DictReader(text.splitlines())

    if reader.fieldnames is None:
        raise ValueError("CSV has no header row.")

    # Normalise headers: lower-case, stripped
    headers = [h.strip().lower() for h in reader.fieldnames]
    if headers != ["text", "voice"]:
        raise ValueError(
            f"CSV headers must be exactly 'text,voice' (got: {','.join(reader.fieldnames)})"
        )

    rows = list(reader)
    if len(rows) > MAX_BATCH_ROWS:
        raise ValueError(
            f"Batch upload exceeds maximum of {MAX_BATCH_ROWS} rows (got {len(rows)})."
        )

    return rows


def _sanitize_filename(text: str) -> str:
    """Create a safe filename preview from text.

    Takes the first 20 characters, lowercases, strips whitespace,
    and replaces non-alphanumeric characters with underscores.
    """
    preview = text.strip()[:20].lower()
    preview = re.sub(r"[^a-z0-9]", "_", preview)
    preview = re.sub(r"_+", "_", preview).strip("_")
    return preview or "untitled"


def _resolve_voice_name(speaker_id: str, cloned_voice: ClonedVoice | None) -> str:
    """Return a human-readable voice label."""
    if cloned_voice:
        return cloned_voice.name
    for s in SPEAKERS:
        if s["id"] == speaker_id.lower().strip():
            return s["name"]
    return speaker_id


class BatchService:
    """Orchestrates CSV batch upload, job creation, and ZIP download."""

    async def create_batch(
        self,
        user_id: str,
        rows: list[dict],
        speed: float = 1.0,
        instruct: str | None = None,
        emotion_preset: str | None = None,
    ) -> BatchJob:
        """Create a batch job and individual jobs for each CSV row.

        Invalid rows are created as immediately-failed jobs so they
        still appear in the batch results with descriptive errors.

        Args:
            user_id: Owner of the batch.
            rows: Parsed CSV rows (list of dicts with ``text`` and ``voice``).
            speed: Speech speed multiplier.
            instruct: Optional style instruction.
            emotion_preset: Optional emotion preset for prosody control.

        Returns:
            The created ``BatchJob`` instance.
        """
        # Pre-fetch cloned voices for this user to avoid N+1 queries
        cloned_voices: dict[str, ClonedVoice] = {}
        async with async_session_factory() as session:
            result = await session.execute(
                select(ClonedVoice).where(
                    (ClonedVoice.user_id == user_id) | (ClonedVoice.user_id.is_(None))
                )
            )
            for voice in result.scalars().all():
                cloned_voices[voice.id] = voice

        batch_job = BatchJob(
            user_id=user_id,
            status="processing",
            total_items=len(rows),
            completed_count=0,
            failed_count=0,
        )
        async with async_session_factory() as session:
            session.add(batch_job)
            await session.commit()
            await session.refresh(batch_job)

        failed_count = 0
        for idx, row in enumerate(rows):
            row_text = row.get("text", "").strip()
            row_voice = row.get("voice", "").strip()

            # Validate text
            if not row_text:
                failed_count += 1
                job = await job_manager.create_job(
                    text="",
                    mode="speech",
                    speaker=row_voice or None,
                    user_id=user_id,
                    voice_name=row_voice or "Unknown",
                    speed=speed,
                    instruct=instruct,
                )
                # Link to batch and mark failed immediately
                async with async_session_factory() as session:
                    job_db = await session.get(Job, job.id)
                    if job_db:
                        job_db.batch_id = batch_job.id
                        job_db.status = "failed"
                        job_db.error_message = "Empty text field in CSV row."
                        await session.commit()
                continue

            # Validate voice
            voice_lower = row_voice.lower().strip()
            cloned_voice = cloned_voices.get(row_voice) if row_voice else None
            is_valid_speaker = voice_lower in VALID_SPEAKER_IDS

            if not is_valid_speaker and cloned_voice is None:
                failed_count += 1
                job = await job_manager.create_job(
                    text=row_text,
                    mode="speech",
                    speaker=row_voice or None,
                    user_id=user_id,
                    voice_name=row_voice or "Unknown",
                    speed=speed,
                    instruct=instruct,
                )
                async with async_session_factory() as session:
                    job_db = await session.get(Job, job.id)
                    if job_db:
                        job_db.batch_id = batch_job.id
                        job_db.status = "failed"
                        job_db.error_message = (
                            f"Invalid voice '{row_voice}'. "
                            f"Must be a predefined speaker or a valid cloned voice ID."
                        )
                        await session.commit()
                continue

            # Valid row — create job and dispatch Celery task
            voice_name = _resolve_voice_name(row_voice, cloned_voice)
            job = await job_manager.create_job(
                text=row_text,
                mode="speech",
                speaker=row_voice if is_valid_speaker else None,
                user_id=user_id,
                voice_name=voice_name,
                speed=speed,
                instruct=instruct,
            )

            # Link job to batch
            async with async_session_factory() as session:
                job_db = await session.get(Job, job.id)
                if job_db:
                    job_db.batch_id = batch_job.id
                    await session.commit()

            # Dispatch appropriate Celery task
            if cloned_voice:
                generate_voice_clone.delay(
                    job_id=job.id,
                    text=row_text,
                    voice_id=cloned_voice.id,
                    language="auto",
                )
                logger.info(
                    "Dispatched voice clone job %s for batch %s",
                    job.id,
                    batch_job.id,
                )
            else:
                generate_speech.delay(
                    job_id=job.id,
                    text=row_text,
                    mode="speech",
                    speaker=voice_lower,
                    language="auto",
                    speed=speed,
                    instruct=instruct,
                    instructions=None,
                    ref_audio=None,
                    ref_text=None,
                    emotion_preset=emotion_preset,
                    pronunciation_enabled=False,
                )
                logger.info(
                    "Dispatched speech job %s for batch %s",
                    job.id,
                    batch_job.id,
                )

        # Update batch status based on validation results
        async with async_session_factory() as session:
            batch_db = await session.get(BatchJob, batch_job.id)
            if batch_db:
                batch_db.failed_count = failed_count
                if failed_count == len(rows):
                    batch_db.status = "failed"
                    batch_db.completed_at = datetime.utcnow()
                elif failed_count == 0:
                    # All valid — stay processing until Celery tasks finish
                    batch_db.status = "processing"
                else:
                    # Mix of valid and invalid
                    batch_db.status = "processing"
                await session.commit()
            await session.refresh(batch_db)
            return batch_db

    async def get_batch_with_items(self, batch_id: str, user_id: str) -> dict:
        """Fetch batch metadata and all associated jobs.

        Args:
            batch_id: The batch's unique identifier.
            user_id: The requesting user's ID (for ownership verification).

        Returns:
            Dict matching ``BatchResponse`` schema.

        Raises:
            HTTPException: 404 if batch not found or not owned by user.
        """
        async with async_session_factory() as session:
            batch = await session.get(BatchJob, batch_id)
            if batch is None or batch.user_id != user_id:
                raise HTTPException(status_code=404, detail="Batch not found")

            result = await session.execute(
                select(Job)
                .where(Job.batch_id == batch_id)
                .order_by(Job.created_at.asc())
            )
            jobs = result.scalars().all()

        items: list[dict] = []
        for job in jobs:
            wav_url = f"/api/audio/{job.id}/wav" if job.audio_wav_path else None
            mp3_url = f"/api/audio/{job.id}/mp3" if job.audio_mp3_path else None
            items.append(
                {
                    "job_id": job.id,
                    "text": job.text,
                    "voice_name": job.voice_name,
                    "status": job.status,
                    "error_message": job.error_message,
                    "audio_wav_url": wav_url,
                    "audio_mp3_url": mp3_url,
                    "created_at": job.created_at,
                    "completed_at": job.completed_at,
                }
            )

        # Recalculate counts from actual job statuses
        completed_count = sum(1 for j in jobs if j.status == "completed")
        failed_count = sum(1 for j in jobs if j.status == "failed")

        # Update batch counts if they've changed (e.g. Celery tasks completed)
        if batch.completed_count != completed_count or batch.failed_count != failed_count:
            async with async_session_factory() as session:
                batch_db = await session.get(BatchJob, batch_id)
                if batch_db:
                    batch_db.completed_count = completed_count
                    batch_db.failed_count = failed_count
                    if completed_count + failed_count == batch_db.total_items:
                        batch_db.status = "completed" if failed_count == 0 else "completed"
                        if batch_db.completed_at is None:
                            batch_db.completed_at = datetime.utcnow()
                    await session.commit()
            batch.completed_count = completed_count
            batch.failed_count = failed_count

        return {
            "id": batch.id,
            "status": batch.status,
            "total_items": batch.total_items,
            "completed_count": batch.completed_count,
            "failed_count": batch.failed_count,
            "created_at": batch.created_at,
            "completed_at": batch.completed_at,
            "items": items,
        }

    async def list_batches(
        self,
        user_id: str,
        skip: int = 0,
        limit: int = 20,
    ) -> tuple[list[BatchJob], int]:
        """List batches for a user with pagination.

        Args:
            user_id: Owner of the batches.
            skip: Number of items to skip.
            limit: Maximum number of items to return.

        Returns:
            Tuple of (list of ``BatchJob`` instances, total count).
        """
        async with async_session_factory() as session:
            count_result = await session.execute(
                select(func.count()).select_from(BatchJob).where(BatchJob.user_id == user_id)
            )
            total = count_result.scalar() or 0

            result = await session.execute(
                select(BatchJob)
                .where(BatchJob.user_id == user_id)
                .order_by(BatchJob.created_at.desc())
                .offset(skip)
                .limit(limit)
            )
            items = list(result.scalars().all())

        return items, total

    async def generate_zip(
        self,
        batch_id: str,
        user_id: str,
        format: str = "mp3",
    ) -> io.BytesIO:
        """Generate an in-memory ZIP of completed batch audio files.

        Includes a manifest.csv with all items and their statuses.

        Args:
            batch_id: The batch's unique identifier.
            user_id: The requesting user's ID (for ownership verification).
            format: ``mp3`` for MP3 only, ``both`` for MP3 + WAV.

        Returns:
            ``io.BytesIO`` buffer positioned at the start.

        Raises:
            HTTPException: 404 if batch not found or not owned;
                           400 if no completed audio files are available.
        """
        async with async_session_factory() as session:
            batch = await session.get(BatchJob, batch_id)
            if batch is None or batch.user_id != user_id:
                raise HTTPException(status_code=404, detail="Batch not found")

            result = await session.execute(
                select(Job)
                .where(Job.batch_id == batch_id)
                .order_by(Job.created_at.asc())
            )
            jobs = list(result.scalars().all())

        # Build ZIP
        buffer = io.BytesIO()
        with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as zf:
            manifest_rows: list[dict] = []
            completed_count = 0

            for idx, job in enumerate(jobs, start=1):
                preview = _sanitize_filename(job.text)
                base_name = f"{idx:03d}_{preview}"

                status = job.status
                filename = ""

                if job.status == "completed":
                    if job.audio_mp3_path and os.path.exists(job.audio_mp3_path):
                        mp3_arcname = f"{base_name}.mp3"
                        zf.write(job.audio_mp3_path, arcname=mp3_arcname)
                        filename = mp3_arcname
                        completed_count += 1

                    if (
                        format == "both"
                        and job.audio_wav_path
                        and os.path.exists(job.audio_wav_path)
                    ):
                        wav_arcname = f"{base_name}.wav"
                        zf.write(job.audio_wav_path, arcname=wav_arcname)
                        if not filename:
                            filename = wav_arcname

                manifest_rows.append(
                    {
                        "index": idx,
                        "filename": filename,
                        "text": job.text,
                        "voice": job.voice_name or job.speaker or "",
                        "status": status,
                    }
                )

            if completed_count == 0:
                raise HTTPException(
                    status_code=400,
                    detail="No completed audio files available for download",
                )

            # Write manifest.csv
            manifest_buffer = io.StringIO()
            manifest_writer = csv.DictWriter(
                manifest_buffer,
                fieldnames=["index", "filename", "text", "voice", "status"],
            )
            manifest_writer.writeheader()
            manifest_writer.writerows(manifest_rows)
            zf.writestr("manifest.csv", manifest_buffer.getvalue())

        buffer.seek(0)
        return buffer


# Module-level singleton for use by API routes.
batch_service = BatchService()
