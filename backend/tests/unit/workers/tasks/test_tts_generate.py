"""Unit tests for tts_generate Celery task."""

from unittest.mock import AsyncMock, MagicMock, patch

import numpy as np
import pytest

from workers.engine.base import SynthesisResult
from workers.tasks.tts_generate import generate_speech


class TestGenerateSpeechVoiceClone:
    @patch("app.services.audio_service.audio_service")
    @patch("app.services.job_manager.job_manager")
    @patch("workers.tasks.tts_generate.get_model_manager")
    def test_passes_x_vector_only_mode_to_engine(self, mock_get_model_manager, mock_job_manager, mock_audio_service):
        mock_job_manager.update_job_status = AsyncMock()
        mock_job_manager.complete_job = AsyncMock()

        mock_engine = MagicMock()
        mock_engine.map_emotion_preset.return_value = ""
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

        generate_speech(
            job_id="job-123",
            text="Hello world",
            mode="voice-clone",
            speaker=None,
            language="English",
            speed=1.0,
            instruct=None,
            instructions=None,
            ref_audio="http://example.com/audio.wav",
            ref_text="Hello",
            x_vector_only_mode=True,
        )

        mock_engine.synthesize_voice_clone.assert_called_once()
        call_kwargs = mock_engine.synthesize_voice_clone.call_args.kwargs
        assert call_kwargs["x_vector_only_mode"] is True

    @patch("app.services.audio_service.audio_service")
    @patch("app.services.job_manager.job_manager")
    @patch("workers.tasks.tts_generate.get_model_manager")
    def test_default_x_vector_only_mode_is_false(self, mock_get_model_manager, mock_job_manager, mock_audio_service):
        mock_job_manager.update_job_status = AsyncMock()
        mock_job_manager.complete_job = AsyncMock()

        mock_engine = MagicMock()
        mock_engine.map_emotion_preset.return_value = ""
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

        generate_speech(
            job_id="job-123",
            text="Hello world",
            mode="voice-clone",
            speaker=None,
            language="English",
            speed=1.0,
            instruct=None,
            instructions=None,
            ref_audio="http://example.com/audio.wav",
            ref_text="Hello",
        )

        call_kwargs = mock_engine.synthesize_voice_clone.call_args.kwargs
        assert call_kwargs["x_vector_only_mode"] is False
