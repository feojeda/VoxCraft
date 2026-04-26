"""Share link API routes.

Provides endpoints for creating, listing, and revoking share links,
as well as public share metadata retrieval without authentication.
"""

import logging

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.share import (
    ShareCreateRequest,
    ShareListResponse,
    SharePublicResponse,
    ShareResponse,
)
from app.services.job_manager import job_manager
from app.services.share_service import share_service

logger = logging.getLogger(__name__)

router = APIRouter(tags=["shares"])


def _build_share_response(share) -> ShareResponse:
    """Build a ShareResponse from a ShareLink model instance."""
    from datetime import datetime

    is_active = share.revoked_at is None and (
        share.expires_at is None or share.expires_at >= datetime.utcnow()
    )
    return ShareResponse(
        id=share.id,
        token=share.token,
        job_id=share.job_id,
        created_at=share.created_at,
        expires_at=share.expires_at,
        revoked_at=share.revoked_at,
        is_active=is_active,
        share_url=f"/share/{share.token}",
    )


@router.post("/shares", status_code=201, response_model=ShareResponse)
async def create_share_link(
    request: ShareCreateRequest,
    current_user: User = Depends(get_current_user),
) -> ShareResponse:
    """Create a share link for a completed job owned by the current user."""
    share = await share_service.create_share(
        request.job_id,
        current_user.id,
        request.expires_at,
    )
    return _build_share_response(share)


@router.get("/shares", response_model=ShareListResponse)
async def list_share_links(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(get_current_user),
) -> ShareListResponse:
    """List the current user's active share links."""
    items, total = await share_service.list_shares(
        current_user.id,
        skip=skip,
        limit=limit,
    )
    return ShareListResponse(
        items=[_build_share_response(share) for share in items],
        total=total,
    )


@router.delete("/shares/{share_id}", status_code=204)
async def revoke_share_link(
    share_id: str,
    current_user: User = Depends(get_current_user),
) -> None:
    """Revoke a share link owned by the current user."""
    await share_service.revoke_share(share_id, current_user.id)


@router.get("/shares/public/{token}", response_model=SharePublicResponse)
async def get_public_share(
    token: str,
) -> SharePublicResponse:
    """Get public metadata for a share link (no authentication required)."""
    share = await share_service.get_share_by_token(token)
    if share is None:
        raise HTTPException(
            status_code=404,
            detail="Share link not found or expired",
        )

    job = await job_manager.get_job(share.job_id)
    if job is None:
        raise HTTPException(
            status_code=404,
            detail="Share link not found or expired",
        )

    audio_wav_url = f"/api/audio/share/{token}/wav" if job.audio_wav_path else None
    audio_mp3_url = f"/api/audio/share/{token}/mp3" if job.audio_mp3_path else None

    return SharePublicResponse(
        token=token,
        text=job.text,
        voice_name=job.voice_name,
        audio_wav_url=audio_wav_url,
        audio_mp3_url=audio_mp3_url,
        created_at=share.created_at,
    )
