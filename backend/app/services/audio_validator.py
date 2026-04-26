"""Audio file validation service for voice cloning uploads.

Validates uploaded audio files for format, duration, and quality
before accepting them for voice cloning.
"""

import logging
from pathlib import Path

import numpy as np
import soundfile as sf

logger = logging.getLogger(__name__)


class AudioValidationError(Exception):
    """Raised when an audio file fails validation for voice cloning."""

    pass


# Validation constants per CLON-04 and threat model T-02-01/T-02-02
MIN_DURATION_SECONDS = 3.0
MAX_DURATION_SECONDS = 60.0
MAX_FILE_SIZE_MB = 20.0
MIN_DBFS = -40.0
MAX_DBFS = -3.0


def _calculate_dbfs(audio: np.ndarray) -> float:
    """Calculate average dBFS of an audio signal.

    Args:
        audio: Audio samples as numpy array.

    Returns:
        Average dBFS value.
    """
    # Avoid log of zero
    rms = np.sqrt(np.mean(audio**2))
    if rms == 0:
        return -float("inf")
    return 20 * np.log10(rms)


def validate_audio_file(file_path: str) -> dict:
    """Validate an uploaded audio file for voice cloning.

    Checks format, duration, sample rate, and audio quality.

    Args:
        file_path: Path to the audio file to validate.

    Returns:
        Dict with validation result: {
            "duration": float,
            "sample_rate": int,
            "is_valid": bool,
            "message": str,
        }

    Raises:
        AudioValidationError: If the file fails validation, with an
            actionable error message for the user.
    """
    path = Path(file_path)

    # File size check
    size_mb = path.stat().st_size / (1024 * 1024)
    if size_mb > MAX_FILE_SIZE_MB:
        raise AudioValidationError(
            f"File is too large ({size_mb:.1f} MB). "
            f"Maximum allowed size is {MAX_FILE_SIZE_MB} MB."
        )

    try:
        audio, sample_rate = sf.read(str(path), dtype="float32")
    except Exception as e:
        logger.warning("Failed to read audio file %s: %s", file_path, e)
        raise AudioValidationError(
            "Unable to read audio file. Please upload a valid WAV or MP3 file."
        ) from e

    # Convert to mono if stereo
    if audio.ndim > 1:
        audio = audio.mean(axis=1)

    duration = len(audio) / sample_rate
    dbfs = _calculate_dbfs(audio)

    # Duration validation
    if duration < MIN_DURATION_SECONDS:
        raise AudioValidationError(
            f"Audio is too short ({duration:.1f}s). "
            f"Please provide at least {MIN_DURATION_SECONDS} seconds of clear speech."
        )
    if duration > MAX_DURATION_SECONDS:
        raise AudioValidationError(
            f"Audio is too long ({duration:.1f}s). "
            f"Maximum allowed duration is {MAX_DURATION_SECONDS} seconds."
        )

    # Quality validation
    if dbfs < MIN_DBFS:
        raise AudioValidationError(
            "Audio is too quiet. Please record closer to the microphone or increase volume."
        )
    if dbfs > MAX_DBFS:
        raise AudioValidationError(
            "Audio appears clipped or distorted. Please reduce recording volume and try again."
        )

    logger.info(
        "Audio validation passed: %.2fs @ %dHz, %.1f dBFS",
        duration,
        sample_rate,
        dbfs,
    )

    return {
        "duration": duration,
        "sample_rate": sample_rate,
        "is_valid": True,
        "message": "Audio validation passed",
    }
