"""Share link model for public audio sharing."""

from datetime import datetime

from sqlalchemy import String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class ShareLink(Base):
    """Represents a public share link for a completed TTS generation."""

    __tablename__ = "share_links"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: __import__("uuid").uuid4().hex[:16]
    )
    token: Mapped[str] = mapped_column(String, unique=True, nullable=False, index=True)
    job_id: Mapped[str] = mapped_column(String, nullable=False, index=True)
    user_id: Mapped[str] = mapped_column(String, nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(default=func.now())
    expires_at: Mapped[datetime | None] = mapped_column(nullable=True)
    revoked_at: Mapped[datetime | None] = mapped_column(nullable=True)

    def __repr__(self) -> str:
        return f"<ShareLink token={self.token[:8]}... job={self.job_id}>"
