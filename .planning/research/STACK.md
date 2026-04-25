# Technology Stack

**Project:** ttsQwen — TTS Web App with Voice Cloning
**Researched:** 2026-04-25
**Overall confidence:** HIGH

## Recommended Stack

### TTS Engine (THE critical decision)

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| **Qwen3-TTS** | 0.1.1 (PyPI `qwen-tts`) | Core TTS synthesis, voice cloning, voice design, emotion control | Perfectly aligns with project name. Released Jan 2026 by Alibaba Qwen team. 10 languages (ES, EN included). 3 model variants: Base (voice cloning from 3s audio), CustomVoice (9 predefined voices + emotion instructions), VoiceDesign (natural language voice creation). 97ms streaming latency. Benchmarks competitively vs CosyVoice3 and ElevenLabs. Apache 2.0 license. pip-installable with clean Python API. | HIGH |
| **Qwen3-TTS-12Hz-1.7B-Base** | — | Voice cloning from user audio | Zero-shot cloning from 3-second reference. ICL mode (high quality with ref_text) and x-vector mode (ref_text optional). Reusable `create_voice_clone_prompt` avoids recomputing features. | HIGH |
| **Qwen3-TTS-12Hz-1.7B-CustomVoice** | — | Predefined voice catalog + emotion control | 9 premium speakers (Vivian, Serena, Ryan, Aiden, etc.) with natural language emotion instructions ("Very excited and happy", "用特别愤怒的语气说"). Covers Chinese, English, Japanese, Korean + dialects. | HIGH |
| **Qwen3-TTS-12Hz-1.7B-VoiceDesign** | — | Voice design from natural language | Create custom voices from text descriptions ("Male, 17 years old, tenor range"). Can be combined with Base model for reusable clone prompts. | HIGH |
| **FlashAttention 2** | latest | GPU memory optimization | Required for efficient inference with bfloat16. Reduces VRAM usage significantly. | HIGH |
| **PyTorch** | 2.5+ | ML runtime | Required by Qwen3-TTS. CUDA support for GPU inference. | HIGH |

**Why Qwen3-TTS over alternatives:**

| Alternative | Why NOT |
|-------------|---------|
| Coqui XTTS v2 | Project shut down 2024. Community fork exists but uncertain future. No active development. |
| Bark | Research toy. Slow inference, limited language support, no clean voice cloning API. No Spanish support. |
| ChatTTS | Chinese-focused dialogue model. No clean voice cloning. Limited prosody control tokens. |
| Fish Speech | Strong competitor (emotion tags, API server, streaming) but fewer predefined voices, less mature ecosystem. Could be a secondary engine later. |
| CosyVoice | Good quality but Qwen3-TTS benchmarks higher on WER and speaker similarity. Qwen3-TTS has cleaner pip-installable package and better documentation. |
| MeloTTS | Fast CPU inference but no voice cloning. Only predefined voices. |
| Parler-TTS | Emotion description-based but inferior benchmarks to Qwen3-TTS. |

**Key insight on SSML:** Qwen3-TTS uses natural language instructions instead of SSML markup for prosody/emotion control. This means:
- **DO NOT build an SSML parser** — use natural language emotion instructions via `instruct` parameter
- The "SSML support" requirement from PROJECT.md maps to Qwen3-TTS's `instruct` parameter
- Users write "Speak with a sad tone, slow and quiet" instead of XML markup
- This is actually BETTER UX for non-technical content creators

### Frontend

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| **Next.js** | 15.x (App Router) | Full-stack React framework | SSR for SEO, file-system routing, API routes for BFF pattern, Server Components for data fetching. Industry standard for production React apps. | HIGH |
| **React** | 19.x | UI library | Bundled with Next.js 15. Server Components reduce client bundle. | HIGH |
| **TypeScript** | 5.x | Type safety | Industry standard. Prevents bugs, improves DX. | HIGH |
| **Tailwind CSS** | 4.x | Styling | Utility-first CSS. Rapid prototyping. No CSS-in-JS runtime overhead. Pairs perfectly with shadcn/ui. | HIGH |
| **shadcn/ui** | latest | Component library | Not a dependency — copy-paste components built on Radix UI. Accessible, customizable, zero lock-in. | HIGH |
| **TanStack Query (React Query)** | 5.x | Server state management | Handles caching, refetching, optimistic updates for API calls. Perfect for async TTS job polling. | HIGH |
| **Zustand** | 5.x | Client state management | Minimal API, no boilerplate. For UI state (selected voice, form inputs, player state). | HIGH |
| **WaveSurfer.js** | 7.x | Audio waveform visualization & playback | Industry standard for audio waveform rendering. Used by Spotify, BBC, etc. Supports playback, zoom, regions. | HIGH |
| **React Hook Form + Zod** | latest | Form handling + validation | Type-safe form validation. Fast re-renders. Zod schemas shareable between client and API. | MEDIUM |
| **Lucide React** | latest | Icon library | Clean, consistent icons. Recommended by shadcn/ui. | MEDIUM |

