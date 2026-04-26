# Roadmap: ttsQwen

## Overview

Build a public text-to-speech web application that lets content creators generate high-quality audio from text using predefined or cloned voices, with expressive prosody control. The journey starts with the core TTS pipeline (infrastructure + engine + async jobs), adds the killer differentiators (voice cloning + emotion control), delivers the complete user-facing experience (accounts + full UI), and finishes with power-user features (batch + sharing).

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Core TTS Pipeline** - Infrastructure, Qwen3-TTS engine integration, async job system, predefined voices, and audio output
- [x] **Phase 2: Voice Cloning & Expressive Control** - Voice cloning from uploads/recordings, voice management, emotion presets, natural language prosody, pronunciation dictionary
- [x] **Phase 3: User Accounts & Complete Frontend** - User auth, generation history, voice presets, full web UI with waveform playback
- [ ] **Phase 4: Batch Processing & Sharing** - CSV batch upload, ZIP download, public share links

## Phase Details

### Phase 1: Core TTS Pipeline
**Goal**: Users can generate high-quality speech from text using predefined voices and download the result
**Depends on**: Nothing (first phase)
**Requirements**: TTS-01, TTS-02, TTS-03, TTS-04, OUT-01, OUT-02, OUT-03
**Success Criteria** (what must be TRUE):
  1. User can enter text and receive generated audio back within a reasonable timeframe
  2. User can select from at least 5 predefined voices and hear distinct voice differences in output
  3. User can adjust speech speed from 0.5x to 2.0x and hear the difference in generated audio
  4. User can input 5000+ words of text and receive a single coherent audio file
  5. User can preview audio in-browser, download as MP3, and download as WAV
**Plans**: 5 plans
Plans:
- [x] 01-01-PLAN.md — Backend foundation (FastAPI + SQLAlchemy + Celery + Docker)
- [x] 01-02-PLAN.md — Frontend foundation (Next.js + Tailwind dark theme + API client)
- [x] 01-03-PLAN.md — TTS engine + async job pipeline (QwenTTSEngine + Celery tasks + audio serving)
- [x] 01-04-PLAN.md — Frontend TTS UI (voice picker + text input + speed slider + generation flow)
- [x] 01-05-PLAN.md — Audio player + downloads + Docker integration + end-to-end verification
**UI hint**: yes

### Phase 2: Voice Cloning & Expressive Control
**Goal**: Users can clone their own voice and control emotion/style in generated speech
**Depends on**: Phase 1
**Requirements**: CLON-01, CLON-02, CLON-03, CLON-04, CLON-05, PROS-01, PROS-02, PROS-03
**Success Criteria** (what must be TRUE):
  1. User can upload or record audio and generate speech that matches that voice
  2. Poor quality audio uploads are rejected with clear guidance on what is needed
  3. User can manage their cloned voices (view list, rename, delete)
  4. User can control speech emotion using presets (happy, sad, angry, neutral, whisper) or natural language instructions
  5. User can add pronunciation overrides for specific words (brand names, technical terms)
**Plans**: 5 plans
Plans:
- [x] 02-01-PLAN.md — Voice clone backend (DB models, audio validation, voice management API)
- [x] 02-02-PLAN.md — Prosody backend (TTS engine extension for clone & prosody, pronunciation preprocessing)
- [x] 02-03-PLAN.md — Task integration (Celery tasks for clone & prosody, generation API wiring, pronunciation endpoints)
- [x] 02-04-PLAN.md — Frontend voice clone UI (upload, recording, voice library management)
- [x] 02-05-PLAN.md — Frontend prosody UI (emotion selector, prosody input, pronunciation dictionary, generation page updates)
**UI hint**: yes

### Phase 3: User Accounts & Complete Frontend
**Goal**: Users have personal accounts with a full web UI to manage their entire TTS workflow
**Depends on**: Phase 1, Phase 2
**Requirements**: USER-01, USER-02, USER-03, USER-04, OUT-04, OUT-08
**Success Criteria** (what must be TRUE):
  1. User can create account with email/password, log in, stay logged in across sessions, and log out from any page
  2. User can view their generation history with text, voice used, date, and re-download past audio
  3. Text input area shows live character and word count as the user types
  4. User can save and load voice setting presets (speed + emotion combos) for reuse
**Plans**: 4 plans
Plans:
- [x] 03-01-PLAN.md — Backend authentication foundation (User model, JWT auth, route protection, job ownership)
- [x] 03-02-PLAN.md — Frontend auth system & navigation (auth context, login/register pages, top nav, route protection middleware)
- [x] 03-03-PLAN.md — Generation history backend & frontend (history API, audio ownership, /history page with replay/download/delete)
- [x] 03-04-PLAN.md — Voice presets & account page (preset CRUD, preset controls on generation page, /account page)
**UI hint**: yes

### Phase 4: Batch Processing & Sharing
**Goal**: Power users can process multiple texts at once and share generated audio via public links
**Depends on**: Phase 3
**Requirements**: OUT-05, OUT-06, OUT-07
**Success Criteria** (what must be TRUE):
  1. User can upload a CSV/text file with multiple entries and have them all processed into audio
  2. User can download all batch results as a single ZIP file
  3. User can share any generated audio via a public link that others can open and listen to
**Plans**: 5 plans
Plans:
- [x] 04-01-PLAN.md — Backend models and schemas (BatchJob, ShareLink, batch_id on Job)
- [x] 04-02-PLAN.md — Backend batch service and API (CSV parsing, job creation, ZIP generation, batch routes)
- [x] 04-03-PLAN.md — Backend share service and API (token generation, public audio, share routes)
- [x] 04-04-PLAN.md — Frontend batch UI (types, API client, upload component, batch list/detail pages)
- [ ] 04-05-PLAN.md — Frontend sharing and integration (share button, public page, account nav history updates)
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Core TTS Pipeline | 5/5 | Complete | 2026-04-25 |
| 2. Voice Cloning & Expressive Control | 5/5 | Complete | 2026-04-25 |
| 3. User Accounts & Complete Frontend | 4/4 | Complete | 2026-04-26 |
| 4. Batch Processing & Sharing | 0/5 | Planned | - |
