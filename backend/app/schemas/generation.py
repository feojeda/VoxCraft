"""Pydantic schemas for generation requests with Phase 2 features.

Extends the base TTS request to support cloned voices, emotion presets,
prosody instructions, and pronunciation dictionary overrides.
"""

from pydantic import BaseModel, Field, model_validator


class GenerationRequest(BaseModel):
    """Request body for creating a new TTS generation job (Phase 2).

    Supports both predefined speakers and cloned voices, with prosody
    control via emotion presets and natural language instructions.
    """

    text: str = Field(
        ...,
        min_length=1,
        max_length=50000,
        description="Text to synthesize",
    )
    speaker: str | None = Field(
        default=None,
        description="Predefined speaker (required unless cloned_voice_id provided)",
    )
    cloned_voice_id: str | None = Field(
        default=None,
        description="Use cloned voice instead of predefined speaker",
    )
    language: str = Field(default="auto", description="Language or 'auto'")
    speed: float = Field(
        default=1.0,
        ge=0.5,
        le=2.0,
        description="Speed multiplier 0.5-2.0",
    )
    instruct: str | None = Field(
        default=None,
        description="Natural language prosody instruction",
    )
    emotion_preset: str | None = Field(
        default=None,
        description="Emotion preset: happy, sad, angry, neutral, whisper",
    )
    pronunciation_enabled: bool = Field(
        default=False,
        description="Apply pronunciation dictionary overrides",
    )

    @model_validator(mode="after")
    def validate_voice_source(self) -> "GenerationRequest":
        """Ensure exactly one voice source is provided."""
        if not self.speaker and not self.cloned_voice_id:
            raise ValueError("Either speaker or cloned_voice_id must be provided")
        if self.speaker and self.cloned_voice_id:
            raise ValueError("Cannot specify both speaker and cloned_voice_id")
        return self

    @model_validator(mode="after")
    def validate_emotion_preset(self) -> "GenerationRequest":
        """Ensure emotion_preset is a valid value."""
        if self.emotion_preset and self.emotion_preset not in {
            "happy",
            "sad",
            "angry",
            "neutral",
            "whisper",
        }:
            raise ValueError(
                f"Invalid emotion_preset: {self.emotion_preset}. "
                "Valid values: happy, sad, angry, neutral, whisper"
            )
        return self
