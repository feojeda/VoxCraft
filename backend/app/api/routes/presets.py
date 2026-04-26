"""Voice preset endpoints.

Provides CRUD operations for saved voice setting presets:
- GET /api/presets — List user's presets
- POST /api/presets — Create a new preset
- DELETE /api/presets/{preset_id} — Delete a preset
"""

import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.preset import VoicePreset
from app.models.user import User
from app.schemas.preset import (
    VoicePresetCreateRequest,
    VoicePresetListResponse,
    VoicePresetResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter(tags=["presets"])


@router.get("/presets", response_model=VoicePresetListResponse)
async def list_presets(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> VoicePresetListResponse:
    """List all voice presets for the authenticated user."""
    result = await db.execute(
        select(VoicePreset)
        .where(VoicePreset.user_id == current_user.id)
        .order_by(VoicePreset.created_at.desc())
    )
    presets = result.scalars().all()
    return VoicePresetListResponse(
        presets=[VoicePresetResponse.model_validate(p) for p in presets],
        total=len(presets),
    )


@router.post("/presets", status_code=201, response_model=VoicePresetResponse)
async def create_preset(
    request: VoicePresetCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> VoicePresetResponse:
    """Create a new voice preset.

    Rejects empty names with 400 Bad Request.
    """
    if not request.name or not request.name.strip():
        raise HTTPException(status_code=400, detail="Preset name is required")

    preset = VoicePreset(
        name=request.name.strip(),
        speed=request.speed,
        emotion_preset=request.emotion_preset,
        instruct=request.instruct,
        user_id=current_user.id,
    )
    db.add(preset)
    await db.commit()
    await db.refresh(preset)

    logger.info("Created voice preset %s: %s for user %s", preset.id, preset.name, current_user.id)
    return VoicePresetResponse.model_validate(preset)


@router.delete("/presets/{preset_id}", status_code=204)
async def delete_preset(
    preset_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    """Delete a voice preset."""
    preset = await db.get(VoicePreset, preset_id)
    if preset is None or preset.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Preset not found")

    await db.delete(preset)
    await db.commit()

    logger.info("Deleted voice preset %s for user %s", preset_id, current_user.id)
