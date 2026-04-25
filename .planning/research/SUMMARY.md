# Project Research Summary

**Project:** ttsQwen
**Domain:** TTS / Voice Cloning Web Application
**Researched:** 2026-04-25
**Confidence:** HIGH

## Executive Summary

ttsQwen is a public-facing text-to-speech web application for content creators who need high-quality audio narration with custom or cloned voices. The research converges on a clear architecture: a Next.js 15 frontend communicating with a FastAPI Python backend that dispatches GPU-bound TTS inference to Celery workers via Redis. The TTS engine choice — **Qwen3-TTS (v0.1.1)** — is the single most important decision and the research strongly recommends it over all alternatives (Coqui XTTS v2 is dead, Bark is a research toy, Fish Speech has fewer voices, CosyVoice benchmarks lower). Qwen3-TTS offers voice cloning from 3-second audio, 9 predefined voices with emotion control, natural language voice design, 10-language support including Spanish and English, and a clean pip-installable Python API.

The recommended approach is a strict async job pattern where the API never blocks on inference: requests return immediately with a job ID, Celery workers process on GPU, and the frontend polls for completion. This is non-negotiable for production TTS applications. A critical discovery is that Qwen3-TTS uses **natural language instructions** instead of SSML markup — this means the "SSML support" requirement from PROJECT.md should be implemented as a user-friendly instruction UI with preset emotion/style options, not an XML parser. This is actually better UX for the non-technical content creator audience.

Key risks center on GPU infrastructure: Qwen3-TTS's three model variants require ~6-10GB VRAM total, inference takes 2-30 seconds per clip, and GPU memory leaks in long-running workers are a known failure mode. Mitigation strategies include singleton model loading, explicit VRAM cleanup after each task, Celery worker concurrency=1, and periodic worker recycling. Voice cloning quality is catastrophically sensitive to reference audio quality — the app must validate uploads and guide users through recording, not accept arbitrary files.

## Key Findings

### Recommended Stack

The stack is well-established with industry-standard technologies across all layers. Qwen3-TTS was selected after evaluating 7 alternatives — it aligns perfectly with the project name, benchmarks competitively, and provides all required capabilities (voice cloning, emotion control, multilingual) in a single pip-installable package.

**Core technologies:**
- **Qwen3-TTS (v0.1.1):** Core TTS engine — voice cloning, predefined voices, emotion control via natural language, voice design from text descriptions. Apache 2.0 license.
- **Next.js 15 + React 19:** Frontend framework — SSR, App Router, API routes for BFF pattern. Industry standard.
- **FastAPI (0.136+):** Backend REST API — async, auto-generated docs, Pydantic validation, file upload support.
- **Celery 5.6+ + Redis 7.x:** Async task queue — GPU inference offloaded to dedicated workers. Non-negotiable for TTS.
- **SQLAlchemy 2.0 + SQLite:** ORM + database — SQLite for v1, PostgreSQL migration path via config change.
- **WaveSurfer.js 7.x:** Audio waveform visualization and playback — industry standard for audio UIs.
- **Tailwind CSS 4 + shadcn/ui:** Styling + components — rapid prototyping, accessible, zero lock-in.
- **Docker Compose:** Local orchestration — API + Worker + Redis + DB in one command.

**Critical version note:** Use Python 3.12 (not 3.14) for ML library compatibility. FlashAttention 2 required for GPU efficiency.

### Expected Features

**Must have (table stakes — v1 launch):**
- Text-to-speech generation with Qwen3-TTS engine
- Voice catalog (9 predefined voices from Qwen3-TTS CustomVoice model)
- Audio playback/preview with waveform visualization (WaveSurfer.js)
- Audio download (MP3 + WAV formats)
- Speed control (0.5x-2.0x slider)
- User accounts (email/password auth with JWT)
- Generation history (past jobs with re-download)
- Voice cloning from user audio sample (Qwen3-TTS Base model, 3s minimum)
- Text chunking for long inputs (automatic sentence-boundary splitting)

**Should have (competitive advantage — v1.x):**
- Emotion/style control via natural language instructions (Qwen3-TTS `instruct` parameter)
- Prosody control UI (visual editor mapping to natural language instructions, NOT SSML parser)
- Batch/bulk processing (CSV upload → queue → ZIP download)
- Share via public link (expiring URLs)
- Cross-language voice cloning (clone from Spanish, generate in English)
- Pronunciation dictionary (user-level find-replace rules)

