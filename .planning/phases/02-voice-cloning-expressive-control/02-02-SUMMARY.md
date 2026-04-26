# Plan 02-02 Summary: Prosody Backend

## Completed

### Exception Hierarchy
- `backend/app/core/exceptions.py` — Custom exception hierarchy:
  - `TTSQwenError` (base)
  - `EngineLoadError`
  - `SynthesisError`
  - `AudioValidationError`
  - `ConfigError`

### TTS Engine Extensions
- Extended `backend/workers/engine/qwen.py` with:
  - `EMOTION_PRESETS` class attribute mapping 5 emotions to natural language instruct strings
  - `map_emotion_preset(preset: str) -> str` classmethod
  - Existing `synthesize()` already accepts `instruct` parameter (Phase 1)
  - Existing `synthesize_voice_clone()` already supports voice cloning (Phase 1)

### Pronunciation Dictionary Service
- `backend/app/services/pronunciation.py` — Pure service module:
  - `apply_pronunciation_dict(text, entries)` — word-boundary regex replacements, case-insensitive, longest-first sorting
  - `apply_pronunciation_to_text(text, entries)` — public interface
  - `get_pronunciation_entries(db_session, user_id)` — async DB fetch

## Key Decisions
- Engine is HTTP-based (not local PyTorch), so `load_clone_model()` and `create_clone_prompt()` are unnecessary — the external TTS server handles model loading
- Emotion presets are static mappings to instruct strings that feed into the existing `instructions` parameter of the HTTP API
- Pronunciation service is pure (no FastAPI imports) for reuse in Celery workers

## Artifacts Created
- `backend/app/core/exceptions.py`
- `backend/app/services/pronunciation.py`

## Artifacts Modified
- `backend/workers/engine/qwen.py` — added emotion preset mapping

## Deviation Notes
- Plan expected `backend/workers/engine/qwen_engine.py` but actual file is `qwen.py` (Phase 1 naming). Changes applied to existing file instead of creating new one.
- Plan expected PyTorch model loading methods, but engine is HTTP-based. Voice clone and prosody already supported via HTTP API from Phase 1.

## Verification
- `map_emotion_preset("happy")` returns "Speak happily and cheerfully"
- `map_emotion_preset("neutral")` returns empty string
- Pronunciation service correctly applies word-boundary replacements
- All exceptions are importable and inherit from TTSQwenError
