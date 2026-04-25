---
phase: 01-core-tts-pipeline
plan: 04
subsystem: frontend-ui
tags: [react, next.js, tanstack-query, lucide-react, tailwind, hooks, components]

# Dependency graph
requires:
  - phase: 01-core-tts-pipeline/02
    provides: Frontend foundation with types, API client, dark theme, and layout skeleton
provides:
  - Voice picker component with horizontal scrollable cards and speaker selection
  - Text input component with char/word count and validation error state
  - Speed slider component with 0.5x-2.0x range and styled thumb
  - Generate button with spinner and disabled state
  - Progress bar with indeterminate (queued) and determinate (processing) modes
  - Error message component with inline display and retry button
  - useTTSGeneration hook for full job lifecycle (create → poll → complete/fail)
  - Complete single-page generation UI wired to backend API via TanStack Query
affects: [01-05, frontend-audio-player]

# Tech tracking
tech-stack:
  added: [styled-jsx]
  patterns: [tanstack-query-polling-hook, generation-state-machine, component-composition-with-props]

key-files:
  created:
    - frontend/src/components/voice-picker.tsx
    - frontend/src/components/text-input.tsx
    - frontend/src/components/speed-slider.tsx
    - frontend/src/components/generate-button.tsx
    - frontend/src/components/progress-bar.tsx
    - frontend/src/components/error-message.tsx
    - frontend/src/hooks/use-tts-generation.ts
  modified:
    - frontend/src/app/page.tsx

key-decisions:
  - "Used TanStack Query refetchInterval for polling with dynamic stop on terminal status"
  - "Generation counter ref prevents stale polling updates from previous generations"
  - "styled-jsx for range slider thumb styling (built into Next.js, no extra dependency)"
  - "Native HTML range input for speed slider instead of third-party component"

patterns-established:
  - "Generation hook pattern: useMutation for create + useQuery with refetchInterval for polling"
  - "Component prop-driven design: all UI components are controlled via props, no internal state for data"
  - "Progress states: queued (pulsing indeterminate bar) → processing (filling bar with percentage) → terminal states hidden"

requirements-completed: [TTS-01, TTS-02, TTS-03]

# Metrics
duration: 4min
completed: 2026-04-25
---

# Phase 1 Plan 4: TTS Generation UI Summary

**Complete generation form with voice picker (9 scrollable cards), text input with validation, speed slider, TanStack Query polling hook, progress bar, and inline error handling — all wired to backend API**

## Performance

- **Duration:** 4 min
- **Started:** 2026-04-25T22:52:21Z
- **Completed:** 2026-04-25T22:56:22Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- Voice picker with 9 predefined speakers in horizontal scrollable row with accent ring selection and scroll arrows
- Text input with fixed height, char/word counters, max 50K characters, and red outline validation error state
- Speed slider (0.5x–2.0x) with styled thumb, labeled markers, and current value display
- useTTSGeneration hook managing full job lifecycle: create → poll → complete/fail with generation counter for stale state protection
- Generate button with Play icon, Loader spinner during generation, and disabled state when inputs invalid
- Progress bar with pulsing indeterminate (queued) and smooth filling (processing) animations
- Inline error message with AlertCircle icon and Retry button

## Task Commits

Each task was committed atomically:

1. **Task 1: Build voice picker, text input, and speed slider components** - `4ab7429` (feat)
2. **Task 2: Build generate button, progress bar, polling hook, and error handling** - `83df59f` (feat)

## Files Created/Modified
- `frontend/src/components/voice-picker.tsx` - Horizontal scrollable card row with 9 speakers, accent selection, scroll arrows
- `frontend/src/components/text-input.tsx` - Fixed-height textarea with char/word count and validation error state
- `frontend/src/components/speed-slider.tsx` - Range slider 0.5x-2.0x with markers and styled thumb
- `frontend/src/components/generate-button.tsx` - Button with Play icon, spinner, disabled state
- `frontend/src/components/progress-bar.tsx` - Pulsing indeterminate + smooth fill progress display
- `frontend/src/components/error-message.tsx` - Inline error box with retry button
- `frontend/src/hooks/use-tts-generation.ts` - TanStack Query hook for job creation and polling
- `frontend/src/app/page.tsx` - Full generation UI with component composition and state management

## Decisions Made
- TanStack Query `refetchInterval` with dynamic stop — polling stops when query returns terminal status (completed/failed), avoids unnecessary requests
- Generation counter ref (`generationRef`) — prevents stale polling updates from a previous generation cycle from overwriting current state (D-14 compliance)
- styled-jsx for range slider thumb — native to Next.js, avoids adding a CSS-in-JS dependency for a single component
- Native HTML `<input type="range">` — sufficient for speed control, avoids third-party slider component dependency

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None — both tasks built and compiled cleanly.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Generation UI fully wired and ready for Plan 05 (audio player with WaveSurfer.js)
- Audio output section has placeholder that will be replaced with WaveSurfer player
- Hook returns `audioUrls` (wav/mp3) that Plan 05 will consume for playback and download
- All validation, error handling, and progress states complete

## Self-Check: PASSED

- All 8 key files verified present on disk
- Both commits (4ab7429, 83df59f) found in git log
- `pnpm build` compiles successfully with no TypeScript errors
- All component exports verified: VoicePicker, TextInput, SpeedSlider, GenerateButton, ProgressBar, ErrorMessage, useTTSGeneration
- API client integration verified: createTTSJob and getJobStatus calls in use-tts-generation.ts

---
*Phase: 01-core-tts-pipeline*
*Completed: 2026-04-25*