**Defer (v2+):**
- Professional Voice Cloning (multi-sample training pipeline)
- Streaming/real-time synthesis
- API for third parties
- Community voice sharing/marketplace
- Languages beyond ES/EN

### Architecture Approach

The architecture follows a strict layered separation with inference-process isolation as the foundational pattern. The system has 5 distinct layers: Presentation (Next.js), API (FastAPI), Worker (Celery + GPU), Inference (Qwen3-TTS models), and Data (SQLite + Redis + filesystem). Communication between layers uses async job dispatch — the API never calls inference directly.

**Major components:**
1. **Next.js Frontend** — Text editor, voice browser, audio player, job dashboard. TanStack Query for async state, Zustand for UI state.
2. **FastAPI REST API** — Auth routes, TTS job creation, voice management, audio file serving. Returns 202 Accepted immediately.
3. **Celery GPU Workers** — Load Qwen3-TTS models at startup, process synthesis/cloning tasks. Concurrency=1 per GPU.
4. **TTS Engine Abstraction** — `BaseTTSEngine` interface with `QwenTTSEngine` adapter. Enables swapping engines without changing worker logic.
5. **Model Manager** — Singleton managing VRAM allocation across Qwen3-TTS variants (Base, CustomVoice, VoiceDesign). Prevents OOM.

### Critical Pitfalls

1. **GPU memory leaks and OOM during inference** — Use singleton model loader, `torch.inference_mode()`, explicit `torch.cuda.empty_cache()` after each task, Celery `worker_concurrency=1`, and `--max-tasks-per-child` recycling.
2. **Synchronous TTS inference blocking API** — Never run inference in FastAPI handlers. Always dispatch to Celery and return 202 immediately. This is architectural, not optional.
3. **Poor reference audio destroying voice cloning** — Validate uploads (duration, SNR, sample rate, clipping), guide users with recording instructions, require 6+ seconds for ICL mode, provide quality preview.
4. **Text normalization failures producing garbled speech** — Build preprocessing pipeline: strip HTML, expand abbreviations, normalize numbers (language-aware), remove URLs/emoji, sentence segmentation.
5. **Celery task timeouts killing long generations** — Set `task_soft_time_limit=300`, implement chunked processing for long text, catch `SoftTimeLimitExceeded`, use Celery chords for parallel chunk generation.
6. **SSML parsing complexity exploding** — Don't build an SSML parser. Use Qwen3-TTS's native natural language `instruct` parameter. Build a visual prosody editor as the UI layer.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Foundation & Infrastructure
**Rationale:** The async worker pattern is the architectural backbone — everything depends on it. Getting the API skeleton, database, Redis, and Celery worker communication working first de-risks all subsequent phases. GPU memory management must be designed in from day one.
**Delivers:** Running FastAPI skeleton with health check, SQLAlchemy models (User, Job, Voice, AudioFile), Celery worker that can receive and acknowledge tasks, Redis broker, Docker Compose for all services.
**Addresses:** Project constraints (FastAPI, Celery+Redis, SQLite)
**Avoids:** Pitfall 1 (GPU OOM), Pitfall 3 (sync inference blocking), Pitfall 5 (Celery timeouts)
**Needs research:** No — standard FastAPI + Celery + Docker patterns, well-documented.

### Phase 2: TTS Engine Integration
**Rationale:** The TTS engine is the riskiest dependency. Validating that Qwen3-TTS works end-to-end (load model, synthesize audio, save file, play in browser) must happen before building any features on top of it. This phase proves the core value proposition.
**Delivers:** `BaseTTSEngine` interface, `QwenTTSEngine` adapter, model loading with VRAM management, single endpoint that generates audio from text, audio file serving, text preprocessing pipeline, WAV→MP3 conversion via FFmpeg.
**Addresses:** Core requirement (TTS generation), audio download, speed control
**Avoids:** Pitfall 4 (text normalization), Pitfall 7 (audio format mismatches)
**Needs research:** Yes — Qwen3-TTS integration specifics need hands-on validation (model loading, VRAM usage, inference speed on target GPU, audio output quality).

### Phase 3: Voice Catalog & Async Job Pipeline
**Rationale:** With the engine working, build the production job pipeline — async dispatch, status polling, audio storage. Seed the predefined voice catalog (9 Qwen3-TTS CustomVoice speakers). This is the minimum to have a usable product.
**Delivers:** Async job creation/dispatch, job status polling endpoint, predefined voice catalog seeded from Qwen3-TTS CustomVoice, audio storage service (filesystem), text chunking for long inputs, generation history.
**Addresses:** Voice catalog, generation history, text chunking, speed control integration
**Avoids:** Pitfall 5 (timeouts via chunking)
**Needs research:** No — standard Celery async job patterns.

