"""Job model for tracking async TTS generation tasks.

Stores the full lifecycle of a text-to-speech job: from queue submission
through processing to completion or failure.
"""

from datetime import datetime

from sqlalchemy import Float, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Job(Base):
    """Represents a TTS generation job in the database.

    Tracks input parameters, processing status with progress percentage,
    and output audio file paths upon completion.
    """

    __tablename__ = "jobs"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: __import__("uuid").uuid4().hex[:16])
    status: Mapped[str] = mapped_column(String, default="queued")  # queued|processing|completed|failed
    progress: Mapped[int] = mapped_column(Integer, default=0)  # 0-100

    # Input parameters
    text: Mapped[str] = mapped_column(Text)
    mode: Mapped[str] = mapped_column(String, default="speech")  # speech|voice-design|voice-clone
    language: Mapped[str] = mapped_column(String, default="auto")
    speaker: Mapped[str | None] = mapped_column(String, nullable=True)
    speed: Mapped[float] = mapped_column(Float, default=1.0)
    instruct: Mapped[str | None] = mapped_column(String, nullable=True)
    instructions: Mapped[str | None] = mapped_column(Text, nullable=True)
    ref_audio: Mapped[str | None] = mapped_column(Text, nullable=True)
    ref_text: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Ownership and display
    user_id: Mapped[str | None] = mapped_column(String, nullable=True)
    batch_id: Mapped[str | None] = mapped_column(String, nullable=True, index=True)
    voice_name: Mapped[str | None] = mapped_column(String, nullable=True)

    # Output
    audio_wav_path: Mapped[str | None] = mapped_column(String, nullable=True)
    audio_mp3_path: Mapped[str | None] = mapped_column(String, nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(default=func.now())
    completed_at: Mapped[datetime | None] = mapped_column(nullable=True)

    def __repr__(self) -> str:
        return f"<Job id={self.id} status={self.status} progress={self.progress}>"
