"""Unit tests for Qwen TTS engine."""

import io
from unittest.mock import MagicMock, patch

import numpy as np
import pytest

from workers.engine.qwen import QwenTTSEngine


class TestQwenTTSEngineVoiceClone:
    @pytest.fixture
    def engine(self):
        return QwenTTSEngine(base_url="http://localhost:8000")

    def _mock_wav_response(self, content: bytes = b"RIFF\x26\x00\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00\x80\xbb\x00\x00\x00\x77\x01\x00\x02\x00\x10\x00data\x02\x00\x00\x00\x00\x00"):
        """Return a minimal valid WAV header for mocking."""
        return content

    @patch("workers.engine.qwen.sf.read")
    @patch("workers.engine.qwen.httpx.Client.post")
    def test_synthesize_voice_clone_default_x_vector_only_mode_false(self, mock_post, mock_sf_read, engine):
        mock_response = MagicMock()
        mock_response.content = self._mock_wav_response()
        mock_response.raise_for_status = MagicMock()
        mock_post.return_value = mock_response

        mock_sf_read.return_value = (np.array([0.0, 0.0], dtype=np.float32), 24000)

        engine.synthesize_voice_clone(
            text="Hello",
            ref_audio="http://example.com/audio.wav",
            ref_text="Hello",
            language="English",
        )

        call_args = mock_post.call_args
        payload = call_args.kwargs["json"]
        assert payload["x_vector_only_mode"] is False

    @patch("workers.engine.qwen.sf.read")
    @patch("workers.engine.qwen.httpx.Client.post")
    def test_synthesize_voice_clone_with_x_vector_only_mode_true(self, mock_post, mock_sf_read, engine):
        mock_response = MagicMock()
        mock_response.content = self._mock_wav_response()
        mock_response.raise_for_status = MagicMock()
        mock_post.return_value = mock_response

        mock_sf_read.return_value = (np.array([0.0, 0.0], dtype=np.float32), 24000)

        engine.synthesize_voice_clone(
            text="Hello",
            ref_audio="http://example.com/audio.wav",
            ref_text="Hello",
            language="English",
            x_vector_only_mode=True,
        )

        call_args = mock_post.call_args
        payload = call_args.kwargs["json"]
        assert payload["x_vector_only_mode"] is True

    @patch("workers.engine.qwen.sf.read")
    @patch("workers.engine.qwen.httpx.Client.post")
    def test_synthesize_voice_clone_with_prompt_no_x_vector_flag(self, mock_post, mock_sf_read, engine):
        """synthesize_voice_clone_with_prompt does not send x_vector_only_mode — prompt is already baked."""
        mock_response = MagicMock()
        mock_response.content = self._mock_wav_response()
        mock_response.raise_for_status = MagicMock()
        mock_post.return_value = mock_response

        mock_sf_read.return_value = (np.array([0.0, 0.0], dtype=np.float32), 24000)

        engine.synthesize_voice_clone_with_prompt(
            text="Hello",
            voice_clone_prompt_b64="abc123",
            language="English",
        )

        call_args = mock_post.call_args
        payload = call_args.kwargs["json"]
        assert "x_vector_only_mode" not in payload
