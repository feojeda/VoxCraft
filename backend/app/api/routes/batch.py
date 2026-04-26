"""Batch processing API endpoints.

Provides CSV upload, batch listing, status polling, and ZIP download
for bulk TTS generation jobs.
"""

import logging

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.batch import BatchListResponse, BatchResponse
from app.services.batch_service import batch_service

logger = logging.getLogger(__name__)

router = APIRouter(tags=["batches"])


@router.post("/batches", status_code=202, response_model=BatchResponse)
async def create_batch(
    file: UploadFile = File(...),
    speed: float = Form(1.0),
    instruct: str | None = Form(None),
    emotion_preset: str | None = Form(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> BatchResponse:
    """Upload a CSV file and create a batch of TTS jobs.

    The CSV must have exactly two columns: ``text`` and ``voice``,
    with a header row. Maximum 100 rows per upload.

    Returns the batch with its initial item list.
    """
    content = await file.read()

    try:
        rows = batch_service.parse_csv_rows(content)
    except (ValueError, UnicodeDecodeError) as exc:
        raise HTTPException(status_code=400, detail=f"Invalid file: {exc}")

    batch = await batch_service.create_batch(
        user_id=current_user.id,
        rows=rows,
        speed=speed,
        instruct=instruct,
        emotion_preset=emotion_preset,
    )

    # Build full response with items
    result = await batch_service.get_batch_with_items(batch.id, current_user.id)
    return BatchResponse(**result)


@router.get("/batches", response_model=BatchListResponse)
async def list_batches(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
) -> BatchListResponse:
    """List the authenticated user's batches.

    Returns paginated batches ordered by creation date (newest first).
    """
    items, total = await batch_service.list_batches(
        user_id=current_user.id,
        skip=skip,
        limit=limit,
    )

    batch_items = [
        {
            "id": b.id,
            "status": b.status,
            "total_items": b.total_items,
            "completed_count": b.completed_count,
            "failed_count": b.failed_count,
            "created_at": b.created_at,
            "completed_at": b.completed_at,
        }
        for b in items
    ]

    return BatchListResponse(items=batch_items, total=total)


@router.get("/batches/{batch_id}", response_model=BatchResponse)
async def get_batch(
    batch_id: str,
    current_user: User = Depends(get_current_user),
) -> BatchResponse:
    """Get batch status and per-item details."""
    result = await batch_service.get_batch_with_items(batch_id, current_user.id)
    return BatchResponse(**result)


@router.get("/batches/{batch_id}/download")
async def download_batch_zip(
    batch_id: str,
    format: str = "mp3",
    current_user: User = Depends(get_current_user),
) -> StreamingResponse:
    """Download a ZIP of completed audio files for a batch.

    Query parameter ``format`` accepts:
    - ``mp3`` — MP3 files only (default)
    - ``both`` — MP3 + WAV files
    """
    try:
        buffer = await batch_service.generate_zip(
            batch_id=batch_id,
            user_id=current_user.id,
            format=format,
        )
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("ZIP generation failed for batch %s", batch_id)
        raise HTTPException(status_code=500, detail=f"ZIP generation failed: {exc}")

    return StreamingResponse(
        buffer,
        media_type="application/zip",
        headers={
            "Content-Disposition": f"attachment; filename=batch_{batch_id}.zip"
        },
    )
