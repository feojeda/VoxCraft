"""Unit tests for voice schemas."""

from datetime import datetime, timezone

import pytest
from app.schemas.voice import VoiceCreateRequest, VoiceResponse


class TestVoiceCreateRequest:
    def test_default_x_vector_only_mode_is_false(self):
        req = VoiceCreateRequest(name="Test", ref_text="Hello")
        assert req.x_vector_only_mode is False

    def test_x_vector_only_mode_can_be_true(self):
        req = VoiceCreateRequest(name="Test", ref_text="Hello", x_vector_only_mode=True)
        assert req.x_vector_only_mode is True

    def test_ref_text_is_optional(self):
        req = VoiceCreateRequest(name="Test")
        assert req.ref_text is None

    def test_ref_text_can_be_provided(self):
        req = VoiceCreateRequest(name="Test", ref_text="Hello world")
        assert req.ref_text == "Hello world"


class TestVoiceResponse:
    def test_default_x_vector_only_mode_is_false(self):
        resp = VoiceResponse(
            id="123",
            name="Test",
            audio_path="/tmp/test.wav",
            ref_text="Hello",
            duration_seconds=1.0,
            sample_rate=24000,
            created_at=datetime.now(timezone.utc),
        )
        assert resp.x_vector_only_mode is False

    def test_x_vector_only_mode_can_be_true(self):
        resp = VoiceResponse(
            id="123",
            name="Test",
            audio_path="/tmp/test.wav",
            ref_text="Hello",
            duration_seconds=1.0,
            sample_rate=24000,
            x_vector_only_mode=True,
            created_at=datetime.now(timezone.utc),
        )
        assert resp.x_vector_only_mode is True

    def test_ref_text_can_be_null(self):
        resp = VoiceResponse(
            id="123",
            name="Test",
            audio_path="/tmp/test.wav",
            ref_text=None,
            duration_seconds=1.0,
            sample_rate=24000,
            created_at=datetime.now(timezone.utc),
        )
        assert resp.ref_text is None