### Phase 4: Voice Cloning
**Rationale:** Voice cloning is the killer differentiator but depends on working TTS generation and async jobs. It also introduces critical UX (audio upload validation) and safety (consent) requirements that must ship together.
**Delivers:** Voice upload endpoint with audio quality validation, voice cloning Celery task (embedding extraction via Qwen3-TTS Base), voice CRUD (list, rename, delete), consent verification flow, recording guidance UI.
**Addresses:** Voice cloning requirement, voice management
**Avoids:** Pitfall 2 (poor reference audio), Pitfall 6 (consent/legal liability)
**Needs research:** Yes — Qwen3-TTS voice cloning API specifics (ICL mode vs x-vector mode, ref_text requirements, multi-reference averaging).

### Phase 5: Emotion & Prosody Control
**Rationale:** Qwen3-TTS's natural language `instruct` parameter is the key differentiator for expressive control. Build a user-friendly prosody UI that maps to these instructions — NOT an SSML parser. This is what separates a "toy" from a "tool" for content creators.
**Delivers:** Emotion preset buttons (happy, sad, angry, whisper, excited), custom instruction text field, visual prosody editor (speed/pitch/emphasis markers), Qwen3-TTS `instruct` parameter integration, preview of prosody changes.
**Addresses:** Emotion control requirement, prosody/SSML requirement (reimagined as NL instructions)
**Avoids:** Pitfall 8 (SSML parsing complexity)
**Needs research:** Yes — Qwen3-TTS instruct parameter capabilities and limits need testing (which emotions work, how to combine instructions, quality across languages).

### Phase 6: Frontend UI
**Rationale:** With a fully functional API (generation, voice catalog, voice cloning, emotion control), build the complete user-facing UI. Start after Phase 3 since the API is usable, but the full UI depends on all API features.
**Delivers:** Text editor page, voice browser + upload, audio player with waveform (WaveSurfer.js), job status/history view, emotion/prosody controls UI, auth (login/register), responsive layout.
**Addresses:** All user-facing requirements
**Uses:** Next.js 15, Tailwind + shadcn/ui, WaveSurfer.js, TanStack Query, Zustand
**Needs research:** No — standard React/Next.js patterns.

### Phase 7: User Auth & Management
**Rationale:** JWT auth, per-user voice libraries, and generation history. Can partially overlap with Phase 6 (frontend auth forms) but needs the database models and API routes from Phase 1.
**Delivers:** JWT authentication, user registration/login, per-user voice library, generation history per user, protected API routes.
**Addresses:** User accounts requirement
**Needs research:** No — standard JWT + FastAPI auth patterns.

### Phase 8: Batch Processing & Sharing
**Rationale:** These are v1.x power-user features that depend on all core functionality working. Batch processing leverages the existing Celery infrastructure. Sharing requires storage and URL generation.
**Delivers:** Batch text upload (CSV), ZIP download of batch results, public share links with expiration, audio format options (WAV, MP3).
**Addresses:** Batch processing, share via link requirements
**Needs research:** No — standard patterns for batch processing and signed URLs.

### Phase Ordering Rationale

- **Phase 1 → 2 dependency:** Infrastructure (API + Celery + Redis) must exist before integrating the TTS engine. The engine runs inside the worker.
- **Phase 2 → 3 dependency:** Engine must work before building the async job pipeline around it. You need something to dispatch.
- **Phase 2 → 4 dependency:** Voice cloning uses the same engine. Base TTS must work before adding cloning on top.
- **Phases 6 and 7 can partially overlap:** Frontend can start with hardcoded data once API routes are defined in Phase 3.
- **Phase 5 after Phase 3:** Prosody control needs the working async pipeline. The instruct parameter is additive.
- **Phase 8 last:** Batch and sharing are power features that need everything else stable.
- **Architecture pattern groupings:** Phases 1-3 establish the backbone (infra + engine + pipeline). Phases 4-5 add core differentiators (cloning + emotion). Phases 6-7 are the user layer (UI + auth). Phase 8 is power features.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 2 (TTS Engine Integration):** Complex integration — needs hands-on Qwen3-TTS validation (VRAM usage on target GPU, inference speed, model loading, output quality, text preprocessing effectiveness). Run `/gsd-research-phase` or `/gsd-ai-integration-phase`.
- **Phase 4 (Voice Cloning):** Qwen3-TTS cloning API specifics (ICL vs x-vector modes, ref_text handling, multi-reference, minimum sample requirements). Run `/gsd-ai-integration-phase`.
- **Phase 5 (Emotion & Prosody):** Qwen3-TTS `instruct` parameter capabilities, emotion quality across voices and languages, instruction composition. Run `/gsd-ai-integration-phase`.

