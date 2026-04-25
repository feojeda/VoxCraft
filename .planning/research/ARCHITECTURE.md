# Architecture Research

**Domain:** TTS / Voice Cloning Web Application
**Researched:** 2026-04-25
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                     PRESENTATION LAYER (Next.js)                  │
├──────────────────────────────────────────────────────────────────┤
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌──────────────┐  │
│  │ Text      │  │ Voice     │  │ Audio     │  │ Job Status   │  │
│  │ Editor    │  │ Catalog   │  │ Player    │  │ Dashboard    │  │
│  │ (SSML)    │  │ Browser   │  │ /Download │  │ /History     │  │
│  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘  └──────┬───────┘  │
│        │              │              │               │           │
├────────┴──────────────┴──────────────┴───────────────┴───────────┤
│                        API LAYER (FastAPI)                        │
├──────────────────────────────────────────────────────────────────┤
│  ┌─────────┐  ┌──────────┐  ┌───────────┐  ┌────────────────┐   │
│  │ Auth    │  │ Job      │  │ Voice     │  │ Audio File     │   │
│  │ Routes  │  │ Routes   │  │ Routes    │  │ Serving        │   │
│  └────┬────┘  └────┬─────┘  └─────┬─────┘  └───────┬────────┘   │
│       │            │              │                 │             │
│  ┌────┴────────────┴──────────────┴─────────────────┴────────┐  │
│  │                    Service Layer                           │  │
│  │  ┌────────────┐  ┌────────────┐  ┌──────────────────────┐ │  │
│  │  │ JobManager │  │ VoiceStore │  │ StorageService       │ │  │
│  │  └────────────┘  └────────────┘  └──────────────────────┘ │  │
│  └────────────────────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────────────────────┤
│                      WORKER LAYER (Celery)                        │
├──────────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌──────────────────────┐                  │
│  │ TTS Worker       │  │ Voice Clone Worker   │                  │
│  │ (text → audio)   │  │ (audio → voice embed)│                  │
│  └────────┬─────────┘  └──────────┬───────────┘                  │
│           │                       │                               │
├───────────┴───────────────────────┴───────────────────────────────┤
│                    INFERENCE LAYER (GPU-bound)                     │
├──────────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────────┐   │
│  │              TTS Engine (Qwen3-TTS / XTTS / etc.)         │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌────────────────┐  │   │
│  │  │ Model Loader │  │ Inference    │  │ Audio Encoder  │  │   │
│  │  │ (GPU/VRAM)   │  │ Pipeline     │  │ (for cloning)  │  │   │
│  │  └──────────────┘  └──────────────┘  └────────────────┘  │   │
│  └────────────────────────────────────────────────────────────┘   │
├──────────────────────────────────────────────────────────────────┤
│                      DATA LAYER                                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────────┐   │
│  │ SQLite / │  │ Redis    │  │ Object   │  │ Voice         │   │
│  │ Postgres │  │ (Broker) │  │ Storage  │  │ Embeddings    │   │
│  │ (Users,  │  │          │  │ (Audio)  │  │ (Speaker IDs) │   │
│  │  Jobs)   │  │          │  │          │  │               │   │
│  └──────────┘  └──────────┘  └──────────┘  └────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| **Frontend (Next.js)** | UI for text input, SSML editing, voice selection, audio playback, job tracking | React with audio player (Howler.js / Web Audio API), SSML editor component |
| **API Gateway (FastAPI)** | Auth, request validation, job creation, file serving, WebSocket for status updates | FastAPI routes with Pydantic models, JWT auth |
| **Celery Workers** | Long-running TTS inference, voice cloning, audio format conversion | Celery tasks with GPU access, Redis as broker |
| **TTS Engine** | Neural network inference: text→spectrogram→waveform, voice embedding extraction | PyTorch model loaded into GPU VRAM (Qwen3-TTS, XTTS v2, etc.) |
| **Database** | Users, jobs, voice profiles, generation history | SQLAlchemy ORM, SQLite→PostgreSQL migration path |
| **Redis** | Celery broker + result backend, job state, caching | Standard Redis instance |
| **Object Storage** | Generated audio files, uploaded voice samples | Local filesystem initially, S3-compatible for production |

