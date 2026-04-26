"""Pronunciation dictionary text preprocessing service.

Applies user-defined word replacements to input text before TTS synthesis.
Designed to be pure (no FastAPI dependencies) for use in both API and
Celery worker contexts.
"""

import logging
import re
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.pronunciation import PronunciationDict

logger = logging.getLogger(__name__)


def apply_pronunciation_dict(text: str, entries: list["PronunciationDict"]) -> str:
    """Apply pronunciation overrides to input text.

    Uses word-boundary regex matching to avoid partial replacements.
    Case-insensitive matching preserves original text casing.

    Entries are sorted by word length descending to prevent nested
    replacements (e.g., replacing "AI" before "OpenAI" would corrupt
    the latter).

    Args:
        text: Original input text for TTS synthesis.
        entries: List of PronunciationDict entries with word and replacement.

    Returns:
        Text with pronunciation overrides applied.
    """
    if not entries:
        return text

    # Sort by word length descending to prevent nested replacements
    sorted_entries = sorted(entries, key=lambda e: len(e.word), reverse=True)

    result = text
    for entry in sorted_entries:
        if not entry.word or not entry.replacement:
            continue

        # Word-boundary regex, case-insensitive, with escaped word
        pattern = r"\b" + re.escape(entry.word) + r"\b"
        result = re.sub(pattern, entry.replacement, result, flags=re.IGNORECASE)

    return result


def apply_pronunciation_to_text(text: str, entries: list["PronunciationDict"]) -> str:
    """Public interface for applying pronunciation dictionary to text.

    Args:
        text: Original input text.
        entries: Pronunciation dictionary entries.

    Returns:
        Processed text with replacements applied.
    """
    return apply_pronunciation_dict(text, entries)


async def get_pronunciation_entries(db_session, user_id: str | None = None) -> list["PronunciationDict"]:
    """Fetch all pronunciation entries from the database.

    Args:
        db_session: Async SQLAlchemy session.
        user_id: Optional user ID filter. If None, returns all entries.

    Returns:
        List of PronunciationDict entries ordered by word.
    """
    from sqlalchemy import select
    from app.models.pronunciation import PronunciationDict

    stmt = select(PronunciationDict).order_by(PronunciationDict.word)
    if user_id is not None:
        stmt = stmt.where(PronunciationDict.user_id == user_id)

    result = await db_session.execute(stmt)
    return list(result.scalars().all())
