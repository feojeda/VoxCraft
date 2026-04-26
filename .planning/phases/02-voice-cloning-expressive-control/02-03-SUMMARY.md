# Plan 02-03 Summary: Task Integration

## Completed

### Celery Tasks
- `backend/workers/tasks/voice_clone.py` — New `generate_voice_clone` Celery task:
  - Fetches `ClonedVoice` from DB by `voice_id`
  - Calls `engine.synthesize_voice_clone()` with persisted audio path and ref_text
  - Saves WAV/MP3 and updates job status
  - Handles voice-not-found errors gracefully
- Updated `backend/workers/tasks/tts_generate.py`:
  - Added `emotion_preset` and `pronunciation_enabled` parameters
  - Maps emotion preset to instruct string via `engine.map_emotion_preset()`
  - Combines emotion preset + custom instruct when both provided
  - Applies pronunciation dictionary overrides when `pronunciation_enabled=True`
  - Falls back to speed-based instruct when no emotion/custom instruct provided

### API Endpoints
- Updated `backend/app/api/routes/tts.py`:
  - `POST /api/generate` now accepts `cloned_voice_id` and dispatches `generate_voice_clone` task
  - Validates cloned voice exists before dispatching (404 if not found)
  - Passes `emotion_preset` and `pronunciation_enabled` to `generate_speech` task
  - Maintains backward compatibility with existing `mode`-based requests
- Created `backend/app/api/routes/pronunciation.py`:
  - `POST /api/pronunciation` — create entry with duplicate detection (409)
  - `GET /api/pronunciation` — list all entries alphabetically
  - `DELETE /api/pronunciation/{entry_id}` — delete entry

### Schemas
- `backend/app/schemas/generation.py` — `GenerationRequest` with:
  - `cloned_voice_id` vs `speaker` validation (exactly one required)
  - `emotion_preset` enum validation
  - `instruct`, `pronunciation_enabled`, `speed` fields
- Updated `backend/app/schemas/tts.py` — added optional `cloned_voice_id`, `emotion_preset`, `pronunciation_enabled` to `TTSRequest` for backward compatibility

### App Wiring
- Updated `backend/app/main.py` — registered `pronunciation_router`
- Updated `backend/workers/celery_app.py` — added `workers.tasks.voice_clone` to `task_routes`

## Key Decisions
- Kept existing `TTSRequest` backward-compatible by adding new fields as optional
- `cloned_voice_id` takes precedence over `mode` when provided
- Pronunciation entries are fetched globally (no user filtering in Phase 2 — auth comes in Phase 3)

## Artifacts Created
- `backend/workers/tasks/voice_clone.py`
- `backend/app/api/routes/pronunciation.py`
- `backend/app/schemas/generation.py`

## Artifacts Modified
- `backend/workers/tasks/tts_generate.py`
- `backend/app/api/routes/tts.py`
- `backend/app/schemas/tts.py`
- `backend/app/main.py`
- `backend/workers/celery_app.py`

## Deviation Notes
- Plan expected `backend/app/api/routes/generate.py` but actual file is `backend/app/api/routes/tts.py`. All changes applied to existing file.

## Verification
- Voice clone task imports and has correct signature
- TTS task accepts new parameters
- Pronunciation router imports correctly
- Generation endpoint routes to correct task based on `cloned_voice_id`
