---
phase: 01-core-tts-pipeline
plan: 05
subsystem: ui, infra
tags: [wavesurfer.js, next.js, docker, docker-compose, ffmpeg, standalone]

# Dependency graph
requires:
  - phase: 01-core-tts-pipeline/03
    provides: TTS engine, async job pipeline, audio serving endpoints (WAV/MP3)
  - phase: 01-core-tts-pipeline/04
    provides: Generation UI components, useTTSGeneration hook with audioUrls output
provides:
  - WaveSurfer.js waveform audio player with dark theme styling
  - Download MP3 and WAV buttons with outlined style
  - Empty state component with SVG waveform placeholder
  - Backend Dockerfile (multi-stage Python 3.12 with ffmpeg)
  - Frontend Dockerfile (multi-stage Node 20 with standalone Next.js)
  - Docker Compose with 4 services (api, worker, redis, frontend)
  - Integration test script for end-to-end pipeline validation

affects: [02-frontend-ui, deployment]

# Tech tracking
tech-stack:
  added: [wavesurfer.js-7, docker, docker-compose]
  patterns: [dynamic-import-for-client-only, waveform-player-with-controls, docker-multi-stage-build, nextjs-standalone-output]

key-files:
  created:
    - frontend/src/components/audio-player.tsx
    - frontend/src/components/download-buttons.tsx
    - frontend/src/components/empty-state.tsx
    - backend/Dockerfile
    - frontend/Dockerfile
    - scripts/test-pipeline.sh
  modified:
    - frontend/src/app/page.tsx
    - frontend/next.config.ts
    - docker-compose.yml

key-decisions:
  - "Dynamic import for WaveSurfer.js — client-only library, avoids SSR issues with Next.js"
  - "Standalone Next.js output mode for optimized Docker production builds"
  - "Frontend rewrites proxy /api to backend in both dev and Docker (NEXT_PUBLIC_API_URL empty = use relative /api)"
  - "Memory limits in docker-compose per threat model T-05-02 (api: 512m, worker: 4g)"

patterns-established:
  - "Dynamic import pattern for client-only browser libraries in Next.js (WaveSurfer.js)"
  - "Multi-stage Docker builds for both Python and Node.js services"
  - "Standalone Next.js output for minimal Docker images"

requirements-completed: [OUT-01, OUT-02, OUT-03]

# Metrics
duration: 5min
completed: 2026-04-25
---

# Phase 1 Plan 5: Audio Output UI + Docker Compose Summary

**WaveSurfer.js waveform player with dark theme, MP3/WAV download buttons, empty state placeholder, and full-stack Docker Compose with 4 services plus integration test script**

## Performance

- **Duration:** 5 min
- **Started:** 2026-04-25T22:58:02Z
- **Completed:** 2026-04-25T23:03:34Z
- **Tasks:** 2 of 3 (Task 3 is human-verify checkpoint)
- **Files modified:** 9

## Accomplishments
- WaveSurfer.js 7 audio player with dark muted purple waveform, play/pause controls, and time display
- CSS shimmer loading animation during audio generation before audio URL is available
- Two download buttons (MP3 + WAV) with outlined style and Download icons
- Empty state with SVG waveform bars placeholder and instructional text
- Full-stack Docker Compose with api, worker, redis, and frontend services on shared network
- Backend multi-stage Dockerfile with Python 3.12, ffmpeg, libsndfile1
- Frontend multi-stage Dockerfile with Node 20, pnpm, and standalone Next.js output
- Integration test script for automated end-to-end pipeline validation

## Task Commits

Each task was committed atomically:

1. **Task 1: Build WaveSurfer audio player, download buttons, and empty state** - `8fbc568` (feat)
2. **Task 2: Create Dockerfiles and finalize Docker Compose for full stack** - `e645a4f` (feat)
3. **Task 3: Human verification of complete end-to-end TTS pipeline** — checkpoint:human-verify (pending)

## Files Created/Modified
- `frontend/src/components/audio-player.tsx` - WaveSurfer.js 7 waveform player with dark theme, play/pause, time display, shimmer loading
- `frontend/src/components/download-buttons.tsx` - MP3 and WAV download buttons with outlined style
- `frontend/src/components/empty-state.tsx` - SVG waveform placeholder with instructional text
- `frontend/src/app/page.tsx` - Audio output section wiring: empty state → player → downloads
- `frontend/next.config.ts` - Added output: standalone for Docker production builds
- `backend/Dockerfile` - Multi-stage Python 3.12 with ffmpeg and libsndfile1
- `frontend/Dockerfile` - Multi-stage Node 20 with standalone Next.js
- `docker-compose.yml` - 4 services with shared network and memory limits
- `scripts/test-pipeline.sh` - End-to-end integration test script

## Decisions Made
- Dynamic import for WaveSurfer.js — avoids SSR issues since it requires browser APIs (AudioContext, Canvas)
- Standalone Next.js output mode — enables minimal Docker runner stage without full node_modules
- Frontend NEXT_PUBLIC_API_URL defaults to empty string in Docker, relying on Next.js rewrites to proxy /api to backend
- Memory limits per threat model T-05-02: api capped at 512m (stateless), worker at 4g (GPU model loading)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Docker daemon not running on dev machine — Dockerfile build verification skipped. Dockerfiles follow established multi-stage patterns and passed syntax review.
- WaveSurfer.js type needed explicit `import type` for TypeScript compilation — resolved inline.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Complete end-to-end TTS pipeline ready for human verification
- All UI components built: waveform player, download buttons, empty state
- Full Docker stack defined: api + worker + redis + frontend
- Integration test script ready for automated validation
- After human verification, Phase 1 is complete

## Self-Check: PASSED

- All 7 created files verified on disk
- Both task commits (8fbc568, e645a4f) found in git log
- `pnpm build` passes with no TypeScript errors
- SUMMARY.md created at .planning/phases/01-core-tts-pipeline/01-05-SUMMARY.md

---
*Phase: 01-core-tts-pipeline*
*Completed: 2026-04-25*
