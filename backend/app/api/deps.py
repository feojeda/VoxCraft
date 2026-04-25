"""FastAPI dependency injection functions.

Provides reusable dependencies for database sessions and settings.
"""

from functools import lru_cache

from app.config import Settings
from app.core.database import get_db

__all__ = ["get_db", "get_settings"]


@lru_cache
def get_settings() -> Settings:
    """Return a cached Settings instance.

    Uses lru_cache to avoid re-parsing environment variables on every request.
    """
    return Settings()
