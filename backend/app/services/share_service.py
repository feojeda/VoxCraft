"""Share link service for public audio sharing.

Handles creation, validation, revocation, and listing of share links
with cryptographically secure token generation.
"""

import logging
import secrets
from datetime import datetime

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import async_session_factory
from app.models.share import ShareLink
from app.services.job_manager import job_manager

logger = logging.getLogger(__name__)


def _generate_token() -> str:
    """Generate a cryptographically secure unguessable token."""
    return secrets.token_urlsafe(32)


class ShareService:
    """Service for managing public share links for completed TTS jobs."""

    async def create_share(
        self,
        job_id: str,
        user_id: str,
        expires_at: datetime | None = None,
    ) -> ShareLink:
        """Create a new share link for a completed job.

        Args:
            job_id: The job to share.
            user_id: The user requesting the share (must own the job).
            expires_at: Optional expiration datetime.

        Returns:
            The created ShareLink instance.

        Raises:
            HTTPException(404): If the job doesn't exist, isn't completed,
                or doesn't belong to the user.
        """
        job = await job_manager.get_job(job_id)
        if job is None or job.user_id != user_id or job.status != "completed":
            raise HTTPException(
                status_code=404,
                detail="Job not found or not completed",
            )

        share = ShareLink(
            token=_generate_token(),
            job_id=job_id,
            user_id=user_id,
            expires_at=expires_at,
        )
        async with async_session_factory() as session:
            session.add(share)
            await session.commit()
            await session.refresh(share)
        logger.info(
            "Created share %s for job %s by user %s",
            share.id,
            job_id,
            user_id,
        )
        return share

    async def get_share_by_token(self, token: str) -> ShareLink | None:
        """Retrieve a share link by token, validating expiration and revocation.

        Args:
            token: The share token from the URL.

        Returns:
            ShareLink if valid and active, None otherwise.
        """
        async with async_session_factory() as session:
            result = await session.execute(
                select(ShareLink).where(ShareLink.token == token)
            )
            share = result.scalar_one_or_none()

        if share is None:
            return None
        if share.revoked_at is not None:
            return None
        if share.expires_at is not None and share.expires_at < datetime.utcnow():
            return None
        return share

    async def revoke_share(self, share_id: str, user_id: str) -> None:
        """Revoke a share link.

        Args:
            share_id: The share link ID to revoke.
            user_id: The user requesting revocation (must own the share).

        Raises:
            HTTPException(404): If the share doesn't exist or doesn't belong
                to the user.
        """
        async with async_session_factory() as session:
            result = await session.execute(
                select(ShareLink).where(ShareLink.id == share_id)
            )
            share = result.scalar_one_or_none()
            if share is None or share.user_id != user_id:
                raise HTTPException(status_code=404, detail="Share link not found")

            share.revoked_at = datetime.utcnow()
            await session.commit()
        logger.info("Revoked share %s by user %s", share_id, user_id)

    async def list_shares(
        self,
        user_id: str,
        skip: int = 0,
        limit: int = 50,
    ) -> tuple[list[ShareLink], int]:
        """List active share links for a user.

        Args:
            user_id: The user whose shares to list.
            skip: Number of items to skip (pagination).
            limit: Maximum number of items to return.

        Returns:
            Tuple of (list of ShareLink items, total count).
        """
        async with async_session_factory() as session:
            # Total count
            count_result = await session.execute(
                select(func.count())
                .select_from(ShareLink)
                .where(ShareLink.user_id == user_id)
                .where(ShareLink.revoked_at.is_(None))
            )
            total = count_result.scalar() or 0

            # Paginated items
            result = await session.execute(
                select(ShareLink)
                .where(ShareLink.user_id == user_id)
                .where(ShareLink.revoked_at.is_(None))
                .order_by(ShareLink.created_at.desc())
                .offset(skip)
                .limit(limit)
            )
            items = list(result.scalars().all())

        return items, total


# Module-level singleton for use by API routes and other services.
share_service = ShareService()
