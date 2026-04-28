"""Celery task definitions.

Auto-discovered by celery_app.autodiscover_tasks().
"""

from workers.tasks.tts_generate import generate_speech
from workers.tasks.voice_clone import generate_voice_clone

__all__ = ["generate_speech", "generate_voice_clone"]
