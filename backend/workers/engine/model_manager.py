"""Singleton TTS engine factory.

Manages the lifecycle of the QwenTTSEngine HTTP client.
The engine connects to an external OpenAI-compatible TTS server
instead of loading a local model.
"""

import logging

from app.config import settings

logger = logging.getLogger(__name__)


# Predefined speaker catalog with metadata for the API.
SPEAKERS = [
    {
        "id": "vivian",
        "name": "Vivian",
        "language": "Chinese",
        "gender": "Female",
        "description": "Warm and expressive",
    },
    {
        "id": "serena",
        "name": "Serena",
        "language": "English",
        "gender": "Female",
        "description": "Clear and natural",
    },
    {
        "id": "ryan",
        "name": "Ryan",
        "language": "English",
        "gender": "Male",
        "description": "Professional and warm",
    },
    {
        "id": "aiden",
        "name": "Aiden",
        "language": "English",
        "gender": "Male",
        "description": "Young and energetic",
    },
    {
        "id": "dylan",
        "name": "Dylan",
        "language": "English",
        "gender": "Male",
        "description": "Deep and resonant",
    },
    {
        "id": "eric",
        "name": "Eric",
        "language": "English",
        "gender": "Male",
        "description": "Calm and authoritative",
    },
    {
        "id": "ono_anna",
        "name": "Anna",
        "language": "Japanese",
        "gender": "Female",
        "description": "Gentle and precise",
    },
    {
        "id": "sohee",
        "name": "Sohee",
        "language": "Korean",
        "gender": "Female",
        "description": "Bright and friendly",
    },
    {
        "id": "uncle_fu",
        "name": "Uncle Fu",
        "language": "Chinese",
        "gender": "Male",
        "description": "Wise and experienced",
    },
]

VALID_SPEAKER_IDS = {s["id"] for s in SPEAKERS}

SUPPORTED_LANGUAGES = [
    "auto",
    "chinese",
    "english",
    "french",
    "german",
    "italian",
    "japanese",
    "korean",
    "portuguese",
    "russian",
    "spanish",
]


def speed_to_instruct(speed: float) -> str:
    """Map a numeric speed value (0.5-2.0) to a natural language instruction.

    The external TTS server does not have a native speed parameter.
    Speed is controlled via the `instructions` field with natural
    language like "Speak faster" or "Speak slowly".

    Args:
        speed: Speed multiplier in range [0.5, 2.0].

    Returns:
        Natural language instruction string, or empty string for normal speed.
    """
    if speed <= 0.7:
        return "Speak very slowly"
    elif speed <= 0.9:
        return "Speak slowly"
    elif speed <= 1.1:
        return ""
    elif speed <= 1.3:
        return "Speak slightly faster"
    elif speed <= 1.6:
        return "Speak faster"
    else:
        return "Speak very fast"


class ModelManager:
    """Singleton TTS engine factory with lazy HTTP client initialization."""

    def __init__(self) -> None:
        self._engine = None

    def get_engine(self) -> "QwenTTSEngine":
        """Return a QwenTTSEngine, creating it on first call.

        Returns:
            QwenTTSEngine instance configured to call the external server.
        """
        if self._engine is None:
            from workers.engine.qwen import QwenTTSEngine

            self._engine = QwenTTSEngine(
                base_url=settings.TTS_SERVER_URL,
                api_key=settings.TTS_SERVER_API_KEY,
            )
            logger.info(
                "QwenTTSEngine initialized with server: %s",
                settings.TTS_SERVER_URL,
            )
        return self._engine


# Module-level singleton instance.
_model_manager: ModelManager | None = None


def get_model_manager() -> ModelManager:
    """Return the global ModelManager singleton.

    Returns:
        The single ModelManager instance for this worker process.
    """
    global _model_manager
    if _model_manager is None:
        _model_manager = ModelManager()
    return _model_manager
