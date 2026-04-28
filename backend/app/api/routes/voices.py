"""Voice management endpoints.

Provides CRUD operations for cloned voices:
- POST /api/voices — Upload audio for voice cloning
- GET /api/voices — List cloned voices
- GET /api/voices/{voice_id} — Get voice details
- PATCH /api/voices/{voice_id} — Rename voice
- DELETE /api/voices/{voice_id} — Delete voice

Also provides:
- GET /api/voices/predefined — List predefined speakers (legacy endpoint)
"""

import base64
import logging
import os
import shutil
import subprocess
from pathlib import Path
from uuid import uuid4

import httpx
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.config import settings
from app.models.user import User
from app.models.voice import ClonedVoice
from app.schemas.voice import (
    VoiceCreateRequest,
    VoiceListResponse,
    VoiceResponse,
    VoiceUpdateRequest,
)
from app.services.audio_validator import AudioValidationError, validate_audio_file
from workers.engine.model_manager import SPEAKERS

logger = logging.getLogger(__name__)

router = APIRouter(tags=["voices"])


@router.get("/voices/predefined")
async def list_predefined_voices() -> dict:
    """Return the catalog of predefined TTS speakers.

    Returns 9 predefined speakers with id, name, language, gender,
    and description for frontend display.
    """
    return {"speakers": SPEAKERS, "total": len(SPEAKERS)}