Phases with standard patterns (skip `/gsd-research-phase`):
- **Phase 1 (Foundation):** Well-documented FastAPI + Celery + Docker patterns.
- **Phase 3 (Async Job Pipeline):** Standard Celery async job pattern.
- **Phase 6 (Frontend UI):** Standard Next.js + React patterns.
- **Phase 7 (Auth):** Standard JWT + FastAPI authentication.
- **Phase 8 (Batch & Sharing):** Standard file processing and signed URL patterns.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All technologies verified via official docs, PyPI, and Context7. Qwen3-TTS evaluated against 7 alternatives with clear winner. |
| Features | HIGH | Feature landscape mapped against 5 competitors (ElevenLabs, Murf.ai, OpenAI TTS, XTTS v2, ChatTTS). Priority matrix validated against user value and implementation cost. |
| Architecture | HIGH | Layered architecture with inference-process isolation is the established pattern for ML-powered web apps. Verified via 5 source libraries (Qwen3-TTS, XTTS, AllTalk, FastAPI, Celery docs). |
| Pitfalls | HIGH | 8 critical pitfalls identified with specific prevention strategies, warning signs, and recovery costs. Sources include official model docs and production TTS server patterns. |

**Overall confidence:** HIGH

### Gaps to Address

- **Qwen3-TTS production readiness:** Version 0.1.1 is very new (Jan 2026). Edge cases, error handling, and long-running stability need real-world testing. Phase 2 should include stress testing.
- **GPU requirements for target deployment:** Exact VRAM usage depends on which Qwen3-TTS variants are loaded simultaneously (Base + CustomVoice + VoiceDesign = ~6-10GB). Need to validate on the actual GPU available.
- **Natural language instruction quality:** The mapping from user intent ("make it sound happy") to Qwen3-TTS `instruct` parameter needs empirical testing. Quality may vary by voice and language.
- **Text preprocessing effectiveness:** Qwen3-TTS claims improved robustness to noisy text, but real-world copy-pasted content from web pages, social media, and academic papers needs a test corpus.
- **Cross-language voice cloning quality:** Research shows Qwen3-TTS supports 10 languages, but cloning quality when crossing language boundaries (e.g., Spanish reference → English output) needs validation.

## Sources

### Primary (HIGH confidence)
- **Qwen3-TTS PyPI** (https://pypi.org/project/qwen-tts/) — Package details, installation, version verification
- **Qwen3-TTS GitHub** (https://github.com/qwenlm/qwen3-tts) — Source code, README, model documentation
- **Qwen3-TTS via Context7** (/qwenlm/qwen3-tts) — Full API documentation, voice cloning patterns, instruct parameter
- **FastAPI via Context7** (/websites/fastapi_tiangolo) — Async patterns, background tasks, file upload, Pydantic validation
- **Celery via Context7** (/websites/celeryq_dev_en_stable) — Task queue architecture, result backends, time limits, worker configuration
- **Next.js via Context7** (/vercel/next.js) — App Router, Server Components, API routes
- **Coqui TTS via Context7** (/coqui-ai/tts) — XTTS v2 API, voice cloning, cross-language support (for comparison)
- **AllTalk TTS via Context7** (/erew123/alltalk_tts) — Production TTS server patterns, model management, streaming architecture

### Secondary (MEDIUM confidence)
- **ElevenLabs API documentation** (Context7) — Feature comparison, voice cloning tiers, SSML support
- **OpenAI TTS API documentation** (Context7) — gpt-4o-mini-tts instruction-based control
- **Fish Speech via Context7** (/fishaudio/fish-speech) — Alternative engine evaluation
- **CosyVoice via Context7** (/funaudiollm/cosyvoice) — Alternative engine benchmark comparison

### Tertiary (LOW confidence)
- **Murf.ai website analysis** — Feature set comparison (not API docs)
- **ChatTTS via Context7** (/2noise/chattts) — Prosody tokens research (not selected as engine)

---
*Research completed: 2026-04-25*
*Ready for roadmap: yes*
