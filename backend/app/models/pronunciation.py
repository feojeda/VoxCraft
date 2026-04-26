"""Pronunciation dictionary database model.

Stores user-defined word replacements applied before TTS synthesis.
"""

from datetime import datetime
from uuid import uuid4

from sqlalchemy import String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class PronunciationDict(Base):
    """Represents a pronunciation dictionary entry.

    Maps a word to its replacement text for custom pronunciation
    during text-to-speech synthesis.
    """

    __tablename__ = "pronunciation_dict"

    id: Mapped[str] = mapped_column(
        String,
        primary_key=True,
        default=lambda: str(uuid4()),
    )
    word: Mapped[str] = mapped_column(String, nullable=False)
    replacement: Mapped[str] = mapped_column(String, nullable=False)
    user_id: Mapped[str | None] = mapped_column(String, nullable=True)

    created_at: Mapped[datetime] = mapped_column(default=func.now())

    def __repr__(self) -> str:
        return f"<PronunciationDict word={self.word}>"
