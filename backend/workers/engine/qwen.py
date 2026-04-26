"""Qwen3-TTS engine adapter (HTTP client).

Calls the OpenAI-compatible TTS server via HTTP.
Supports three modes:
- speech: /v1/audio/speech (predefined speakers)
- voice-design: /v1/audio/voice-design (create voice from description)
- voice-clone: /v1/audio/voice-clone (clone from reference audio)
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

    # Emotion presets mapped to natural language instruct strings
    EMOTION_PRESETS: dict[str, str] = {
        "happy": "Speak happily and cheerfully",
        "sad": "Speak sadly with a melancholic tone",
        "angry": "Speak angrily with intensity",
        "neutral": "",  # No instruction for neutral
        "whisper": "Whisper softly",
    }

    def __init__(self, base_url: str, api_key: str = "dummy") -> None:
        """Initialize with the TTS server base URL.

        Args:
            base_url: Base URL of the OpenAI-compatible TTS server.
            api_key: API key for authorization (servers may accept "dummy").
        """
        self._base_url = base_url.rstrip("/")
        self._api_key = api_key
        self._client = httpx.Client(timeout=300.0)

    def _call_endpoint(
        self,
        endpoint: str,
        payload: dict,
    ) -> SynthesisResult:
        """POST to a TTS endpoint and parse the WAV response.

        Args:
            endpoint: API path (e.g., /v1/audio/speech).
            payload: JSON body.

        Returns:
            SynthesisResult with parsed audio.
        """
        logger.info(
            "TTS request: endpoint=%s, text=%d chars",
            endpoint,
            len(payload.get("input", "")),
        )

        response = self._client.post(
            f"{self._base_url}{endpoint}",
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

    def synthesize(
        self,
        text: str,
        speaker: str,
        language: str,
        instruct: str = "",
    ) -> SynthesisResult:
        """Synthesize speech using a predefined speaker.

        Args:
            text: Text to convert to speech.
            speaker: Speaker ID (e.g., 'ryan', 'serena').
            language: Language name or 'auto'.
            instruct: Natural language instruction for style control.

        Returns:
            SynthesisResult with audio samples at 24kHz.
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
            "model": "Qwen/Qwen3-TTS-12Hz-1.7B-CustomVoice",
            "input": text,
            "voice": speaker,
            "instructions": instruct,
            "response_format": "wav",
            "language": language_normalized,
        }

        return self._call_endpoint("/v1/audio/speech", payload)

    def synthesize_voice_design(
        self,
        text: str,
        instructions: str,
        language: str,
    ) -> SynthesisResult:
        """Create a custom voice from text description.

        Args:
            text: Text to convert to speech.
            instructions: Natural language description of the desired voice.
            language: Language name or 'auto'.

        Returns:
            SynthesisResult with audio samples.
        """
        language_normalized = (
            language.title() if language != "auto" else language
        )

        payload = {
            "model": "Qwen/Qwen3-TTS-12Hz-1.7B-VoiceDesign",
            "input": text,
            "instructions": instructions,
            "response_format": "wav",
            "language": language_normalized,
        }

        return self._call_endpoint("/v1/audio/voice-design", payload)

    def synthesize_voice_clone(
        self,
        text: str,
        ref_audio: str,
        ref_text: str | None,
        language: str,
    ) -> SynthesisResult:
        """Clone a voice from reference audio.

        Args:
            text: Text to convert to speech.
            ref_audio: Reference audio file path, URL, or base64 string.
            ref_text: Transcript of the reference audio (optional).
            language: Language name or 'auto'.

        Returns:
            SynthesisResult with audio samples.
        """
        language_normalized = (
            language.title() if language != "auto" else language
        )

        payload = {
            "model": "Qwen/Qwen3-TTS-12Hz-1.7B-Base",
            "input": text,
            "ref_audio": ref_audio,
            "response_format": "wav",
            "language": language_normalized,
        }

        if ref_text:
            payload["ref_text"] = ref_text

        return self._call_endpoint("/v1/audio/voice-clone", payload)

    @classmethod
    def map_emotion_preset(cls, preset: str) -> str:
        """Map an emotion preset name to a natural language instruct string.

        Args:
            preset: Emotion preset name (happy, sad, angry, neutral, whisper).

        Returns:
            Natural language instruction string, or empty string for neutral.
        """
        return cls.EMOTION_PRESETS.get(preset, "")

    def get_speakers(self) -> list[dict]:
        """Return the list of predefined TTS speakers."""
        return SPEAKERS.copy()

    def get_supported_languages(self) -> list[str]:
        """Return the list of supported language names."""
        return SUPPORTED_LANGUAGES.copy()
