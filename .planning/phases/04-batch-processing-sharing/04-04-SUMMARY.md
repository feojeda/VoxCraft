---
phase: 04-batch-processing-sharing
plan: 04
subsystem: frontend
tags: [react, nextjs, typescript, batch, sharing]

# Dependency graph
requires:
  - phase: 04-batch-processing-sharing
    plan: 01
    provides: BatchJob model, batch schemas, ShareLink model
  - phase: 04-batch-processing-sharing
    plan: 02
    provides: Batch API routes (/batches, /batches/{id}/download)
  - phase: 04-batch-processing-sharing
    plan: 03
    provides: Share API routes (/shares, /shares/public/{token})
provides:
  - Batch and share TypeScript types
  - Extended API client with batch and share methods
  - CSV batch upload component with drag-and-drop
  - Batch list page at /batches
  - Batch detail page at /batches/[batchId] with hybrid display
  - ZIP download with format selector
  - Polling-based batch progress tracking
affects:
  - 04-05-PLAN.md (frontend sharing and integration — share button, public page)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "React Query useQuery with refetchInterval for polling"
    - "Blob response handling for ZIP downloads via URL.createObjectURL"
    - "Hybrid UI pattern: table during processing, cards when completed"
    - "Drag-and-drop file upload with validation feedback"

key-files:
  created:
    - frontend/src/components/batch-upload.tsx
    - frontend/src/app/batches/page.tsx
    - frontend/src/app/batches/[batchId]/page.tsx
  modified:
    - frontend/src/lib/types.ts
    - frontend/src/lib/api-client.ts

key-decisions:
  - "Added blob response handling to request() helper for ZIP downloads — auto-fix for broken binary download"
  - "Kept ProgressBar as local component in batch detail rather than reusing existing progress-bar.tsx because existing component is job-status-specific (shows 'Queued...' / 'Processing...') while batch progress needs count text and simpler styling"

requirements-completed: [OUT-05, OUT-06]

# Metrics
duration: 5min
completed: 2026-04-26
---

# Phase 04 Plan 04: Frontend Batch UI Summary

**Frontend batch processing UI with drag-and-drop CSV upload, real-time progress tracking, hybrid table/card display, and ZIP download with format selector**

## Performance

- **Duration:** 5 min
- **Started:** 2026-04-26T07:28:23Z
- **Completed:** 2026-04-26T07:33:00Z
- **Tasks:** 3
- **Files modified:** 5 (3 created, 2 modified)

## Accomplishments

- Extended TypeScript types with `BatchItem`, `BatchJob`, `BatchListResponse`, `ShareLink`, `ShareListResponse`, `SharePublicData`
- Extended `apiClient` with 8 new methods: `getBatches`, `uploadBatch`, `getBatch`, `downloadBatchZip`, `createShare`, `getShares`, `revokeShare`, `getPublicShare`
- Fixed `request()` helper to detect `application/zip` responses and return `response.blob()` instead of `response.json()`
- Created `BatchUpload` component with drag-and-drop zone, file validation (CSV type, 1MB size limit), loading state, and error feedback
- Created `/batches` list page with React Query fetching, status badges, completion counts, and navigation to detail
- Created `/batches/[batchId]` detail page with:
  - 3-second polling that stops on completion/failure
  - Overall progress bar with "{completed} of {total} completed" text (D-06)
  - ZIP download with format dropdown: MP3 only or MP3 + WAV (D-10)
  - Table view during processing/queued (compact, scannable) (D-05)
  - Card view when completed (audio player + download buttons per item) (D-07)
  - Red error text for failed items
  - Back navigation to batch list

## Task Commits

| Task | Description | Commit |
|------|-------------|--------|
| 1 | Add batch and share TypeScript types and API client methods | `5c9182b` |
| 2 | Create batch upload component and batch list page | `8da3dc4` |
| 3 | Create batch detail page with hybrid display | `28d3cf4` |

**Plan metadata:** `28d3cf4` (docs: complete plan)

## Files Created/Modified

- `frontend/src/lib/types.ts` — Added batch and share TypeScript interfaces
- `frontend/src/lib/api-client.ts` — Added 8 new API methods; fixed blob response handling for ZIP downloads
- `frontend/src/components/batch-upload.tsx` — New drag-and-drop CSV upload component (170 lines)
- `frontend/src/app/batches/page.tsx` — New batch list page with upload + listing (147 lines)
- `frontend/src/app/batches/[batchId]/page.tsx` — New batch detail page with hybrid display (332 lines)

## Decisions Made

1. **Blob response handling in request() helper:** The existing `request()` function unconditionally called `response.json()`. For ZIP downloads (binary blob), this would fail. Added content-type detection: if `application/zip`, return `response.blob()` instead. This keeps the API client unified while supporting both JSON and binary responses.

2. **Local ProgressBar component:** Rather than importing the existing `progress-bar.tsx` (which shows "Queued..." / "Processing..." labels and is job-status-specific), the batch detail page defines a simpler `ProgressBar` that just shows the fill percentage. The count text ("34 of 100 completed") is rendered separately above it.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] request() helper could not handle binary ZIP responses**
- **Found during:** Task 1
- **Issue:** The existing `request<T>` function always called `response.json()`. When `downloadBatchZip` tries to download a ZIP file, `response.json()` on binary data would throw or return garbage.
- **Fix:** Added content-type detection in `request()`: if the response `Content-Type` includes `application/zip`, return `response.blob()` instead of `response.json()`.
- **Files modified:** `frontend/src/lib/api-client.ts`
- **Commit:** `5c9182b`

## Issues Encountered

- `npx tsc --noEmit src/components/batch-upload.tsx src/app/batches/page.tsx` fails when run outside project root because tsc needs tsconfig.json context. Using `npx tsc --noEmit -p tsconfig.json` from the `frontend/` directory works correctly.

## Known Stubs

No stubs found — all components have real implementations:
- BatchUpload fully handles drag-and-drop, validation, upload, and completion callback
- Batches page fully fetches and displays batch list
- Batch detail page fully polls, displays hybrid views, and handles ZIP downloads

## Threat Flags

| Flag | File | Description |
|------|------|-------------|
| threat_flag: mitigation | frontend/src/components/batch-upload.tsx | Client-side file type filter (.csv only, 1MB max) as first-line defense; backend validation already exists from Plan 02 |
| threat_flag: mitigation | frontend/src/app/batches/[batchId]/page.tsx | 3-second poll interval with automatic stop on completion/failure prevents infinite polling (T-04-16) |

## Next Phase Readiness

- Frontend batch UI is complete and ready for integration with sharing features (04-05)
- Share types and API methods are already in place for the next plan
- Batch navigation will need a "Batches" link in top-nav (expected in 04-05)
- No blockers

## Self-Check: PASSED

- [x] `frontend/src/lib/types.ts` contains all new batch/share types
- [x] `frontend/src/lib/api-client.ts` imports and uses all new types
- [x] `frontend/src/components/batch-upload.tsx` exists and has valid syntax
- [x] `frontend/src/app/batches/page.tsx` exists and has valid syntax
- [x] `frontend/src/app/batches/[batchId]/page.tsx` exists and has valid syntax
- [x] All commits exist in git history (`5c9182b`, `8da3dc4`, `28d3cf4`)
- [x] TypeScript compilation passes for entire frontend project
- [x] Acceptance criteria from PLAN.md verified for all 3 tasks

**Self-check result: All files and commits verified successfully.**

---
*Phase: 04-batch-processing-sharing*
*Completed: 2026-04-26*