### Backend (Python)

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| **Python** | 3.12 | Runtime | Required by Qwen3-TTS (`qwen-tts` requires Python >=3.9). 3.12 is stable, well-supported. NOT 3.14 (too new for ML libraries). | HIGH |
| **FastAPI** | 0.136+ | REST API framework | Async, auto-generated OpenAPI docs, type validation via Pydantic, file upload support. Industry standard for Python APIs. Required by project constraints. | HIGH |
| **Uvicorn** | 0.34+ | ASGI server | Production server for FastAPI. Worker management for concurrency. | HIGH |
| **Celery** | 5.6+ | Distributed task queue | Audio generation is GPU-bound and slow (seconds per clip). Celery handles async processing with Redis broker. Required by project constraints. | HIGH |
| **Redis** | 7.x+ | Message broker + cache | Celery broker. Also used for task result backend and API response caching. | HIGH |
| **SQLAlchemy** | 2.0+ | ORM | Industry standard Python ORM. Async support. SQLite → PostgreSQL migration path. | HIGH |
| **Alembic** | 1.13+ | Database migrations | SQLAlchemy's official migration tool. Schema versioning. | HIGH |
| **Pydantic** | 2.x | Data validation | Bundled with FastAPI. Used for request/response schemas, settings management. | HIGH |
| **PyJWT** | 2.x | JWT authentication | Lightweight JWT library for user auth. Stateless token-based auth. | HIGH |
| **passlib[bcrypt]** | 1.7+ | Password hashing | Industry standard password hashing. bcrypt is the recommended algorithm. | HIGH |

### Database

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| **SQLite** | 3.x | Development / v1 database | Zero config, file-based. Perfect for getting started. Required by project constraints. | HIGH |
| **PostgreSQL** | 16.x | Production database (future) | Migration target when scale demands it. SQLAlchemy makes the switch a config change. | MEDIUM |

### Audio Processing

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| **soundfile** | 0.12+ | Audio I/O | Used directly by Qwen3-TTS for reading/writing WAV files. | HIGH |
| **FFmpeg** | 6.x+ (system) | Audio format conversion | Convert WAV → MP3, resample, trim. Called via subprocess. Industry standard. | HIGH |
| **torchaudio** | 2.5+ | PyTorch audio utilities | Audio loading, resampling, effects. Used by CosyVoice and other models if added later. | MEDIUM |

### Infrastructure

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| **Docker** | — | Containerization | Consistent dev/prod environments. GPU access via NVIDIA Container Toolkit. | HIGH |
| **Docker Compose** | — | Local orchestration | Run API + Worker + Redis + DB with one command. | HIGH |
| **NVIDIA CUDA** | 12.x | GPU acceleration | Required for TTS inference. Qwen3-TTS needs CUDA GPU for practical inference speed. | HIGH |
| **Nginx** | latest | Reverse proxy | SSL termination, static file serving, load balancing between API workers. | MEDIUM |

