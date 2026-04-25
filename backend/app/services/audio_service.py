"""Audio file management service.

Handles saving WAV files from numpy arrays, converting WAV to MP3
via FFmpeg subprocess, and managing the audio output directory.
"""

import logging
import subprocess
from pathlib import Path
from typing import TYPE_CHECKING

from app.config import settings

if TYPE_CHECKING:
    import numpy as np

logger = logging.getLogger(__name__)


class AudioService:
    """Manages audio file I/O: WAV saving, MP3 conversion, and path resolution."""

    def __init__(self) -> None:
        """Initialize with output directory from settings."""
        self._output_dir = Path(settings.AUDIO_OUTPUT_DIR)

    def ensure_output_dir(self) -> Path:
        """Create the audio output directory if it doesn't exist.

        Returns:
            Path to the output directory.
        """
        self._output_dir.mkdir(parents=True, exist_ok=True)
        return self._output_dir

    def get_audio_path(self, job_id: str, format: str) -> Path:
        """Get the expected file path for a job's audio output.

        Args:
            job_id: The job's unique identifier.
            format: Audio format ('wav' or 'mp3').

        Returns:
            Path to the audio file.
        """
        ext = format.lower()
        if ext not in ("wav", "mp3"):
            raise ValueError(f"Unsupported format: {ext}. Use 'wav' or 'mp3'.")
        return self._output_dir / f"{job_id}.{ext}"

    def save_wav(self, audio: "np.ndarray", sample_rate: int, job_id: str) -> Path:
        """Save a numpy audio array as a WAV file.

        Args:
            audio: Audio samples as numpy array (float32).
            sample_rate: Sample rate in Hz.
            job_id: Job ID for filename.

        Returns:
            Path to the saved WAV file.
        """
        import soundfile as sf

        self.ensure_output_dir()
        wav_path = self.get_audio_path(job_id, "wav")
        sf.write(str(wav_path), audio, sample_rate)
        logger.info("Saved WAV: %s (%dHz, %.2fs)", wav_path, sample_rate, len(audio) / sample_rate)
        return wav_path

    def convert_to_mp3(self, wav_path: Path, job_id: str) -> Path:
        """Convert a WAV file to MP3 using FFmpeg.

        Uses libmp3lame with VBR quality 2 (~190kbps) and preserves
        the source sample rate.

        Args:
            wav_path: Path to the source WAV file.
            job_id: Job ID for filename.

        Returns:
            Path to the generated MP3 file.

        Raises:
            RuntimeError: If FFmpeg conversion fails.
        """
        self.ensure_output_dir()
        mp3_path = self.get_audio_path(job_id, "mp3")

        cmd = [
            "ffmpeg",
            "-y",  # Overwrite output
            "-i",
            str(wav_path),
            "-codec:a",
            "libmp3lame",
            "-qscale:a",
            "2",  # ~190kbps VBR
            "-ar",
            "24000",  # Match source sample rate
            str(mp3_path),
        ]

        logger.info("Converting WAV → MP3: %s → %s", wav_path, mp3_path)
        result = subprocess.run(cmd, check=True, capture_output=True, text=True)

        if result.returncode != 0:
            raise RuntimeError(
                f"FFmpeg conversion failed (exit {result.returncode}): {result.stderr}"
            )

        logger.info("Converted MP3: %s", mp3_path)
        return mp3_path


# Module-level singleton for use by Celery tasks.
audio_service = AudioService()
