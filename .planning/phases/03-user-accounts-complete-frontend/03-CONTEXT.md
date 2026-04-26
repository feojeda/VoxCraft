# Phase 3: User Accounts & Complete Frontend - Context

**Gathered:** 2026-04-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Users have personal accounts with a full web UI to manage their entire TTS workflow. This phase delivers: user authentication (register/login/logout), generation history with replay and re-download, voice setting presets (save/load speed + emotion + prosody combos), live character/word count in text input, and a top navigation bar to move between app sections. All features are gated behind authentication — no anonymous usage.

</domain>

<decisions>
## Implementation Decisions

### Authentication & Access Control
- **D-01:** Login required for all features — no guest or anonymous generation
- **D-02:** Email and password registration and login (standard credential-based auth)
- **D-03:** Login and registration as separate dedicated pages (`/login`, `/register`), not modals
- **D-04:** Unauthenticated users are redirected to `/login` when attempting to access any app page
- **D-05:** Logout available from any page via the top navigation user menu

### Navigation & Page Structure
- **D-06:** Top navigation bar with links to: Generate, History, Voices, Account
- **D-07:** Navigation collapses to a hamburger menu on mobile
- **D-08:** Generation page remains at `/` (carried forward from Phase 2 decision)
- **D-09:** History page at `/history`, voice library at `/voices` (already exists)
- **D-10:** Account/settings page at `/account`

### Generation History Layout
- **D-11:** History displayed as a vertical scrollable card list
- **D-12:** Each card shows: first 2–3 lines of text preview, voice name used, generation date, play and download buttons
- **D-13:** Users can delete individual history items with a confirmation step
- **D-14:** Re-download of past audio files (both MP3 and WAV) supported from the history card
- **D-15:** Audio can be replayed directly from the history card without downloading

### Voice Presets UX
- **D-16:** Named voice presets with explicit "Save Preset" button and a dropdown to load saved presets
- **D-17:** Preset controls located near the voice picker on the generation page
- **D-18:** Each preset saves: speed value, emotion preset selection, and custom prosody instruct text
- **D-19:** Presets are per-user and persisted to the backend (not browser-only)

### Text Input Enhancements
- **D-20:** Live character count and word count displayed below the text input area
- **D-21:** Count updates in real-time as the user types

### the agent's Discretion
- Exact auth mechanism (JWT vs session cookies, token storage strategy) — planner decides based on FastAPI best practices
- Password hashing algorithm and session duration
- History pagination strategy (offset vs cursor, page size)
- Preset database schema and API endpoint design
- Exact spacing and styling of the top navigation bar
- History card expansion behavior (inline expand vs navigate to detail)
- Mobile hamburger menu animation and layout
- Character count display format ("1,234 chars / 567 words" vs other formats)
- Account page content and layout beyond basic profile info

</decisions>

<specifics>
## Specific Ideas

- Navigation should maintain the clean minimal dark theme established in Phase 1 (Linear/Vercel aesthetic)
- The top nav should feel lightweight — not a heavy admin-style sidebar
- History cards should feel scannable at a glance, like a feed
- Voice presets should be quick to save and load — minimize clicks
- Keep the existing generation page layout mostly intact; the nav bar is the main structural addition

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 3 Requirements & Scope
- `.planning/REQUIREMENTS.md` — USER-01 through USER-04, OUT-04, OUT-08 requirements
- `.planning/ROADMAP.md` — Phase 3 definition, success criteria, requirement traceability

### Prior Phase Context
- `.planning/phases/01-core-tts-pipeline/01-CONTEXT.md` — UI decisions: single-page layout, dark theme, vertical stack, responsive design, WaveSurfer.js player
- `.planning/phases/02-voice-cloning-expressive-control/02-05-SUMMARY.md` — Phase 2 frontend decisions: generation page stays at `/`, emotion selector, prosody input, pronunciation dict integration

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
- `frontend/src/components/TextInput.tsx` — extend to add live character/word count display
- `frontend/src/components/EmotionSelector.tsx` — preset system wraps around this + SpeedSlider + ProsodyInput
- `frontend/src/components/SpeedSlider.tsx` — value to be captured by preset save/load
- `frontend/src/components/ProsodyInput.tsx` — instruct text to be included in presets
- `frontend/src/hooks/use-tts-generation.ts` — may need extension for preset auto-load on mount
- `frontend/src/lib/api-client.ts` — needs auth token injection and new endpoints (auth, history, presets)
- `frontend/src/lib/providers.tsx` — React Query provider already in place; auth provider should wrap this
- `backend/app/models/job.py` — needs `user_id` column added for history ownership
- `backend/app/models/voice.py` — already has `user_id` column (auth anticipated in Phase 2)
- `backend/app/core/database.py` — async SQLAlchemy setup ready for new auth and preset models

### Established Patterns
- Next.js App Router with "use client" for interactive components
- React Query for server state (polling for job status, fetching lists)
- FastAPI async route handlers with SQLAlchemy async sessions via dependency injection
- Pydantic schemas in `backend/app/schemas/` matching frontend TypeScript types
- API client error handling with `ApiClientError` class
- Dark theme CSS variables (`--background`, `--surface`, `--accent`, `--text-primary`, etc.)
- Card-based UI with `border-[var(--border)] bg-[var(--surface)] rounded-xl` pattern

### Integration Points
- **Auth middleware** — must protect all existing API routes (`/api/generate`, `/api/voices`, `/api/pronunciation`, `/api/jobs/*`, `/api/audio/*`)
- **Job model** — add `user_id` foreign key; existing jobs may need migration or remain anonymous
- **ClonedVoice model** — `user_id` already exists but is nullable; enforce non-null for authenticated users
- **Frontend layout** — `layout.tsx` needs auth provider wrapper and top nav bar injection
- **API client** — all requests need Authorization header with token; handle 401 redirects to `/login`
- **Generation page** — add preset controls near voice picker; add character count below TextInput
- **New pages** — `/history`, `/account`, `/login`, `/register`

</code_context>

<deferred>
## Deferred Ideas

- OAuth / social login (Google, GitHub) — future enhancement, not required for v1
- Admin dashboard or user management panel — out of scope for v1
- Public user profiles or sharing between users — Phase 4 territory
- Advanced account settings (password change, email change, avatar upload) — can be added later
- Search or filter in generation history — nice-to-have for later
- Bulk delete in history — single delete is sufficient for v1
- Default/app-provided voice presets — only user-saved presets for now
- Session management page (view active sessions, revoke) — future security enhancement
- Guest/anonymous generation with localStorage — explicitly rejected in favor of auth-gated experience

</deferred>

---

*Phase: 03-user-accounts-complete-frontend*
*Context gathered: 2026-04-25*
