"""TTS engine abstraction layer.

Re-exports the public engine API: base classes, model manager,
and factory functions used by Celery tasks.
"""

from workers.engine.base import BaseTTSEngine, SynthesisResult
from workers.engine.model_manager import (
    ModelManager,
    SPEAKERS,
    VALID_SPEAKER_IDS,
    get_model_manager,
    speed_to_instruct,
)

__all__ = [
    "BaseTTSEngine",
    "SynthesisResult",
    "ModelManager",
    "get_model_manager",
    "speed_to_instruct",
    "SPEAKERS",
    "VALID_SPEAKER_IDS",
]
