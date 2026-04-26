"""FastAPI dependency injection functions.

Provides reusable dependencies for database sessions, settings, and
authenticated user retrieval.
"""

from functools import lru_cache

from fastapi import Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import Settings
from app.core.database import async_session_factory, get_db
from app.core.security import decode_access_token
from app.models.user import User

__all__ = ["get_db", "get_settings", "get_current_user"]


@lru_cache
def get_settings() -> Settings:
    """Return a cached Settings instance.

    Uses lru_cache to avoid re-parsing environment variables on every request.
    """
    return Settings()


async def get_current_user(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> User:
    """Extract and validate the JWT from cookies, returning the authenticated user.

    Raises:
        HTTPException(401): If the token is missing, invalid, or the user does not exist.
    """
    token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    payload = decode_access_token(token)
    if payload is None:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")

    return user
