---
phase: 04-batch-processing-sharing
plan: 02
subsystem: backend
tags: [fastapi, celery, csv, zip, batch]

# Dependency graph
requires:
  - phase: 04-batch-processing-sharing
    plan: 01
    provides: BatchJob model, Job batch_id column, batch schemas
provides:
  - BatchService with CSV parsing, job creation, ZIP streaming
  - Batch API routes (upload, list, status, download)
  - Batch router wired into FastAPI app
affects:
  - 04-03-PLAN.md (share service)
  - 04-04-PLAN.md (frontend batch UI)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Module-level singleton for service classes"
    - "FastAPI UploadFile + Form parameters for multipart uploads"
    - "StreamingResponse for binary file downloads"
    - "In-memory zipfile.ZipFile with arcname for safe filenames"

key-files:
  created:
    - backend/app/services/batch_service.py
    - backend/app/api/routes/batch.py
  modified:
    - backend/app/main.py

key-decisions:
  - "Created failed jobs for invalid CSV rows so they appear in batch results (satisfies must-have 'Each CSV row creates an individual Job')"
  - "Dispatches generate_voice_clone for cloned voices and generate_speech for predefined speakers"
  - "ZIP manifest includes ALL items with their actual status, not just completed ones"

# Metrics
duration: 5min
completed: 2026-04-26
---

# Phase 04 Plan 02: Backend Batch Service and API Summary

**Backend batch processing system with CSV parsing, per-row Celery job dispatch, batch status tracking, and on-demand ZIP generation with manifest**

## Performance

- **Duration:** 5 min
- **Started:** 2026-04-26T07:17:22Z
- **Completed:** 2026-04-26T07:22:00Z
- **Tasks:** 3
- **Files modified:** 3 (2 created, 1 modified)

## Accomplishments

- Created `BatchService` with full batch lifecycle: CSV parsing, job creation, status tracking, ZIP generation
- Implemented CSV parser with UTF-8-BOM support, strict header validation, and 100-row maximum enforcement
- Added per-row voice validation against both predefined speakers (`VALID_SPEAKER_IDS`) and cloned voices (`ClonedVoice` table)
- Dispatches appropriate Celery tasks (`generate_speech` for predefined speakers, `generate_voice_clone` for cloned voices)
- Built on-demand ZIP streaming with sanitized filenames (`001_preview.mp3`) and manifest.csv
- Created four REST endpoints: upload (202), list (paginated), status (with items), download (StreamingResponse)
- Wired batch router into FastAPI main application

## Task Commits

| Task | Description | Commit |
|------|-------------|--------|
| 1 | Create batch service with CSV parsing and ZIP generation | `5e242c5` |
| 2 | Create batch API routes | `38cdbea` |
| 3 | Wire batch router into main.py | `826df8b` |

## Files Created/Modified

- `backend/app/services/batch_service.py` — New BatchService class (468 lines)
- `backend/app/api/routes/batch.py` — New batch API routes (131 lines)
- `backend/app/main.py` — Added batch_router import and registration

## Decisions Made

1. **Failed jobs for invalid rows:** The plan stated "skip job creation" for invalid rows, but the must-have requirement says "Each CSV row creates an individual Job linked to the batch." To satisfy both, invalid rows create jobs that are immediately marked as `failed` with descriptive error messages. This ensures every row appears in batch results.

2. **Dual Celery task dispatch:** Predefined speakers dispatch `generate_speech.delay()`; cloned voices dispatch `generate_voice_clone.delay()`. This mirrors the existing tts.py logic and ensures correct processing for both voice types.

3. **Dynamic batch count updates:** `get_batch_with_items` recalculates `completed_count` and `failed_count` from actual job statuses on each call, keeping batch metadata in sync with Celery task completions without requiring background polling.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical Functionality] Invalid rows must create jobs to appear in batch results**
- **Found during:** Task 1
- **Issue:** The plan instructed skipping job creation for invalid rows, but the must-have requirement states every CSV row must create a Job. Skipping would leave invalid rows invisible in batch status responses.
- **Fix:** Invalid rows now create jobs that are immediately marked as `failed` with a descriptive `error_message`. This satisfies both the must-have and the acceptance criteria that invalid rows are "counted as failed."
- **Files modified:** `backend/app/services/batch_service.py`
- **Commit:** `5e242c5`

**2. [Rule 2 - Missing Critical Functionality] Cloned voices need generate_voice_clone dispatch**
- **Found during:** Task 1
- **Issue:** The plan specified dispatching `generate_speech.delay()` for all valid rows, but cloned voices require `generate_voice_clone.delay()` (different task signature, fetches voice from DB).
- **Fix:** BatchService detects whether a voice is a cloned voice or predefined speaker and dispatches the appropriate Celery task.
- **Files modified:** `backend/app/services/batch_service.py`
- **Commit:** `5e242c5`

## Issues Encountered

- `python` command not available on macOS; used `python3` for verification (no impact)
- Full module import of `app.api.routes.batch` fails in dev environment due to missing `jose` dependency (pre-existing, affects all route files equally); AST syntax validation confirmed file correctness

## Known Stubs

No stubs found — all methods have real implementations with proper database queries, Celery dispatch, and ZIP generation.

## Threat Flags

No new threat surface beyond what is documented in the plan's threat model. All batch endpoints are auth-protected via `get_current_user`, batch ownership is verified before ZIP generation and status retrieval, and CSV parsing is strict (headers validated, no arbitrary code execution).

## Next Phase Readiness

- Batch service and routes are ready for frontend integration (04-04)
- Share service (04-03) can be built independently
- No blockers

## Self-Check: PASSED

- [x] `backend/app/services/batch_service.py` exists and is importable
- [x] `backend/app/api/routes/batch.py` exists and has valid syntax
- [x] `backend/app/main.py` contains batch_router import and include_router
- [x] All commits exist in git history (`5e242c5`, `38cdbea`, `826df8b`)
- [x] Acceptance criteria from PLAN.md verified for all 3 tasks

---
*Phase: 04-batch-processing-sharing*
*Completed: 2026-04-26*
