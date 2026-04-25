---
phase: 01-core-tts-pipeline
plan: 03
subsystem: api, engine, workers
tags: [qwen3-tts, celery, fastapi, pydantic, soundfile, ffmpeg, numpy, torch]

# Dependency graph
requires:
  - phase: 01-core-tts-pipeline
    provides: FastAPI skeleton, Job model, Celery config, Pydantic schemas, database setup
provides:
  - BaseTTSEngine abstract interface with SynthesisResult
  - QwenTTSEngine adapter wrapping Qwen3-TTS generate_custom_voice
  - ModelManager singleton with lazy GPU model loading and CUDA warmup
  - speed_to_instruct mapping for 0.5-2.0 speed range
  - Async job pipeline: POST /generate → Celery task → WAV + MP3 output
  - JobManager for full job lifecycle (create, update, complete, fail)
  - AudioService for WAV saving and FFmpeg-based MP3 conversion
  - Text chunking with sentence boundary splitting
  - GET /api/voices with 9 predefined speakers
  - GET /api/audio/{job_id}/wav and /mp3 file serving endpoints
  - Speaker input validation against known catalog

affects: [01-core-tts-pipeline, 02-frontend-ui]

# Tech tracking
tech-stack:
  added: [qwen-tts, torch, soundfile, ffmpeg]
  patterns: [engine-adapter-pattern, singleton-model-loader, lazy-gpu-imports, async-job-lifecycle, text-chunking-at-sentence-boundaries]

key-files:
  created:
    - backend/workers/engine/__init__.py
    - backend/workers/engine/base.py
    - backend/workers/engine/qwen.py
    - backend/workers/engine/model_manager.py
    - backend/workers/tasks/__init__.py
    - backend/workers/tasks/tts_generate.py
    - backend/app/services/__init__.py
    - backend/app/services/job_manager.py
    - backend/app/services/audio_service.py
    - backend/app/api/routes/tts.py
    - backend/app/api/routes/voices.py
    - backend/app/api/routes/audio.py
  modified:
    - backend/app/main.py

key-decisions:
  - "GPU dependencies (torch, soundfile, numpy) use lazy imports — only imported inside functions, not at module level — enabling import verification without CUDA hardware"
  - "Text chunking returns text as-is if it fits within max_chars (400) — only splits when necessary"
  - "Speed control via speed_to_instruct mapping to natural language, not numeric parameter (Qwen3-TTS has no speed parameter)"
  - "Celery task uses asyncio.run() to bridge async SQLAlchemy from synchronous task context"

patterns-established:
  - "Engine adapter pattern: BaseTTSEngine ABC → QwenTTSEngine concrete adapter wrapping model API"
  - "Lazy GPU imports: torch, soundfile, numpy imported inside methods, not at module level"
  - "Singleton model loader: ModelManager with get_model_manager() factory for one model per worker process"
  - "Async job lifecycle: queued → processing (with progress %) → completed/failed"

requirements-completed: [TTS-01, TTS-02, TTS-03, TTS-04, OUT-01, OUT-02, OUT-03]

# Metrics
duration: 6min
completed: 2026-04-25
---

# Phase 1 Plan 03: TTS Engine + Async Job Pipeline Summary

**Complete TTS engine adapter wrapping Qwen3-TTS with async Celery job pipeline, text chunking, WAV/MP3 audio serving, and 9-speaker catalog**

## Performance

- **Duration:** 6 min
- **Started:** 2026-04-25T22:43:54Z
- **Completed:** 2026-04-25T22:50:38Z
- **Tasks:** 2
- **Files modified:** 13

## Accomplishments
- BaseTTSEngine abstract interface with QwenTTSEngine adapter wrapping Qwen3-TTS generate_custom_voice API
- ModelManager singleton with lazy GPU model loading, CUDA kernel warmup, and VRAM cleanup
- Async job pipeline: POST /api/generate → 202 with job_id → Celery task → WAV + MP3 output
- Text chunking strategy splitting at sentence boundaries, commas, then hard splits for 5000+ word inputs
- Full API surface: POST /generate, GET /jobs/{id}, GET /voices (9 speakers), GET /audio/{id}/wav|mp3
- Speaker validation against known catalog, speed-to-instruct mapping, progress tracking

## Task Commits

Each task was committed atomically:

1. **Task 1: Build TTS engine adapter and model manager** - `ae42e98` (feat)
2. **Task 2: Build async job pipeline with text chunking and audio serving** - `9a6620d` (feat)

## Files Created/Modified
- `backend/workers/engine/base.py` - BaseTTSEngine ABC with SynthesisResult dataclass
- `backend/workers/engine/qwen.py` - QwenTTSEngine adapter wrapping Qwen3-TTS model
- `backend/workers/engine/model_manager.py` - Singleton loader, speaker catalog, speed_to_instruct
- `backend/workers/engine/__init__.py` - Re-exports for engine public API
- `backend/workers/tasks/tts_generate.py` - Celery task with text chunking and audio concatenation
- `backend/workers/tasks/__init__.py` - Task module init
- `backend/app/services/job_manager.py` - Async job lifecycle CRUD operations
- `backend/app/services/audio_service.py` - WAV saving and FFmpeg MP3 conversion
- `backend/app/services/__init__.py` - Services module re-exports
- `backend/app/api/routes/tts.py` - POST /generate and GET /jobs/{id} endpoints
- `backend/app/api/routes/voices.py` - GET /voices with 9 predefined speakers
- `backend/app/api/routes/audio.py` - GET /audio/{id}/wav and /mp3 file serving
- `backend/app/main.py` - Updated to register tts, voices, audio routers

## Decisions Made
- GPU dependencies (torch, soundfile, numpy) use lazy imports — only imported inside functions, not at module level — enabling import verification without CUDA hardware on the dev machine
- Text chunking returns text as-is if it fits within max_chars (400) — only splits when necessary, avoiding unnecessary fragmentation of short texts
- Speed control via speed_to_instruct mapping to natural language instructions, since Qwen3-TTS generate_custom_voice has no native speed parameter
- Celery task uses asyncio.run() to bridge async SQLAlchemy from synchronous Celery task context

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Made GPU dependencies lazy imports**
- **Found during:** Task 1 (engine verification)
- **Issue:** torch, soundfile, numpy are not installed locally — they require CUDA and are only available in the Docker worker container
- **Fix:** Restructured imports to be lazy (inside functions/methods) rather than at module level. Used TYPE_CHECKING for type hints to preserve type safety
- **Files modified:** model_manager.py, audio_service.py, tts_generate.py, services/__init__.py
- **Verification:** All imports and logic tests pass without GPU packages
- **Committed in:** ae42e98 and 9a6620d (part of task commits)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Necessary for development without CUDA. No behavior change — lazy imports only affect load timing, not runtime behavior on GPU workers.

## Issues Encountered
None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Complete async TTS pipeline ready: text in → job queued → GPU inference → audio files out
- Engine abstraction enables future engine swaps without changing task logic
- API endpoints ready for frontend integration (Plan 04-05)
- All 9 speakers catalog available for voice selection UI
- Text chunking handles long inputs (5000+ words) with progress tracking

## Self-Check: PASSED

- All 12 key files verified on disk
- Both task commits (ae42e98, 9a6620d) present in git log
- Import verification passed (all modules importable without GPU packages)
- Text chunking verified with edge cases (empty, short, long text)
- Speaker catalog verified (9 speakers with metadata)

---
*Phase: 01-core-tts-pipeline*
*Completed: 2026-04-25*
