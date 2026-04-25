"""Database models package.

Import all models here so they are registered with the declarative base
before Alembic or init_db() runs.
"""

from app.models.job import Job

__all__ = ["Job"]
