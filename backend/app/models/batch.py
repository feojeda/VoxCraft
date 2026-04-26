"""Batch job model for tracking multi-entry TTS generation batches."""

from datetime import datetime

from sqlalchemy import Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class BatchJob(Base):
    """Represents a batch of TTS generation jobs submitted together."""

    __tablename__ = "batch_jobs"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: __import__("uuid").uuid4().hex[:16]
    )
    user_id: Mapped[str] = mapped_column(String, nullable=False, index=True)
    status: Mapped[str] = mapped_column(String, default="queued")  # queued|processing|completed|failed
    total_items: Mapped[int] = mapped_column(Integer, default=0)
    completed_count: Mapped[int] = mapped_column(Integer, default=0)
    failed_count: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(default=func.now())
    completed_at: Mapped[datetime | None] = mapped_column(nullable=True)

    def __repr__(self) -> str:
        return f"<BatchJob id={self.id} status={self.status} items={self.completed_count}/{self.total_items}>"