@router.post("/voices", status_code=201, response_model=VoiceResponse)
async def create_voice(
    audio: UploadFile = File(...),
    ref_text: str = Form(...),
    name: str = Form(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> VoiceResponse:
    """Upload an audio file for voice cloning.

    Validates the audio file, saves it to disk, and creates a
    ClonedVoice record in the database.
    """
    # Validate file type by content type and extension
    allowed_types = {"audio/wav", "audio/x-wav", "audio/mpeg", "audio/mp3", "audio/ogg", "audio/webm"}
    if audio.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported audio format: {audio.content_type}. Please upload WAV, MP3, or OGG.",
        )

    voice_id = str(uuid4())
    voice_dir = Path(settings.AUDIO_OUTPUT_DIR) / "voices" / voice_id
    voice_dir.mkdir(parents=True, exist_ok=True)

    # Determine extension from content type
    ext = ".wav"
    if audio.content_type in {"audio/mpeg", "audio/mp3"}:
        ext = ".mp3"
    elif audio.content_type == "audio/ogg":
        ext = ".ogg"
    elif audio.content_type == "audio/webm":
        ext = ".webm"

    file_path = voice_dir / f"reference{ext}"

    try:
        # Save uploaded file
        with open(file_path, "wb") as f:
            shutil.copyfileobj(audio.file, f)
    except Exception as e:
        logger.error("Failed to save uploaded audio: %s", e)
        raise HTTPException(status_code=500, detail="Failed to save uploaded audio") from e
    finally:
        await audio.close()

    # Convert webm to wav if needed (browser recordings produce webm)
    if ext == ".webm":
        wav_path = voice_dir / "reference.wav"
        try:
            subprocess.run(
                [
                    "ffmpeg",
                    "-y",
                    "-i",
                    str(file_path),
                    "-ar",
                    "24000",
                    "-ac",
                    "1",
                    "-acodec",
                    "pcm_s16le",
                    str(wav_path),
                ],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                check=True,
            )
            # Remove original webm, use wav for validation and storage
            os.remove(file_path)
            file_path = wav_path
        except subprocess.CalledProcessError:
            shutil.rmtree(voice_dir, ignore_errors=True)
            raise HTTPException(
                status_code=400,
                detail="Unable to convert audio file. Please upload a valid WAV or MP3 file.",
            ) from None

    # Validate audio
    try:
        validation = validate_audio_file(str(file_path))
    except AudioValidationError as e:
        # Clean up saved file on validation failure
        shutil.rmtree(voice_dir, ignore_errors=True)
        raise HTTPException(status_code=400, detail=str(e)) from e

    # Create voice clone prompt via TTS server
    voice_clone_prompt_b64 = None
    try:
        with open(file_path, "rb") as f:
            audio_bytes = f.read()
        audio_b64 = base64.b64encode(audio_bytes).decode("utf-8")
        audio_data_uri = f"data:audio/wav;base64,{audio_b64}"

        tts_response = httpx.post(
            f"{settings.TTS_SERVER_URL}/v1/audio/voice-clone/prompt",
            json={
                "ref_audio": audio_data_uri,
                "ref_text": ref_text,
                "x_vector_only_mode": False,
            },
            timeout=300.0,
        )
        tts_response.raise_for_status()
        prompt_data = tts_response.json()
        voice_clone_prompt_b64 = prompt_data.get("voice_clone_prompt_b64")
        logger.info("Created voice clone prompt for voice %s", voice_id)
    except Exception as e:
        logger.warning("Failed to create voice clone prompt for voice %s: %s", voice_id, e)
        # Continue without prompt — fallback to sending audio on generation

    # Create database record
    voice = ClonedVoice(
        id=voice_id,
        name=name,
        audio_path=str(file_path),
        ref_text=ref_text,
        duration_seconds=validation["duration"],
        sample_rate=validation["sample_rate"],
        voice_clone_prompt_b64=voice_clone_prompt_b64,
        user_id=current_user.id,
    )
    db.add(voice)
    await db.commit()
    await db.refresh(voice)

    logger.info("Created cloned voice %s: %s (%.2fs)", voice_id, name, validation["duration"])
    return VoiceResponse.model_validate(voice)


@router.get("/voices", response_model=VoiceListResponse)
async def list_voices(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> VoiceListResponse:
    """List cloned voices for the authenticated user.

    Returns a paginated list of user-uploaded voice cloning samples.
    """
    result = await db.execute(
        select(ClonedVoice)
        .where(ClonedVoice.user_id == current_user.id)
        .order_by(ClonedVoice.created_at.desc())
    )
    voices = result.scalars().all()
    return VoiceListResponse(
        voices=[VoiceResponse.model_validate(v) for v in voices],
        total=len(voices),
    )


@router.get("/voices/{voice_id}", response_model=VoiceResponse)
async def get_voice(
    voice_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> VoiceResponse:
    """Get details for a single cloned voice."""
    voice = await db.get(ClonedVoice, voice_id)
    if voice is None or voice.user_id != current_user.id:
        raise HTTPException(status_code=404, detail=f"Voice '{voice_id}' not found")
    return VoiceResponse.model_validate(voice)


@router.patch("/voices/{voice_id}", response_model=VoiceResponse)
async def update_voice(
    voice_id: str,
    request: VoiceUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> VoiceResponse:
    """Rename a cloned voice."""
    voice = await db.get(ClonedVoice, voice_id)
    if voice is None or voice.user_id != current_user.id:
        raise HTTPException(status_code=404, detail=f"Voice '{voice_id}' not found")

    voice.name = request.name
    await db.commit()
    await db.refresh(voice)

    logger.info("Renamed voice %s to '%s'", voice_id, request.name)
    return VoiceResponse.model_validate(voice)


@router.delete("/voices/{voice_id}", status_code=204)
async def delete_voice(
    voice_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    """Delete a cloned voice and its associated audio file."""
    voice = await db.get(ClonedVoice, voice_id)
    if voice is None or voice.user_id != current_user.id:
        raise HTTPException(status_code=404, detail=f"Voice '{voice_id}' not found")

    # Remove audio file and parent directory
    try:
        voice_dir = Path(voice.audio_path).parent
        shutil.rmtree(voice_dir, ignore_errors=True)
    except Exception as e:
        logger.warning("Failed to remove audio directory for voice %s: %s", voice_id, e)

    await db.delete(voice)
    await db.commit()

    logger.info("Deleted voice %s", voice_id)