## Recommended Project Structure

```
ttsQwen/
├── frontend/                    # Next.js application
│   ├── src/
│   │   ├── app/                 # Next.js App Router pages
│   │   │   ├── (auth)/          # Login, register
│   │   │   ├── generate/        # Text input + generation
│   │   │   ├── voices/          # Voice catalog + management
│   │   │   ├── history/         # Generation history
│   │   │   └── shared/          # Shared audio link pages
│   │   ├── components/
│   │   │   ├── editor/          # SSML text editor
│   │   │   ├── audio/           # Player, waveform, download
│   │   │   ├── voices/          # Voice card, upload form
│   │   │   └── jobs/            # Status indicators, progress
│   │   ├── lib/
│   │   │   ├── api.ts           # API client
│   │   │   └── audio.ts         # Web Audio API helpers
│   │   └── hooks/               # Custom React hooks
│   └── public/
│
├── backend/                     # Python FastAPI application
│   ├── app/
│   │   ├── main.py              # FastAPI app entry
│   │   ├── config.py            # Settings (env-based)
│   │   ├── api/
│   │   │   ├── routes/
│   │   │   │   ├── auth.py      # Login, register, tokens
│   │   │   │   ├── tts.py       # TTS generation endpoints
│   │   │   │   ├── voices.py    # Voice CRUD + upload
│   │   │   │   ├── audio.py     # File serving / download
│   │   │   │   └── jobs.py      # Job status / listing
│   │   │   └── deps.py          # Dependency injection
│   │   ├── models/              # SQLAlchemy ORM models
│   │   │   ├── user.py
│   │   │   ├── job.py
│   │   │   ├── voice.py
│   │   │   └── audio_file.py
│   │   ├── schemas/             # Pydantic request/response
│   │   │   ├── tts.py
│   │   │   ├── voice.py
│   │   │   └── job.py
│   │   ├── services/            # Business logic
│   │   │   ├── job_manager.py   # Job creation, status tracking
│   │   │   ├── voice_store.py   # Voice profile management
│   │   │   └── storage.py       # File storage abstraction
│   │   └── core/
│   │       ├── security.py      # JWT, password hashing
│   │       └── database.py      # DB session management
│   ├── workers/
│   │   ├── celery_app.py        # Celery configuration
│   │   ├── tasks/
│   │   │   ├── tts_generate.py  # TTS generation task
│   │   │   ├── voice_clone.py   # Voice cloning/embedding task
│   │   │   └── audio_convert.py # Format conversion task
│   │   └── engine/
│   │       ├── base.py          # Abstract TTS engine interface
│   │       ├── qwen.py          # Qwen3-TTS adapter
│   │       ├── xtts.py          # XTTS v2 adapter (fallback)
│   │       └── model_manager.py # Model loading, VRAM management
│   ├── tests/
│   ├── alembic/                 # Database migrations
│   ├── requirements.txt
│   └── Dockerfile
│
├── docker-compose.yml           # All services orchestrated
├── .env.example
└── .planning/
```

### Structure Rationale

- **`frontend/` and `backend/` separated at root level:** Completely different tech stacks (Node.js vs Python), separate build/deploy pipelines, can scale independently.
- **`workers/` inside `backend/`:** Shares Python environment and models with the API, but runs as separate Celery processes. The `engine/` subfolder isolates ML model code from business logic.
- **`engine/base.py` abstract interface:** Enables swapping TTS engines (Qwen3-TTS ↔ XTTS ↔ future models) without changing worker task code. Critical because the TTS ecosystem moves fast.
- **`model_manager.py` for VRAM:** GPU memory is the scarcest resource. A dedicated manager handles model loading/unloading, preventing OOM when multiple workers compete for VRAM.

## Architectural Patterns

### Pattern 1: Inference-Process Isolation (Critical)

**What:** Run TTS model inference in a dedicated GPU-bound process, separate from the API server. The Celery worker IS the inference process — no separate "inference server" microservice.

