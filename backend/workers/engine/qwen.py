"""Qwen3-TTS engine adapter (HTTP client).

Calls the OpenAI-compatible TTS server via HTTP instead of loading
the model locally. Expects a server running at TTS_SERVER_URL with
/v1/audio/speech endpoint.
"""

import io
import logging

import httpx
import numpy as np
import soundfile as sf

from workers.engine.base import BaseTTSEngine, SynthesisResult
from workers.engine.model_manager import SPEAKERS, SUPPORTED_LANGUAGES

logger = logging.getLogger(__name__)


class QwenTTSEngine(BaseTTSEngine):
    """TTS engine that proxies to an OpenAI-compatible HTTP server."""

    def __init__(self, base_url: str, api_key: str = "dummy") -> None:
        """Initialize with the TTS server base URL.

        Args:
            base_url: Base URL of the OpenAI-compatible TTS server.
            api_key: API key for authorization (servers may accept "dummy").
        """
        self._base_url = base_url.rstrip("/")
        self._api_key = api_key
        self._client = httpx.Client(timeout=300.0)

    def synthesize(
        self,
        text: str,
        speaker: str,
        language: str,
        instruct: str = "",
    ) -> SynthesisResult:
        """Synthesize speech via HTTP POST to the TTS server.

        Args:
            text: Text to convert to speech.
            speaker: Speaker ID (e.g., 'ryan', 'serena').
            language: Language name or 'auto'.
            instruct: Natural language instruction for style control.

        Returns:
            SynthesisResult with audio samples at 24kHz.

        Raises:
            httpx.HTTPError: If the server returns an error.
            ValueError: If speaker is invalid or response cannot be parsed.
        """
        speaker = speaker.lower().strip()
        valid_ids = {s["id"] for s in SPEAKERS}
        if speaker not in valid_ids:
            raise ValueError(
                f"Invalid speaker '{speaker}'. "
                f"Valid speakers: {sorted(valid_ids)}"
            )

        language_normalized = (
            language.title() if language != "auto" else language
        )

        payload = {
            "model": "qwen3-tts",
            "input": text,
            "voice": speaker,
            "instructions": instruct,
            "response_format": "wav",
            "language": language_normalized,
        }

        logger.info(
            "TTS request: text=%d chars, speaker=%s, lang=%s",
            len(text),
            speaker,
            language_normalized,
        )

        response = self._client.post(
            f"{self._base_url}/v1/audio/speech",
            json=payload,
            headers={"Authorization": f"Bearer {self._api_key}"},
        )
        response.raise_for_status()

        # Parse WAV bytes into numpy array
        audio_bytes = response.content
        audio_buffer = io.BytesIO(audio_bytes)
        audio_array, sample_rate = sf.read(audio_buffer, dtype="float32")

        if audio_array.ndim > 1:
            audio_array = audio_array[:, 0]  # mono

        duration = len(audio_array) / sample_rate

        logger.info(
            "TTS response: %.2fs audio at %dHz",
            duration,
            sample_rate,
        )

        return SynthesisResult(
            audio=audio_array,
            sample_rate=sample_rate,
            duration_seconds=duration,
        )

    def get_speakers(self) -> list[dict]:
        """Return the list of predefined TTS speakers."""
        return SPEAKERS.copy()

    def get_supported_languages(self) -> list[str]:
        """Return the list of supported language names."""
        return SUPPORTED_LANGUAGES.copy()
