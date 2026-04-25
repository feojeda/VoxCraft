---
phase: 01-core-tts-pipeline
plan: 02
subsystem: frontend
tags: [next.js, react, tailwind, typescript, tanstack-query, dark-theme]

# Dependency graph
requires:
  - phase: 01-core-tts-pipeline/01
    provides: Backend API schemas (Pydantic models) that frontend types mirror
provides:
  - Next.js 15 frontend app with dark theme and layout skeleton
  - Shared TypeScript types matching backend API contracts
  - Typed API client for backend communication
  - TanStack Query provider with polling defaults
  - PREDEFINED_SPEAKERS constant (9 Qwen3-TTS voices)
affects: [01-04, 01-05, frontend-ui]

# Tech tracking
tech-stack:
  added: [next@15, react@19, tailwindcss@4, @tanstack/react-query@5, zustand@5, wavesurfer.js@7, zod@3, lucide-react, vitest, pnpm]
  patterns: [app-router, css-custom-properties-dark-theme, typed-api-client, proxy-rewrite-cors]

key-files:
  created:
    - frontend/package.json
    - frontend/tsconfig.json
    - frontend/next.config.ts
    - frontend/postcss.config.mjs
    - frontend/.gitignore
    - frontend/src/app/globals.css
    - frontend/src/app/layout.tsx
    - frontend/src/app/page.tsx
    - frontend/src/lib/types.ts
    - frontend/src/lib/api-client.ts
    - frontend/src/lib/providers.tsx
  modified: []

key-decisions:
  - "Used pnpm as package manager per plan specification"
  - "Used native fetch for API client (no axios dependency) with typed error handling"
  - "CORS handled via Next.js rewrites proxy rather than backend CORS headers"
  - "Tailwind CSS 4 with @tailwindcss/postcss for PostCSS integration"

patterns-established:
  - "CSS custom properties for dark theme palette (defined in :root, consumed via var())"
  - "Typed API client pattern: generic request<T> function with ApiClientError class"
  - "Section-based layout with rounded cards, border, and surface backgrounds"
  - "TanStack Query provider with 30s staleTime for job polling"

requirements-completed: [TTS-01, TTS-02, OUT-01]

# Metrics
duration: 4min
completed: 2026-04-25
---

# Phase 1 Plan 2: Next.js Frontend Foundation Summary

**Next.js 15 app with dark theme (CSS custom properties), single-page vertical stack layout, typed API client using native fetch, and 9 predefined Qwen3-TTS speakers**

## Performance

- **Duration:** 4 min
- **Started:** 2026-04-25T22:37:03Z
- **Completed:** 2026-04-25T22:41:28Z
- **Tasks:** 2
- **Files modified:** 11

## Accomplishments
- Next.js 15 frontend initialized with TypeScript strict mode, Tailwind CSS 4, and App Router
- Dark theme applied globally using CSS custom properties (Linear/Vercel-inspired palette)
- Single-page vertical stack layout with three sections: text input, voice/settings, audio output
- Responsive design working on mobile and desktop viewports
- Shared TypeScript types matching backend Pydantic schemas exactly
- Typed API client with error handling using native fetch (no axios)
- PREDEFINED_SPEAKERS constant with all 9 Qwen3-TTS CustomVoice speakers
- TanStack Query provider configured with 30s staleTime for job polling
- API proxy via Next.js rewrites (localhost:8000) — no CORS issues in development

## Task Commits

Each task was committed atomically:

1. **Task 1: Initialize Next.js 15 app with dark theme and layout skeleton** - `986a1fd` (feat)
2. **Task 2: Create shared types and API client with TanStack Query** - `fded5af` (feat)

## Files Created/Modified
- `frontend/package.json` - Dependencies: next@15, react@19, tailwindcss@4, wavesurfer.js@7, tanstack-query@5, zustand@5, zod@3, lucide-react
- `frontend/tsconfig.json` - TypeScript strict mode with path aliases (@/*)
- `frontend/next.config.ts` - API proxy rewrite to localhost:8000
- `frontend/postcss.config.mjs` - Tailwind CSS 4 PostCSS plugin
- `frontend/.gitignore` - Node/Next.js ignores
- `frontend/src/app/globals.css` - Dark theme CSS custom properties, scrollbar styling
- `frontend/src/app/layout.tsx` - Root layout with Inter font, metadata, Providers wrapper
- `frontend/src/app/page.tsx` - Single-page layout with three sections (text input, voice/settings, audio)
- `frontend/src/lib/types.ts` - Shared types: TTSRequest, TTSJobResponse, JobStatusResponse, Speaker, PREDEFINED_SPEAKERS
- `frontend/src/lib/api-client.ts` - Typed API client with createTTSJob, getJobStatus, getSpeakers
- `frontend/src/lib/providers.tsx` - TanStack Query provider with polling defaults

## Decisions Made
- Used pnpm as package manager — plan specified pnpm, faster than npm
- Native fetch for API client — no axios dependency, simpler, Edge-compatible
- CORS via Next.js rewrites proxy — frontend calls /api/* which proxies to backend, avoiding CORS complexity
- Tailwind CSS 4 with @tailwindcss/postcss — latest version with simplified PostCSS integration
- Malformed pnpm-workspace.yaml removed — was created by incorrect `pnpm config set` command

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Installed pnpm globally**
- **Found during:** Task 1 (project initialization)
- **Issue:** pnpm was not installed on the system
- **Fix:** Installed via `npm install -g pnpm`
- **Files modified:** None (system-level install)
- **Verification:** `pnpm --version` returns 10.33.2
- **Committed in:** N/A (pre-task setup)

**2. [Rule 3 - Blocking] Removed malformed pnpm-workspace.yaml**
- **Found during:** Task 2 (post-build cleanup)
- **Issue:** `pnpm config set onlyBuiltDependencies` created a broken pnpm-workspace.yaml with garbled content
- **Fix:** Deleted the file, kept onlyBuiltDependencies in package.json `pnpm` field instead
- **Files modified:** frontend/pnpm-workspace.yaml (deleted)
- **Verification:** Build passes, dependencies install correctly
- **Committed in:** Not committed (cleanup)

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both were infrastructure setup issues, no scope creep.

## Issues Encountered
None — both tasks executed cleanly after pnpm installation.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Frontend foundation ready for Plan 04 (text input + voice picker UI) and Plan 05 (audio player + WaveSurfer.js)
- All TypeScript types defined and importable for UI component plans
- API client ready to connect to backend (once Plan 03 endpoints are implemented)
- Dark theme and layout structure established for all future UI work

## Self-Check: PASSED

- All 11 key files verified present on disk
- Both commits (986a1fd, fded5af) found in git log
- `pnpm build` compiles and generates static pages successfully
- TypeScript type-check passes with no errors
- PREDEFINED_SPEAKERS has 9 entries verified

---
*Phase: 01-core-tts-pipeline*
*Completed: 2026-04-25*
