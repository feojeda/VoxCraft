"""Cloned voice database model.

Stores metadata for user-uploaded voice cloning samples.
"""

from datetime import datetime
from uuid import uuid4

from sqlalchemy import Float, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class ClonedVoice(Base):
    """Represents a user-uploaded voice cloning sample.

    Tracks the audio file path, reference transcript, and metadata
    needed for voice cloning generation.
    """

    __tablename__ = "cloned_voices"

    id: Mapped[str] = mapped_column(
        String,
        primary_key=True,
        default=lambda: str(uuid4()),
    )
    name: Mapped[str] = mapped_column(String, nullable=False)
    audio_path: Mapped[str] = mapped_column(String, nullable=False)
    ref_text: Mapped[str] = mapped_column(Text, nullable=False)
    duration_seconds: Mapped[float] = mapped_column(Float, nullable=False)
    sample_rate: Mapped[int] = mapped_column(Integer, default=24000)
    user_id: Mapped[str | None] = mapped_column(String, nullable=True)

    created_at: Mapped[datetime] = mapped_column(default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        default=func.now(),
        onupdate=func.now(),
    )

    def __repr__(self) -> str:
        return f"<ClonedVoice id={self.id} name={self.name}>"
