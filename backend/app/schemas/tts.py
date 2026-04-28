"""Pydantic schemas for TTS generation requests and responses.

Validates user input for text-to-speech synthesis and defines
the shape of job status responses returned to the frontend.
"""

from datetime import datetime

from pydantic import BaseModel, Field


class TTSRequest(BaseModel):
    """Request body for creating a new TTS generation job.

    The text field has a maximum length of 50000 characters to prevent
    abuse (per threat model T-01-01). Speed is clamped between 0.5 and 2.0.

    Supports three modes:
    - speech: Use predefined speakers (CustomVoice model)
    - voice-design: Create a voice from text description (VoiceDesign model)
    - voice-clone: Clone a voice from reference audio (Base model)
    """

    text: str = Field(..., min_length=1, max_length=50000, description="Text to synthesize")
    mode: str = Field(default="speech", pattern="^(speech|voice-design|voice-clone)$", description="TTS mode")
    speaker: str | None = Field(default=None, description="Speaker name for speech mode (e.g., 'ryan', 'serena')")
    cloned_voice_id: str | None = Field(default=None, description="Use persisted cloned voice instead of ref_audio")
    language: str = Field(default="auto", description="Language or 'auto'")
    speed: float = Field(default=1.0, ge=0.5, le=2.0, description="Speed multiplier 0.5-2.0")
    instruct: str | None = Field(default=None, description="Natural language instruction for style/emotion (speech mode)")
    instructions: str | None = Field(default=None, description="Voice description for voice-design mode")
    ref_audio: str | None = Field(default=None, description="Reference audio path/URL/base64 for voice-clone mode")
    ref_text: str | None = Field(default=None, description="Transcript of reference audio for voice-clone mode")
    emotion_preset: str | None = Field(default=None, description="Emotion preset: happy, sad, angry, neutral, whisper")
    pronunciation_enabled: bool = Field(default=False, description="Apply pronunciation dictionary overrides")


class TTSJobResponse(BaseModel):
    """Response returned immediately after creating a TTS job (HTTP 202)."""

    job_id: str
    status: str

    model_config = {"from_attributes": True}


class JobStatusResponse(BaseModel):
    """Full job status response for polling endpoints.

    Includes progress percentage (0-100), audio URLs when complete,
    and error details on failure.
    """

    id: str
    status: str
    progress: int
    text: str
    mode: str
    language: str
    speaker: str | None
    speed: float
    instruct: str | None
    instructions: str | None
    ref_audio: str | None
    ref_text: str | None
    audio_wav_url: str | None
    audio_mp3_url: str | None
    error_message: str | None
    created_at: datetime | None
    completed_at: datetime | None

    model_config = {"from_attributes": True}