**When to use:** Always for ML inference. GPU models consume 2-8 GB VRAM and block the CPU/GPU during inference (1-30 seconds per request). Mixing this with API request handling creates unacceptable latency.

**Trade-offs:**
- ✅ API server stays responsive under load
- ✅ Workers can be scaled independently (add more GPU instances)
- ✅ Failed inference jobs don't crash the API
- ❌ Adds Redis dependency and operational complexity
- ❌ Job result polling adds latency for short generations

**Example:**
```python
# backend/workers/tasks/tts_generate.py
from workers.celery_app import celery_app
from workers.engine import get_engine

@celery_app.task(bind=True, name="tts.generate")
def generate_speech(self, job_id: str, text: str, voice_id: str, 
                    language: str = "en", ssml: str | None = None):
    """Celery task: runs on GPU worker, not API server."""
    engine = get_engine()  # Singleton, model stays in VRAM
    
    # Update job status
    self.update_state(state="PROCESSING", meta={"progress": 0})
    
    # Run inference (blocks 1-30s)
    audio_path = engine.synthesize(
        text=text,
        voice_ref=voice_id,  # Speaker embedding or voice sample path
        language=language,
        ssml=ssml,
    )
    
    # Store result
    return {"audio_path": str(audio_path), "job_id": job_id}
```

### Pattern 2: Engine Abstraction (Adapter Pattern)

**What:** Define a `BaseTTSEngine` interface so the specific TTS model (Qwen3-TTS, XTTS v2, etc.) can be swapped without changing worker logic or API contracts.

**When to use:** When the TTS engine choice is still evolving or when you want A/B testing between models. The PROJECT.md explicitly says "motor TTS abierto a investigación."

**Trade-offs:**
- ✅ Swap engines in config, not code
- ✅ Test engines side-by-side
- ❌ Cannot use engine-specific features without extending the interface
- ❌ Lowest-common-denominator API may miss strengths of individual engines

**Example:**
```python
# backend/workers/engine/base.py
from abc import ABC, abstractmethod
from pathlib import Path
from dataclasses import dataclass

@dataclass
class SynthesisResult:
    audio_path: Path
    sample_rate: int
    duration_seconds: float

class BaseTTSEngine(ABC):
    """Interface every TTS engine must implement."""
    
    @abstractmethod
    def synthesize(self, text: str, voice_ref: str, language: str,
                   ssml: str | None = None, emotion: str | None = None,
                   output_format: str = "wav") -> SynthesisResult:
        ...
    
    @abstractmethod
    def clone_voice(self, audio_path: Path, transcript: str | None = None) -> str:
        """Extract voice embedding. Returns voice_id."""
        ...
    
    @abstractmethod
    def get_supported_languages(self) -> list[str]:
        ...
    
    @abstractmethod
    def get_predefined_voices(self) -> list[dict]:
        """Return catalog of built-in voices."""
        ...
```

### Pattern 3: Async Job with Polling / WebSocket Status

**What:** API creates a job record, dispatches to Celery, returns job ID immediately. Frontend polls or subscribes via WebSocket for completion.

**When to use:** For any operation that takes >1 second (all TTS generation, voice cloning).

**Trade-offs:**
- ✅ API responds instantly, no timeout issues
- ✅ Works behind load balancers and proxies
- ✅ Jobs survive server restarts (Redis + DB persistence)
- ❌ More complex frontend (polling logic or WebSocket management)
- ❌ More DB writes (status updates)

**Example:**
```python
# backend/app/api/routes/tts.py
from fastapi import APIRouter, Depends
from app.services.job_manager import JobManager

router = APIRouter()

@router.post("/generate", status_code=202)
async def create_tts_job(
    request: TTSRequest,
    job_manager: JobManager = Depends(),
    current_user: User = Depends(get_current_user),
):
    # Create job in DB
    job = await job_manager.create_job(
        user_id=current_user.id,
        job_type="tts_generate",
        params=request.dict(),
    )
    
    # Dispatch to Celery (non-blocking)
    generate_speech.delay(
        job_id=job.id,
        text=request.text,
        voice_id=request.voice_id,
        language=request.language,
        ssml=request.ssml,
    )
    
    return {"job_id": job.id, "status": "queued"}

@router.get("/jobs/{job_id}")
async def get_job_status(job_id: str, ...):
    job = await job_manager.get_job(job_id)
    return JobStatusResponse(
        id=job.id,
        status=job.status,        # queued → processing → completed / failed
        audio_url=job.result_url,  # populated on completion
        error=job.error_message,   # populated on failure
    )
```

