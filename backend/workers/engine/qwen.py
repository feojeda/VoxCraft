"""Qwen3-TTS engine adapter.

Wraps the Qwen3-TTS CustomVoice model's generate_custom_voice API
into the BaseTTSEngine interface. Handles speaker ID normalization,
GPU inference context, and audio output formatting.
"""

import logging

import numpy as np
import torch

from workers.engine.base import BaseTTSEngine, SynthesisResult
from workers.engine.model_manager import (
    SPEAKERS,
    SUPPORTED_LANGUAGES,
    VALID_SPEAKER_IDS,
)

logger = logging.getLogger(__name__)


class QwenTTSEngine(BaseTTSEngine):
    """TTS engine adapter for Qwen3-TTS CustomVoice model.

    Wraps generate_custom_voice to produce SynthesisResult objects.
    Uses torch.inference_mode() for efficient GPU inference and
    clears CUDA cache after each synthesis to prevent VRAM leaks.
    """

    def __init__(self, model: object) -> None:
        """Initialize with a loaded Qwen3-TTS model instance.

        Args:
            model: A loaded Qwen3TTSModel instance.
        """
        self._model = model

    def synthesize(
        self,
        text: str,
        speaker: str,
        language: str,
        instruct: str = "",
    ) -> SynthesisResult:
        """Synthesize speech using Qwen3-TTS.

        Args:
            text: Text to convert to speech.
            speaker: Speaker ID (e.g., 'ryan', 'serena').
            language: Language name or 'auto'.
            instruct: Natural language instruction for style control.

        Returns:
            SynthesisResult with audio samples at 24kHz.

        Raises:
            ValueError: If speaker is not a valid speaker ID.
        """
        # Normalize speaker ID to lowercase
        speaker = speaker.lower().strip()
        if speaker not in VALID_SPEAKER_IDS:
            raise ValueError(
                f"Invalid speaker '{speaker}'. "
                f"Valid speakers: {sorted(VALID_SPEAKER_IDS)}"
            )

        # Normalize language to title case for Qwen3-TTS API
        language_normalized = (
            language.title() if language != "auto" else language
        )

        logger.info(
            "Synthesizing: text=%d chars, speaker=%s, lang=%s",
            len(text),
            speaker,
            language_normalized,
        )

        try:
            with torch.inference_mode():
                wavs, sample_rate = self._model.generate_custom_voice(
                    text=text,
                    language=language_normalized,
                    speaker=speaker,
                    instruct=instruct,
                    do_sample=True,
                    max_new_tokens=2048,
                    temperature=0.9,
                    top_k=50,
                    top_p=1.0,
                    repetition_penalty=1.05,
                )
        finally:
            # Clean up GPU cache to prevent VRAM leaks
            torch.cuda.empty_cache()

        # wavs is a list of numpy arrays; take the first (mono) channel
        audio = wavs[0] if isinstance(wavs, list) else wavs
        if isinstance(audio, np.ndarray):
            audio_array = audio
        else:
            audio_array = np.array(audio, dtype=np.float32)

        duration = len(audio_array) / sample_rate

        logger.info(
            "Synthesis complete: %.2fs audio at %dHz",
            duration,
            sample_rate,
        )

        return SynthesisResult(
            audio=audio_array,
            sample_rate=sample_rate,
            duration_seconds=duration,
        )

    def get_speakers(self) -> list[dict]:
        """Return the list of predefined Qwen3-TTS speakers.

        Returns:
            List of speaker dicts with id, name, language, gender, description.
        """
        return SPEAKERS.copy()

    def get_supported_languages(self) -> list[str]:
        """Return the list of supported language names.

        Returns:
            List of language strings including 'auto'.
        """
        return SUPPORTED_LANGUAGES.copy()
