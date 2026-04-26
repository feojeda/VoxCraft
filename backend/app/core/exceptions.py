"""Custom exception hierarchy for ttsQwen.

All domain-specific exceptions inherit from TTSQwenError to enable
catch-all error handling and structured error responses.
"""


class TTSQwenError(Exception):
    """Base exception for all ttsQwen domain errors."""

    pass


class EngineLoadError(TTSQwenError):
    """Raised when the TTS engine fails to load a model."""

    pass


class SynthesisError(TTSQwenError):
    """Raised when audio synthesis fails."""

    pass


class AudioValidationError(TTSQwenError):
    """Raised when an audio file fails validation."""

    pass


class ConfigError(TTSQwenError):
    """Raised when application configuration is invalid or missing."""

    pass