### Pattern 4: VRAM-Aware Model Manager (Singleton)

**What:** A single ModelManager singleton within each worker process manages which model is loaded into GPU memory. Prevents OOM from loading multiple large models simultaneously.

**When to use:** When GPU VRAM is limited (most setups: 8-24 GB) and you have multiple model variants.

**Trade-offs:**
- ✅ Prevents GPU OOM crashes
- ✅ Can unload/reload models on demand
- ❌ Model swap adds latency (10-60s to load a model)
- ❌ Must coordinate across workers if multiple GPU workers exist

## Data Flow

### Primary Flow: Text-to-Speech Generation

```
User enters text + selects voice
         ↓
[Frontend] POST /api/tts/generate
         ↓
[FastAPI] Validate request → Check voice exists → Create Job (DB)
         ↓                                        status: "queued"
[FastAPI] Dispatch Celery task (generate_speech.delay)
         ↓
[FastAPI] Return {job_id, status: "queued"} ← 202 Accepted
         ↓
[Frontend] Start polling GET /api/tts/jobs/{id} (or WebSocket)
         ↓
[Celery Worker] Picks up task → Update status: "processing"
         ↓
[Model Manager] Ensure TTS model loaded in VRAM
         ↓
[TTS Engine] synthesize(text, voice_ref, language, ssml)
         ↓                                    ↓
    [GPU Inference]                  1-30 seconds
         ↓
[Worker] Save audio to storage → Update Job (DB) status: "completed"
         ↓
[Frontend] Poll returns {status: "completed", audio_url: "/api/audio/xxx.mp3"}
         ↓
[Frontend] Load audio player → User plays / downloads
```

### Voice Cloning Flow

```
User uploads audio sample (3-30 seconds)
         ↓
[Frontend] POST /api/voices/upload (multipart)
         ↓
[FastAPI] Validate audio format → Store raw audio → Create Job (DB)
         ↓
[FastAPI] Dispatch Celery task (clone_voice.delay)
         ↓
[FastAPI] Return {job_id, voice_id: "temp-xxx"}
         ↓
[Celery Worker] Load audio → Extract speaker embedding (x-vector or ICL prompt)
         ↓
[Worker] Save embedding / processed reference → Update Voice record
         ↓
[Worker] Update Job status: "completed", voice_id ready for use
         ↓
[Frontend] Voice appears in user's voice catalog
```

### Batch Generation Flow

```
User uploads text file or enters multiple texts
         ↓
[Frontend] POST /api/tts/generate-batch
         ↓
[FastAPI] Create parent batch job + N child jobs
         ↓
[Celery] Dispatch N individual generate_speech tasks (chord or group)
         ↓
[Workers] Process in parallel (up to available workers)
         ↓
[Frontend] Track progress: "3/10 completed"
         ↓
[All done] Batch downloadable as ZIP
```

### State Management

```
                    ┌─────────────────┐
                    │   SQLite/PG     │
                    │                 │
                    │  users          │
                    │  jobs           │──── Job lifecycle:
                    │  voices         │     queued → processing
                    │  audio_files    │     → completed / failed
                    └────────┬────────┘
                             │
                    ┌────────┴────────┐
                    │     Redis        │
                    │                 │
                    │  Celery broker  │──── Task queue + results
                    │  Celery backend │
                    │  Job cache      │
                    └─────────────────┘
```

### Key Data Flows

