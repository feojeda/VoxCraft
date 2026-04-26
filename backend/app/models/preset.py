"""Voice preset database model.

Stores named voice setting presets (speed + emotion + prosody) per user.
"""

from datetime import datetime
from uuid import uuid4

from sqlalchemy import Float, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class VoicePreset(Base):
    """Represents a saved voice setting preset for quick recall."""

    __tablename__ = "voice_presets"

    id: Mapped[str] = mapped_column(
        String,
        primary_key=True,
        default=lambda: str(uuid4()),
    )
    name: Mapped[str] = mapped_column(String, nullable=False)
    speed: Mapped[float] = mapped_column(Float, default=1.0)
    emotion_preset: Mapped[str | None] = mapped_column(String, nullable=True)
    instruct: Mapped[str | None] = mapped_column(String, nullable=True)
    user_id: Mapped[str] = mapped_column(String, nullable=False, index=True)

    created_at: Mapped[datetime] = mapped_column(default=func.now())

    def __repr__(self) -> str:
        return f"<VoicePreset id={self.id} name={self.name}>"
