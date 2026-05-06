"""Unit tests for voice_clone Celery task."""

from unittest.mock import AsyncMock, MagicMock, patch

import numpy as np
import pytest

from workers.engine.base import SynthesisResult
from workers.tasks.voice_clone import generate_voice_clone


class TestGenerateVoiceClone:
    @patch("app.services.audio_service.audio_service")
    @patch("app.services.job_manager.job_manager")
    @patch("app.core.database.async_session_factory")
    @patch("workers.tasks.voice_clone.get_model_manager")
    def test_uses_voice_x_vector_only_mode_when_no_prompt(self, mock_get_model_manager, mock_session_factory, mock_job_manager, mock_audio_service):
        mock_job_manager.update_job_status = AsyncMock()
        mock_job_manager.complete_job = AsyncMock()
        mock_job_manager.fail_job = AsyncMock()

        mock_voice = MagicMock()
        mock_voice.voice_clone_prompt_b64 = None
        mock_voice.audio_path = "/tmp/ref.wav"
        mock_voice.ref_text = "Hola"
        mock_voice.x_vector_only_mode = True

        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = mock_voice
        mock_session = MagicMock()
        mock_session.execute = AsyncMock(return_value=mock_result)
        mock_session_factory.return_value.__aenter__.return_value = mock_session

        mock_engine = MagicMock()
        mock_engine.synthesize_voice_clone.return_value = SynthesisResult(
            audio=np.array([0.0, 0.0], dtype=np.float32),
            sample_rate=24000,
            duration_seconds=0.5,
        )
        mock_model_manager = MagicMock()
        mock_model_manager.get_engine.return_value = mock_engine
        mock_get_model_manager.return_value = mock_model_manager

        mock_audio_service.save_wav.return_value = "/tmp/test.wav"
        mock_audio_service.convert_to_mp3.return_value = "/tmp/test.mp3"

        generate_voice_clone(
            job_id="job-123",
            text="Hello",
            voice_id="voice-456",
            language="English",
            x_vector_only_mode=False,
        )

        # When prompt is not cached, it should use the voice's x_vector_only_mode
        mock_engine.synthesize_voice_clone.assert_called_once()
        call_kwargs = mock_engine.synthesize_voice_clone.call_args.kwargs
        assert call_kwargs["x_vector_only_mode"] is True

    @patch("app.services.audio_service.audio_service")
    @patch("app.services.job_manager.job_manager")
    @patch("app.core.database.async_session_factory")
    @patch("workers.tasks.voice_clone.get_model_manager")
    def test_uses_prompt_when_available(self, mock_get_model_manager, mock_session_factory, mock_job_manager, mock_audio_service):
        mock_job_manager.update_job_status = AsyncMock()
        mock_job_manager.complete_job = AsyncMock()
        mock_job_manager.fail_job = AsyncMock()

        mock_voice = MagicMock()
        mock_voice.voice_clone_prompt_b64 = "cached_prompt_b64"
        mock_voice.audio_path = "/tmp/ref.wav"
        mock_voice.ref_text = "Hola"
        mock_voice.x_vector_only_mode = True

        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = mock_voice
        mock_session = MagicMock()
        mock_session.execute = AsyncMock(return_value=mock_result)
        mock_session_factory.return_value.__aenter__.return_value = mock_session

        mock_engine = MagicMock()
        mock_engine.synthesize_voice_clone_with_prompt.return_value = SynthesisResult(
            audio=np.array([0.0, 0.0], dtype=np.float32),
            sample_rate=24000,
            duration_seconds=0.5,
        )
        mock_model_manager = MagicMock()
        mock_model_manager.get_engine.return_value = mock_engine
        mock_get_model_manager.return_value = mock_model_manager

        mock_audio_service.save_wav.return_value = "/tmp/test.wav"
        mock_audio_service.convert_to_mp3.return_value = "/tmp/test.mp3"

        generate_voice_clone(
            job_id="job-123",
            text="Hello",
            voice_id="voice-456",
            language="English",
            x_vector_only_mode=False,
        )

        # When prompt is cached, it should use prompt path (no x_vector flag needed)
        mock_engine.synthesize_voice_clone_with_prompt.assert_called_once()
        call_kwargs = mock_engine.synthesize_voice_clone_with_prompt.call_args.kwargs
        assert "x_vector_only_mode" not in call_kwargs
