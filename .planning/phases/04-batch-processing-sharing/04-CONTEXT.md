# Phase 4: Batch Processing & Sharing - Context

**Gathered:** 2026-04-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Power users can process multiple texts at once and share generated audio via public links. This phase delivers: CSV batch upload with per-row voice selection, batch progress tracking with hybrid table/card display, on-demand ZIP download with user-selected formats and manifest, and permanent token-based public share links with optional expiration and full revoke control.

</domain>

<decisions>
## Implementation Decisions

### Batch Input Format & Structure
- **D-01:** Two-column CSV format: `text,voice` — each row specifies its own text and voice identifier
- **D-02:** Header row is required — first row must be `text,voice` (or localized equivalents); parser validates headers and rejects malformed uploads
- **D-03:** Maximum 100 entries per batch upload — hard limit to keep GPU processing time reasonable
- **D-04:** Invalid rows become failed jobs — every row becomes a job; rows with empty text, invalid voice IDs, or missing columns immediately fail with descriptive error messages; batch continues processing valid rows

### Batch Progress & Results Display
- **D-05:** Hybrid display mode — table view during processing (compact, scannable for 100 items), switches to card view for completed items (shows audio player and download buttons)
- **D-06:** Overall batch progress bar with count — shows "34 of 100 completed" at the top; single unified progress indicator rather than per-item bars
- **D-07:** Individual replay and download per item — each completed row/card has its own AudioPlayer and DownloadButtons (MP3 + WAV); users can preview before downloading ZIP
- **D-08:** Batch visibility in two places — History page shows a "Batch: N items" summary card linking to dedicated `/batches` page; `/batches` shows full batch detail with table/cards

### ZIP Download Contents & Timing
- **D-09:** On-demand ZIP generation — ZIP is built only when user clicks download; streams from existing audio files on disk; no pre-generated ZIP storage
- **D-10:** User chooses audio format at download time — dropdown/toggle offers "MP3 only" or "MP3 + WAV" before download starts
- **D-11:** File naming: index prefix + text preview — format: `001_first_20_chars_of_text.mp3`; preserves upload order and is self-documenting; sanitize filenames (remove special chars, limit length)
- **D-12:** Include manifest.csv inside ZIP — columns: index, filename, text, voice, status; helps users track what each audio file contains without opening the app

### Public Share Links
- **D-13:** Token-based URLs at `/share/{token}` — random unguessable token; works like Google Drive "anyone with the link"
- **D-14:** Default permanent links with optional expiration — user can set an expiration date when sharing; if no expiration, link works forever
- **D-15:** Share page shows audio player + source text + voice name + app branding — includes ttsQwen logo and "Generate your own" CTA for marketing/virality
- **D-16:** Full revoke control — users see all active share links in Account settings and can revoke any; revoked links show "Not found" or "Link revoked" page
- **D-17:** Any completed generation can be shared — share button appears on every completed history card and batch result; both single generations and individual batch items

### Agent's Discretion
- Exact CSV parsing library and validation logic (Python csv module vs pandas)
- Batch database schema (BatchJob model with one-to-many Job relationship vs batch_id column on Job)
- ZIP generation implementation (zipfile module, streaming vs temp file, cleanup strategy)
- Share token generation strategy (UUID4, hashid, or custom)
- Share page exact layout and styling within dark theme
- Expiration date UI (date picker vs preset durations: 7 days, 30 days, never)
- Whether to cache generated ZIP files temporarily (despite on-demand generation)
- Batch polling strategy (poll batch endpoint vs individual job polling)
- Error message wording for failed batch rows
- Manifest.csv exact column ordering and delimiter
</decisions>

<specifics>
## Specific Ideas

- Batch upload should feel like uploading a spreadsheet — drag-and-drop CSV file onto the generation page or a dedicated batch area
- The batch table during processing should feel like a build pipeline (GitHub Actions style) — clean, minimal, just status and progress
- Share page should be lightweight and fast — no auth required, minimal JS, audio player loads immediately
- The "Generate your own" CTA on share pages should link to the main app homepage
- Batch results cards should reuse the existing HistoryCard component styling for consistency
</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 4 Requirements & Scope
- `.planning/REQUIREMENTS.md` — OUT-05 (batch upload), OUT-06 (ZIP download), OUT-07 (public share links)
- `.planning/ROADMAP.md` — Phase 4 definition, success criteria, requirement traceability

