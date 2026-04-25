"""Singleton model loader with GPU memory management.

Manages the lifecycle of the Qwen3-TTS model: lazy loading on first
access, CUDA kernel warmup, and GPU cache cleanup after each synthesis.

Key design decisions:
- Singleton pattern: one model instance per worker process
- Lazy loading: model loaded on first get_engine() call, not at import time
- Warmup: dummy inference at startup prevents 30s delay on first real request
- Cleanup: torch.cuda.empty_cache() after each synthesis to prevent VRAM leaks
"""

import logging

from app.config import settings

logger = logging.getLogger(__name__)


# Predefined speaker catalog with metadata for the API.
# These match the Qwen3-TTS built-in speakers.
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

# Valid speaker IDs for input validation.
VALID_SPEAKER_IDS = {s["id"] for s in SPEAKERS}

# Supported languages for the Qwen3-TTS model.
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

    Qwen3-TTS does not have a native speed parameter. Instead, speed
    is controlled via the `instruct` parameter with natural language
    instructions like "Speak faster" or "Speak slowly".

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
    """Singleton model loader with lazy initialization.

    Manages the Qwen3-TTS model lifecycle within a Celery worker process.
    The model is loaded on first access and kept in GPU memory for
    subsequent requests.
    """

    def __init__(self) -> None:
        self._engine: "QwenTTSEngine | None" = None
        self._model = None

    def _load_model(self) -> None:
        """Load the Qwen3-TTS model into GPU memory.

        Uses bfloat16 precision and FlashAttention 2 for efficiency.
        Requires torch and qwen_tts packages (available in Docker worker).
        """
        if self._model is not None:
            return

        import torch
        from qwen_tts import Qwen3TTSModel

        logger.info("Loading Qwen3-TTS model onto %s...", settings.GPU_DEVICE)

        self._model = Qwen3TTSModel.from_pretrained(
            "Qwen/Qwen3-TTS-12Hz-1.7B-CustomVoice",
            device_map=settings.GPU_DEVICE,
            dtype=torch.bfloat16,
            attn_implementation="flash_attention_2",
        )
        logger.info("Qwen3-TTS model loaded successfully")

    def _warmup(self) -> None:
        """Run a dummy inference to warm up CUDA kernels.

        The first CUDA inference compiles kernels (10-30s delay).
        Running warmup at startup prevents this delay on real requests.
        """
        if self._model is None:
            return

        import torch

        logger.info("Running model warmup inference...")
        try:
            with torch.inference_mode():
                self._model.generate_custom_voice(
                    text="Warmup",
                    language="English",
                    speaker="ryan",
                    instruct="",
                    do_sample=True,
                    max_new_tokens=64,
                )
            torch.cuda.empty_cache()
            logger.info("Model warmup complete")
        except Exception as e:
            logger.warning("Model warmup failed (non-fatal): %s", e)

    def get_engine(self) -> "QwenTTSEngine":
        """Return a QwenTTSEngine, loading the model on first call.

        Returns:
            QwenTTSEngine instance wrapping the loaded model.
        """
        if self._engine is None:
            self._load_model()
            self._warmup()
            from workers.engine.qwen import QwenTTSEngine

            self._engine = QwenTTSEngine(self._model)
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