1. **TTS Generation:** Text + voice_id → API → Job (DB) → Celery queue (Redis) → Worker picks up → GPU inference → Audio file (storage) → Job result URL (DB) → Frontend plays
2. **Voice Cloning:** Audio upload → API stores file → Job → Worker extracts embedding → Voice record (DB) → Available for generation
3. **Audio Serving:** Frontend requests `/api/audio/{id}` → API reads from storage → Streams response with appropriate Content-Type
4. **Share Link:** User clicks "Share" → API creates share token → Public URL `/shared/{token}` → Plays audio without auth

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| **0-100 users** (v1) | Single server: API + 1 worker + SQLite + local filesystem. GPU with 8GB+ VRAM. Monolithic deploy. |
| **100-10K users** | Add PostgreSQL, Redis stays. Multiple Celery workers on same GPU (concurrency=2-4 with model sharing). S3-compatible storage. Nginx reverse proxy. |
| **10K-100K users** | Separate API servers (horizontal). Dedicated GPU workers (possibly multiple machines). Redis Sentinel for HA. CDN for audio delivery. Queue prioritization (paid users first). |
| **100K+ users** | Kubernetes orchestration. Auto-scaling GPU worker pool based on queue depth. Multi-region audio storage. Consider streaming inference for lower latency. |

### Scaling Priorities

1. **First bottleneck: GPU inference speed.** A single GPU processes 1-4 concurrent requests. Solution: add GPU workers, implement request batching where the engine supports it.
2. **Second bottleneck: Storage I/O.** Audio files accumulate fast (1-10 MB each). Solution: offload to object storage (S3), serve via CDN.
3. **Third bottleneck: Database under concurrency.** Job status polling creates read-heavy load. Solution: Redis caching for job status, PostgreSQL for persistent data.

## Anti-Patterns

### Anti-Pattern 1: Synchronous Inference in API Process

**What people do:** Call `model.synthesize()` directly in the FastAPI route handler.
**Why it's wrong:** TTS inference takes 1-30 seconds and holds the GPU. Under load, all API workers block, every endpoint becomes unresponsive. Timeout errors cascade.
**Do this instead:** Always dispatch to Celery worker. API creates job, returns 202 immediately.

### Anti-Pattern 2: Loading the Model Per Request

**What people do:** `model = TTS("xtts_v2")` inside every request handler.
**Why it's wrong:** Loading a TTS model into GPU takes 10-60 seconds and consumes 2-8 GB VRAM. Doing this per request means every request takes 30+ seconds and you'll OOM the GPU.
**Do this instead:** Load model once at worker startup, keep in VRAM as a singleton. Use ModelManager for lifecycle.

### Anti-Pattern 3: Storing Audio Blobs in the Database

**What people do:** Store generated audio as BLOB in the jobs table.
**Why it's wrong:** Audio files are 1-10 MB each. Database bloats, backups become expensive, serving binary from DB is slow.
**Do this instead:** Store files on filesystem or object storage (S3). Database stores only the file path/URL.

### Anti-Pattern 4: Tight Coupling to a Single TTS Engine

**What people do:** Import `from TTS.api import TTS` directly in task code, use engine-specific APIs everywhere.
**Why it's wrong:** The TTS ecosystem moves fast. XTTS v2 may be superseded by Qwen3-TTS. Engine-specific code pervading the codebase means a full rewrite to switch.
**Do this instead:** Abstract engine behind `BaseTTSEngine` interface. Engine selection via config. Only the engine adapter knows about model-specific APIs.

### Anti-Pattern 5: No Audio Duration Limits

**What people do:** Accept any length of text with no limits.
**Why it's wrong:** Long text → very long inference time → GPU blocked → queue backs up. A 10-minute narration can take 5+ minutes of GPU time.
**Do this instead:** Enforce max character/word limits per request. For long texts, split into chunks and batch process. Communicate limits clearly in the UI.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| **TTS Model (HuggingFace)** | Model download at deploy time, weights cached locally | Models are 1-4 GB download. Don't download at runtime. |
| **GPU (CUDA)** | PyTorch CUDA device, `device_map="cuda:0"` | Must validate GPU available at worker startup. |
| **Object Storage (S3)** | Boto3 client for file upload/download | Start with local filesystem, add S3 later behind StorageService abstraction. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Frontend ↔ API | REST (JSON) + optional WebSocket | API serves audio files as static content. CORS configuration needed. |
| API ↔ Celery | Redis broker (task dispatch) | Fire-and-forget dispatch. API never calls worker synchronously. |
| Celery ↔ TTS Engine | Direct Python call (same process) | Engine is a singleton within worker. Model stays loaded in VRAM. |
| API ↔ Database | SQLAlchemy ORM | Async sessions (asyncpg for PostgreSQL, aiosqlite for SQLite). |
| Worker ↔ Storage | StorageService abstraction | Filesystem initially, S3-compatible later. No direct filesystem access from API except via this service. |

