# Phase 1: Core TTS Pipeline - Context

**Gathered:** 2026-04-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can enter text, select a predefined voice, adjust speed, generate speech, preview it in-browser with waveform visualization, and download as MP3 or WAV. This is the complete end-to-end TTS experience — from text input to audio output — using Qwen3-TTS's CustomVoice model with async job processing via Celery workers on a local NVIDIA GPU.

</domain>

<decisions>
## Implementation Decisions

### App Layout & Entry Point
- **D-01:** Single-page tool layout — text input, voice picker, speed control, and audio player all visible on one screen (not multi-step wizard, not split-panel)
- **D-02:** Clean & minimal visual style — dark theme, centered content, premium feel (like Linear or Vercel's dashboard)
- **D-03:** Vertical stack layout — text input at top, voice picker + settings in middle, audio output at bottom. Natural top-to-bottom flow: type → configure → listen
- **D-04:** Responsive design — must work on both mobile (cell phones) and desktop

### Voice Picker
- **D-05:** Horizontal scrollable card row with audio preview buttons for each voice
- **D-06:** Each card shows voice name + language/gender tag (e.g., "Serena — EN Female"). Brief and scannable
- **D-07:** 9 predefined Qwen3-TTS CustomVoice speakers available (Vivian, Serena, Ryan, Aiden, Chelsie, Ethan, etc.)

### Generation Flow
- **D-08:** Inline progress bar below Generate button — shows status: Queued → Processing → Done. Auto-updates when audio is ready
- **D-09:** Speed control via slider (0.5x–2.0x range), always visible near Generate button
- **D-10:** Single unified progress bar for long text — text chunking is hidden from user, no chunk-by-chunk progress shown

### Audio Player & Downloads
- **D-11:** Waveform player using WaveSurfer.js 7.x — waveform visualization + playback controls + download buttons
- **D-12:** Dark & subtle waveform style — matches the clean minimal dark theme (like Spotify's waveform)
- **D-13:** Two separate download buttons: "Download MP3" and "Download WAV" — explicit choice, not a dropdown
- **D-14:** Each new generation replaces the output area — no stacking of previous results

### Error Handling
- **D-15:** Inline error message below Generate button with Retry button — no modals or popups
- **D-16:** Red outline on text area for invalid input (empty, too long, unsupported characters)

### Generate Button Behavior
- **D-17:** Button shows spinner and changes to "Generating..." during processing. Disabled until complete
- **D-18:** No cancel option — simple disable-and-wait pattern

### Empty / Initial State
- **D-19:** Subtle waveform placeholder with hint text "Your audio will appear here" before first generation

### Text Input
- **D-20:** Fixed height textarea with scrollbar. Character count displayed below. Predictable layout

### Infrastructure
- **D-21:** Local NVIDIA GPU (12GB VRAM — RTX 3060 12GB or RTX 4070) for TTS inference
- **D-22:** Only Qwen3-TTS CustomVoice model loaded for Phase 1 (~2-3GB VRAM out of 12GB available)
- **D-23:** Python 3.12 for ML library compatibility (not 3.14)

### Agent's Discretion
- Exact spacing, typography, and color specifics
- Waveform color and gradient details within dark/subtle theme
- Progress bar animation style
- Text area placeholder text and max character count
- Error message wording
- WaveSurfer.js configuration (zoom, regions, playback speed display)
- Text preprocessing pipeline details (stripping HTML, normalizing numbers)
- Long text chunking strategy (sentence boundaries, paragraph boundaries)
- Docker Compose service configuration details

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Research
- `.planning/research/SUMMARY.md` — Executive summary of all research: Qwen3-TTS selection rationale, architecture approach, critical pitfalls, phase ordering
- `.planning/research/STACK.md` — Full technology stack with versions, installation commands, architecture diagram, key technical decisions
- `.planning/research/FEATURES.md` — Feature landscape, competitor analysis, MVP definition, feature dependency graph
- `.planning/research/ARCHITECTURE.md` — Detailed architecture patterns and layer descriptions
- `.planning/research/PITFALLS.md` — 8 critical pitfalls with prevention strategies and warning signs

### Project Planning
- `.planning/PROJECT.md` — Project vision, constraints, key decisions table, out-of-scope items
- `.planning/REQUIREMENTS.md` — Phase 1 requirements: TTS-01 through TTS-04, OUT-01 through OUT-03
- `.planning/ROADMAP.md` — Phase 1 definition, success criteria, requirement traceability

### Codebase Context
- `.planning/codebase/CONVENTIONS.md` — Naming patterns (snake_case.py, PascalCase classes), code style recommendations (black, ruff, type hints)
- `.planning/codebase/STRUCTURE.md` — Pre-development state, no source code yet, where to add new code

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- None — project is pre-development with no application source code

### Established Patterns
- GSD planning workflow established (`.planning/` directory)
- OpenCode tooling with graphify plugin (`.opencode/`)
- Conventions defined but not yet applied to code: snake_case for Python files/functions, PascalCase for classes, UPPER_SNAKE_CASE for constants

### Integration Points
- New code starts from scratch — all patterns to be established in this phase
- Backend structure: FastAPI app with Celery workers, following research architecture diagram
- Frontend structure: Next.js 15 with App Router, Tailwind CSS + shadcn/ui components
- Docker Compose for orchestration: API + Worker + Redis + DB services

</code_context>

<specifics>
## Specific Ideas

- Voice cloning (capturing own voice) is very important to the user — Phase 2 priority should remain high
- App must support Spanish language text input and generation — Qwen3-TTS supports 10 languages including Spanish
- Spanish audio quality with each predefined voice needs validation during implementation
- Visual references: Linear (clean minimal dark UI), Spotify (dark waveform style), Vercel dashboard (centered content)
- Layout should feel like ElevenLabs' Speech Synthesis page — everything at hand, single page

</specifics>

<deferred>
## Deferred Ideas

- Voice cloning from user audio sample — Phase 2 (high priority)
- Emotion/style control via natural language instructions — Phase 2
- Apple Silicon (MPS backend) testing — not targeted for Phase 1
- Voice design from text descriptions (VoiceDesign model) — Phase 2+
- Generation history list — Phase 3
- User accounts and authentication — Phase 3

</deferred>

---

*Phase: 01-core-tts-pipeline*
*Context gathered: 2026-04-25*