### Development Tooling

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| **pytest** | 8.x | Python testing | Industry standard. Fixtures, parametrize, async support. | HIGH |
| **httpx** | 0.27+ | API testing | FastAPI's TestClient is built on httpx. Async HTTP client for integration tests. | HIGH |
| **Vitest** | latest | Frontend testing | Fast, ESM-native test runner. Better DX than Jest for modern React. | MEDIUM |
| **Playwright** | latest | E2E testing | Cross-browser E2E. Better than Cypress for modern apps. | MEDIUM |
| **Ruff** | latest | Python linting/formatting | Replaces Black, isort, flake8. Extremely fast (Rust-based). | HIGH |
| **pnpm** | 9.x | JS package manager | Fast, disk-efficient. Strict dependency resolution. | MEDIUM |

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| TTS Engine | Qwen3-TTS | Coqui XTTS v2 | Project dead since 2024. Community fork uncertain. |
| TTS Engine | Qwen3-TTS | Fish Speech | Strong but fewer predefined voices, less mature package ecosystem. |
| TTS Engine | Qwen3-TTS | Bark | No clean voice cloning. Slow. Research-oriented. |
| TTS Engine | Qwen3-TTS | CosyVoice | Lower benchmarks. Less clean API. |
| Task Queue | Celery + Redis | Dramatiq + Redis | Celery is industry standard, broader ecosystem, project constraint. |
| Task Queue | Celery + Redis | RQ (Redis Queue) | Too simple. No task routing, priorities, or task chaining. |
| ORM | SQLAlchemy 2.0 | Tortoise ORM | SQLAlchemy is battle-tested, async support, massive ecosystem. |
| ORM | SQLAlchemy 2.0 | Prisma | Python ecosystem prefers SQLAlchemy. Prisma's Python client is less mature. |
| State Mgmt | Zustand | Redux Toolkit | Overkill for this app. Zustand is simpler, less boilerplate. |
| State Mgmt | TanStack Query | SWR | TanStack Query has more features (mutations, infinite queries, devtools). |
| CSS | Tailwind CSS | CSS Modules | Tailwind is faster for prototyping. Better with component libraries. |
| Audio Player | WaveSurfer.js | Howler.js | Howler is audio playback only. WaveSurfer adds visualization (waveform). |
| Audio Player | WaveSurfer.js | Tone.js | Tone.js is for music creation, not playback/visualization. |
| Auth | PyJWT | python-jose | python-jose is effectively unmaintained. PyJWT is actively maintained. |
| Container | Docker | Podman | Docker has better NVIDIA GPU support and broader ecosystem. |

## Installation

```bash
# === Backend (Python) ===
# Create isolated environment (qwen-tts recommends Python 3.12)
conda create -n ttsqwen python=3.12 -y
conda activate ttsqwen

# Core API
pip install "fastapi[standard]"  # FastAPI + uvicorn + python-multipart
pip install celery[redis]         # Celery with Redis broker
pip install redis                 # Redis client
pip install sqlalchemy[asyncio]   # Async ORM
pip install alembic               # DB migrations
pip install pydantic-settings     # Settings management
pip install pyjwt                 # JWT auth
pip install "passlib[bcrypt]"     # Password hashing

# TTS Engine
pip install qwen-tts              # Qwen3-TTS (installs torch, soundfile, etc.)
pip install flash-attn --no-build-isolation  # GPU optimization

# Audio processing
pip install soundfile             # WAV I/O
# FFmpeg must be installed at system level

# Development
pip install pytest pytest-asyncio httpx ruff

# === Frontend (Node.js) ===
# Using pnpm
pnpm create next-app@latest frontend --typescript --tailwind --app --src-dir

cd frontend
pnpm add @tanstack/react-query zustand wavesurfer.js
pnpm add react-hook-form @hookform/resolvers zod
pnpm add lucide-react
pnpm add -D vitest @testing-library/react @testing-library/jest-dom
```

## Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│                    Browser                           │
│  Next.js App (React 19 + Tailwind + WaveSurfer.js)  │
│  ┌─────────┐ ┌──────────┐ ┌──────────────────────┐  │
│  │Text Form │ │Voice Mgr │ │Audio Player/Download │  │
│  └────┬─────┘ └────┬─────┘ └──────────┬───────────┘  │
└───────┼─────────────┼─────────────────┼──────────────┘
        │ HTTP/REST   │ File Upload     │ GET audio
        ▼             ▼                 ▼
┌─────────────────────────────────────────────────────┐
│              FastAPI (Python 3.12)                    │
│  ┌──────────┐ ┌──────────────┐ ┌──────────────────┐ │
│  │Auth/JWT  │ │TTS Endpoints │ │File Serving      │ │
│  │Routes    │ │/generate,    │ │/audio/{id}       │ │
│  │          │ │/voices, etc. │ │                  │ │
│  └──────────┘ └──────┬───────┘ └──────────────────┘ │
│                      │ enqueue task                   │
└──────────────────────┼───────────────────────────────┘
                       ▼
              ┌────────────────┐
              │  Redis (Broker) │
              └────────┬───────┘
                       ▼