### Prior Phase Context
- `.planning/phases/01-core-tts-pipeline/01-CONTEXT.md` — Core decisions: async job pattern (POST → job_id → polling), single-page generation layout, WaveSurfer.js audio player, inline progress bar
- `.planning/phases/03-user-accounts-complete-frontend/03-CONTEXT.md` — Auth decisions: login required for all features, card-based UI, load-more pagination, history page at /history, top navigation

### Project Constraints
- `.planning/PROJECT.md` — Stack constraints: React/Next.js frontend, FastAPI backend, SQLite database, Celery + Redis workers
- `.planning/codebase/CONVENTIONS.md` — Naming patterns, code style, type hint conventions

### Research & Architecture
- `.planning/research/STACK.md` — Technology stack with versions
- `.planning/research/ARCHITECTURE.md` — Async job pattern, frontend/backend/worker separation

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `frontend/src/components/audio-player.tsx` — reuse for individual batch item playback
- `frontend/src/components/download-buttons.tsx` — reuse for individual batch item MP3/WAV downloads
- `frontend/src/components/progress-bar.tsx` — reuse for overall batch progress bar
- `frontend/src/components/empty-state.tsx` — reuse for empty batch state
- `frontend/src/components/HistoryCard` pattern (from history/page.tsx) — reuse styling for completed batch items
- `frontend/src/hooks/use-tts-generation.ts` — polling pattern for job status; batch may need a useBatch hook that polls batch status
- `frontend/src/lib/api-client.ts` — needs new endpoints: batch upload, batch status, batch download, share create, share revoke, list shares
- `backend/app/models/job.py` — needs `batch_id` column or new `BatchJob` model with one-to-many relationship
- `backend/app/services/job_manager.py` — batch creation logic: parse CSV, create N jobs, dispatch N Celery tasks
- `backend/app/api/routes/audio.py` — currently auth-protected; needs public/unauthenticated variant for share tokens
- `backend/app/api/routes/history.py` — batch listing logic; filter by batch_id, include batch summary items
- `backend/app/api/routes/tts.py` — single job creation endpoint; batch endpoint can reuse job creation logic in a loop

### Established Patterns
- Next.js App Router with "use client" for interactive components
- React Query for server state (polling for job status, fetching lists)
- FastAPI async route handlers with SQLAlchemy async sessions via dependency injection
- Pydantic schemas in `backend/app/schemas/` matching frontend TypeScript types
- API client error handling with `ApiClientError` class
- Auth via JWT in httpOnly cookie; `get_current_user` dependency protects all routes
- Dark theme CSS variables (`--background`, `--surface`, `--accent`, `--text-primary`, etc.)
- Card-based UI with `border-[var(--border)] bg-[var(--surface)] rounded-xl` pattern
- Celery tasks for async audio generation (`workers/tasks/tts_generate.py`, `workers/tasks/voice_clone.py`)

### Integration Points
- **Job model** — add `batch_id` foreign key (nullable) to link jobs to batches; or create separate `BatchJob` model
- **Audio routes** — add `/api/share/{token}` or `/api/audio/share/{token}` for unauthenticated audio serving; validate token against share records
- **Auth middleware** — existing `get_current_user` protects all current routes; share routes bypass auth but validate token
- **History page** — add batch summary cards that link to `/batches/{batch_id}`; modify `HistoryItemResponse` to include `batch_id` and `batch_size`
- **New pages** — `/batches` (batch list), `/batches/{batch_id}` (batch detail), `/share/{token}` (public share page)
- **Top navigation** — add "Batches" link next to History
- **Generation page** — add batch upload area (drag-and-drop CSV or button to switch to batch mode)
- **Account page** — add "Shared Links" section with revoke controls
- **API client** — extend with batch and share endpoints; share page does NOT use api-client (no auth)
- **Celery tasks** — batch dispatch creates N individual jobs, each with its own Celery task; no new worker task needed
</code_context>

<deferred>
## Deferred Ideas

- Batch scheduling (queue batch for later processing) — future enhancement
- Batch templates (save and reuse CSV templates) — future enhancement
- Share analytics (view counts, unique listeners) — future phase
- Social sharing integrations (Twitter, Facebook share cards) — future phase
- Password-protected shares — future security enhancement
- Batch result email notifications — future enhancement
- Public batch ZIP sharing (share entire batch as one link) — future phase
- Share link custom slugs (/share/my-audio) instead of tokens — nice-to-have

</deferred>

---

*Phase: 04-batch-processing-sharing*
*Context gathered: 2026-04-26*
