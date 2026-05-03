"""Custom exception hierarchy for VoxCraft.

All domain-specific exceptions inherit from VoxCraftError to enable
catch-all error handling and structured error responses.
"""


class VoxCraftError(Exception):
    """Base exception for all VoxCraft domain errors."""

    pass


class EngineLoadError(VoxCraftError):
    """Raised when the TTS engine fails to load a model."""

    pass


class SynthesisError(VoxCraftError):
    """Raised when audio synthesis fails."""

    pass


class AudioValidationError(VoxCraftError):
    """Raised when an audio file fails validation."""

    pass


class ConfigError(VoxCraftError):
    """Raised when application configuration is invalid or missing."""

    pass
