"""Unit tests for TTS schemas."""

import pytest
from app.schemas.tts import TTSRequest, JobStatusResponse


class TestTTSRequest:
    def test_default_x_vector_only_mode_is_false(self):
        req = TTSRequest(text="Hello world")
        assert req.x_vector_only_mode is False

    def test_x_vector_only_mode_can_be_true(self):
        req = TTSRequest(text="Hello world", x_vector_only_mode=True)
        assert req.x_vector_only_mode is True


class TestJobStatusResponse:
    def test_includes_x_vector_only_mode(self):
        resp = JobStatusResponse(
            id="job-123",
            status="queued",
            progress=0,
            text="Hello",
            mode="voice-clone",
            language="English",
            speaker=None,
            speed=1.0,
            instruct=None,
            instructions=None,
            ref_audio=None,
            ref_text=None,
            x_vector_only_mode=True,
            audio_wav_url=None,
            audio_mp3_url=None,
            error_message=None,
            created_at=None,
            completed_at=None,
        )
        assert resp.x_vector_only_mode is True
