"""Pydantic schemas for voice comparison requests and responses."""

from pydantic import BaseModel, Field


class CompareVoiceConfig(BaseModel):
    """Voice configuration for a single comparison entry."""

    mode: str = Field(default="speech", pattern="^(speech|voice-clone|voice-design)$")
    speaker: str | None = Field(default=None, description="Predefined speaker ID (e.g. 'ryan')")
    cloned_voice_id: str | None = Field(default=None, description="Cloned voice ID to use")
    instruct: str | None = Field(default=None, description="Style instruction for speech mode")
    emotion_preset: str | None = Field(default=None, description="Emotion preset")
    instructions: str | None = Field(default=None, description="Voice description for voice-design mode")


class CompareRequest(BaseModel):
    """Request body for creating a voice comparison batch."""

    text: str = Field(..., min_length=1, max_length=50000, description="Text to synthesize")
    voices: list[CompareVoiceConfig] = Field(..., min_length=2, max_length=20, description="Voice configurations to compare (2-20)")
    language: str = Field(default="auto", description="Language or 'auto'")
    speed: float = Field(default=1.0, ge=0.5, le=2.0, description="Speed multiplier 0.5-2.0")


class CompareJobItem(BaseModel):
    """Single job within a comparison batch."""

    job_id: str
    voice_name: str
    status: str
    progress: int = 0
    audio_wav_url: str | None = None
    audio_mp3_url: str | None = None
    error_message: str | None = None
    created_at: str | None = None
    completed_at: str | None = None


class CompareResponse(BaseModel):
    """Response returned after creating a comparison batch."""

    batch_id: str
    jobs: list[CompareJobItem]
    total: int
    completed_count: int
    failed_count: int
    status: str
    created_at: str | None = None
    completed_at: str | None = None