## Build Order (Dependency-Based)

This ordering ensures each phase builds on a working foundation:

```
Phase 1: Foundation
├── FastAPI skeleton (health check, config)
├── SQLite + SQLAlchemy models (User, Job, Voice, AudioFile)
├── Docker Compose (API + Redis)
└── Can verify: API starts, DB connects

Phase 2: TTS Engine Integration ← Depends on Phase 1
├── BaseTTSEngine interface
├── First engine adapter (Qwen3-TTS or XTTS v2)
├── ModelManager singleton (GPU loading)
├── Single synchronous endpoint for testing
└── Can verify: POST text → GET audio file (slow, blocking, but works)

Phase 3: Async Job Queue ← Depends on Phase 1 + 2
├── Celery worker with TTS engine
├── Job creation + dispatch from API
├── Job status polling endpoint
├── Audio file storage + serving
└── Can verify: POST text → 202 job_id → poll → download audio

Phase 4: Voice Cloning ← Depends on Phase 2 + 3
├── Voice upload endpoint (audio validation)
├── Voice cloning Celery task (embedding extraction)
├── Voice catalog CRUD (list, delete)
├── Predefined voice seeding
└── Can verify: Upload sample → clone voice → generate with cloned voice

Phase 5: SSML & Emotion Control ← Depends on Phase 3
├── SSML parser/validator in worker
├── Emotion parameter mapping per engine
├── Text preprocessing pipeline (SSML → engine input)
└── Can verify: Generate with SSML markup, emotion tags → correct prosody

Phase 6: Frontend UI ← Depends on Phase 3 (API is functional)
├── Text editor with SSML helpers
├── Voice browser + upload
├── Audio player + download
├── Job status / history view
├── Auth (login/register)
└── Can verify: Full user flow through UI

Phase 7: User Auth & Management ← Depends on Phase 1 + 6
├── JWT auth on API routes
├── User registration / login
├── Per-user voice library
├── Generation history per user
└── Can verify: Register → login → generate → see history

Phase 8: Batch + Sharing ← Depends on Phase 3 + 6
├── Batch text processing (multiple texts → ZIP)
├── Share link generation (public, expiring)
├── Audio format conversion (WAV → MP3)
└── Can verify: Upload 10 texts → download ZIP → share one link
```

### Critical Path Analysis

- **Phase 2 (TTS Engine) is the riskiest phase.** Engine selection determines API surface, voice cloning approach, and quality. If the engine can't do what's needed, everything downstream changes.
- **Phase 3 (Async Queue) gates user-facing value.** Without it, the app feels broken (requests timeout). Must ship before frontend.
- **Phases 6 and 7 can partially overlap.** Frontend can start with hardcoded auth once API routes are defined.

## Sources

- **Qwen3-TTS documentation** (Context7: /kritsanan1/qwen3-tts) — Voice cloning API, model loading, ICL mode, x-vector mode. HIGH confidence.
- **Coqui TTS / XTTS v2** (Context7: /coqui-ai/tts) — Server API architecture, voice cloning patterns, speaker embedding. HIGH confidence.
- **AllTalk TTS** (Context7: /erew123/alltalk_tts) — Production TTS server patterns, model switching, streaming, API design. HIGH confidence.
- **FastAPI documentation** (Context7: /websites/fastapi_tiangolo) — Background tasks, async patterns, Pydantic validation. HIGH confidence.
- **Celery documentation** (Context7: /websites/celeryq_dev_en_stable) — Task queue architecture, result backends, Redis integration. HIGH confidence.

---
*Architecture research for: TTS / Voice Cloning Web Application*
*Researched: 2026-04-25*
