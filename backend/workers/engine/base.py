"""Abstract TTS engine interface.

Defines the contract that all TTS engine adapters must implement.
This abstraction enables swapping engines (Qwen3-TTS, XTTS, etc.)
without modifying worker task logic.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass

import numpy as np


@dataclass
class SynthesisResult:
    """Result of a single TTS synthesis operation.

    Attributes:
        audio: Raw audio samples as a numpy array (float32, mono).
        sample_rate: Sample rate in Hz (24000 for Qwen3-TTS).
        duration_seconds: Computed duration of the audio in seconds.
    """

    audio: np.ndarray
    sample_rate: int
    duration_seconds: float


class BaseTTSEngine(ABC):
    """Abstract base class for TTS engine adapters.

    Subclasses must implement synthesize, get_speakers, and
    get_supported_languages to integrate a new TTS backend.
    """

    @abstractmethod
    def synthesize(
        self,
        text: str,
        speaker: str,
        language: str,
        instruct: str = "",
    ) -> SynthesisResult:
        """Synthesize speech from text.

        Args:
            text: The text to convert to speech.
            speaker: Speaker identifier (e.g., 'ryan', 'serena').
            language: Language name or 'auto' for auto-detection.
            instruct: Natural language instruction for style/emotion control.

        Returns:
            SynthesisResult containing audio samples and metadata.
        """
        ...

    @abstractmethod
    def get_speakers(self) -> list[dict]:
        """Return list of available speakers.

        Returns:
            List of dicts with keys: id, name, language, gender, description.
        """
        ...

    @abstractmethod
    def get_supported_languages(self) -> list[str]:
        """Return list of supported language names.

        Returns:
            List of language strings (e.g., ['English', 'Spanish', 'auto']).
        """
        ...