┌──────────────────────────────────────────────────────┐
│              Celery Workers (GPU)                      │
│  ┌─────────────────────────────────────────────────┐ │
│  │  Qwen3-TTS Models (loaded on startup)            │ │
│  │  ┌──────────┐ ┌──────────┐ ┌─────────────────┐  │ │
│  │  │ Base     │ │CustomVoi │ │ VoiceDesign     │  │ │
│  │  │ (Clone)  │ │ce (Presets│ │ (NL Voice Create│  │ │
│  │  │          │ │+Emotion) │ │)                │  │ │
│  │  └──────────┘ └──────────┘ └─────────────────┘  │ │
│  └─────────────────────────────────────────────────┘ │
│  → Generates WAV → FFmpeg converts to MP3 → saves    │
└──────────────────────────────────────────────────────┘
                       │
                       ▼
              ┌────────────────┐
              │ SQLite / FS    │
              │ (metadata +    │
              │  audio files)  │
              └────────────────┘
```

## Key Technical Decisions

### 1. Natural Language Prosody > SSML Parser
Qwen3-TTS uses natural language instructions (`instruct` parameter) instead of SSML. This eliminates the need to build an SSML parser — users describe prosody in plain language. This is BETTER for the target audience (non-technical content creators). Map the "SSML support" requirement to a natural language instruction UI with presets.

### 2. Separate Worker Process for GPU Inference
TTS generation takes 1-10 seconds per clip and requires GPU. It CANNOT run in the API process. Celery workers load Qwen3-TTS models on startup and process jobs from the queue. The API remains fast and responsive.

### 3. Model Loading Strategy
Load all three Qwen3-TTS variants (Base, CustomVoice, VoiceDesign) at worker startup to avoid cold-start latency. This requires ~6-10GB VRAM total. If GPU memory is constrained, load Base + CustomVoice only (VoiceDesign can be loaded on demand).

### 4. Audio Format Pipeline
Qwen3-TTS outputs WAV natively. Use FFmpeg to convert to MP3 on demand. Store original WAV + generate MP3 variants. WAV for quality, MP3 for download/sharing.

### 5. Python 3.12 (NOT 3.14)
The development machine has Python 3.14.3, but ML libraries (PyTorch, Qwen3-TTS) may not be fully compatible with 3.14 yet. Use Python 3.12 for the project via conda/venv.

## Sources

- Qwen3-TTS PyPI: https://pypi.org/project/qwen-tts/ (v0.1.1, Feb 2026) — **HIGH confidence**
- Qwen3-TTS GitHub: https://github.com/qwenlm/qwen3-tts — **HIGH confidence**
- Qwen3-TTS docs via Context7 (/qwenlm/qwen3-tts) — **HIGH confidence**
- FastAPI PyPI: https://pypi.org/project/fastapi/ (v0.136.1, Apr 2026) — **HIGH confidence**
- Celery PyPI: https://pypi.org/project/celery/ (v5.6.3, Mar 2026) — **HIGH confidence**
- Fish Speech via Context7 (/fishaudio/fish-speech) — **HIGH confidence**
- CosyVoice via Context7 (/funaudiollm/cosyvoice) — **HIGH confidence**
- Coqui TTS via Context7 (/coqui-ai/tts) — **HIGH confidence**
- ChatTTS via Context7 (/2noise/chattts) — **HIGH confidence**
- Next.js via Context7 (/vercel/next.js) — **HIGH confidence**
- Celery docs via Context7 (/websites/celeryq_dev_en_stable) — **HIGH confidence**

## Confidence Assessment

| Area | Level | Reason |
|------|-------|--------|
| TTS Engine (Qwen3-TTS) | HIGH | Verified via PyPI, GitHub, Context7 docs. Benchmarks published. Active development. |
| Frontend (Next.js + React) | HIGH | Industry standard. Verified via Context7. |
| Backend (FastAPI + Celery) | HIGH | Industry standard. Verified via PyPI + Context7. Stable, well-documented. |
| Audio Processing | HIGH | soundfile and FFmpeg are battle-tested. Used by Qwen3-TTS directly. |
| Infrastructure | MEDIUM | Docker + GPU setup needs testing. NVIDIA Container Toolkit configuration varies by host. |
| Qwen3-TTS production readiness | MEDIUM | Very new (Jan 2026). PyPI package at v0.1.1. May have edge cases. But benchmarks and docs are solid. |

---

*Stack research: 2026-04-25*
