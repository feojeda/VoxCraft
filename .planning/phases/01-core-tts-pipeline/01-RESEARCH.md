# Phase 1 Research: Core TTS Pipeline

**Phase:** 01-core-tts-pipeline
**Researched:** 2026-04-25
**Discovery Level:** Level 2 — Standard Research
**Confidence:** HIGH

## Research Questions

1. **RQ-01:** What is the exact Qwen3-TTS CustomVoice API for synthesis, speakers, and language support?
2. **RQ-02:** How does speed control work in Qwen3-TTS — native parameter or post-processing?
3. **RQ-03:** What is the correct Celery + FastAPI + Redis integration pattern for async TTS jobs?
4. **RQ-04:** How to integrate WaveSurfer.js 7.x in a Next.js 15 React component with dark theme?
5. **RQ-05:** What is the text chunking strategy for long inputs (5000+ words)?
6. **RQ-06:** What GPU/VRAM management is needed for Qwen3-TTS in a Celery worker?

---

## Findings

### F-01: Qwen3-TTS CustomVoice API (RQ-01)

**Source:** Qwen3-TTS GitHub, Context7 `/kritsanan1/qwen3-tts` — HIGH confidence

The CustomVoice model is loaded via HuggingFace-style `from_pretrained`:

```python
from qwen_tts import Qwen3TTSModel

model = Qwen3TTSModel.from_pretrained(
    "Qwen/Qwen3-TTS-12Hz-1.7B-CustomVoice",
    device_map="cuda:0",
    dtype=torch.bfloat16,
    attn_implementation="flash_attention_2",
)
```

**Synthesis API:**
- `model.generate_custom_voice(text, language, speaker, instruct="", ...)`
- Returns `(wavs, sample_rate)` where `wavs` is a list of numpy arrays
- `text`: single string or list of strings (batch)
- `language`: `"English"`, `"Spanish"`, `"Chinese"`, etc. or `"auto"` for auto-detection
- `speaker`: one of 9 predefined speaker names (lowercase)
- `instruct`: natural language instruction for style/emotion control (1.7B model only)
- Output: WAV at 24kHz sample rate (save via `soundfile.write()`)

**Supported speakers (9 total):**
```
['aiden', 'dylan', 'eric', 'ono_anna', 'ryan', 'serena', 'sohee', 'uncle_fu', 'vivian']
```

**Supported languages (10 + auto):**
```
['auto', 'chinese', 'english', 'french', 'german', 'italian', 'japanese', 'korean', 'portuguese', 'russian', 'spanish']
```

**Key generation parameters:**
- `do_sample=True` (recommended)
- `temperature=0.9` (0.1–1.5, higher = more random)
- `max_new_tokens=2048` (controls max output length)
- `top_k=50`, `top_p=1.0`, `repetition_penalty=1.05`

**Batch inference supported:** Pass lists for `text`, `language`, `speaker`, `instruct` — model generates all in one call.

**Implications for planning:**
- Speaker names are lowercase strings — map to display names in frontend (e.g., "serena" → "Serena — EN Female")
- Language values are capitalized strings, not ISO codes — need a mapping layer
- `get_supported_speakers()` and `get_supported_languages()` can be called at startup to seed the voice catalog
- Output is numpy array at 24kHz — must convert to WAV via soundfile, then MP3 via FFmpeg

---

### F-02: Speed Control Strategy (RQ-02)

**Source:** Qwen3-TTS docs, Context7 — HIGH confidence

**Critical finding:** Qwen3-TTS `generate_custom_voice` does NOT have a native `speed` parameter. The main model's API signature is:

```python
model.generate_custom_voice(
    text, language, speaker, instruct,
    do_sample, max_new_tokens, temperature, top_k, top_p, repetition_penalty
)
```

There is NO `speed` parameter. Speed must be achieved through one of two approaches:

**Option A: `instruct` parameter (recommended for Phase 1)**
- Pass speed instructions via the `instruct` parameter: `"Speak faster"`, `"Speak slowly"`, `"Speak at a moderate pace"`
- This is the model-native approach — the model adjusts its internal speech rate
- Pros: Natural-sounding output, model understands tempo context
- Cons: Less precise than numeric control, quality may vary

**Option B: FFmpeg post-processing (atempo filter)**
- Use FFmpeg's `atempo` filter: `ffmpeg -i input.wav -filter:a "atempo=1.5" output.wav`
- Range: 0.5x to 2.0x (single filter), 0.5x to 4.0x (chained filters)
- Pros: Precise numeric control, predictable
- Cons: Artifacts at extreme values, pitch correction needed

**Recommended approach for D-09 (speed slider 0.5x–2.0x):**
- **Primary:** Use `instruct` parameter with speed instructions mapped from the slider value
- **Fallback:** FFmpeg `atempo` post-processing for precise numeric control
- **Hybrid (best quality):** Use `instruct` for the speed intent, then fine-tune with FFmpeg `atempo` if the user selects a very specific value (e.g., 1.7x)

**Speed-to-instruct mapping:**
| Speed Value | Instruct Text |
|------------|---------------|
| 0.5x–0.7x | "Speak very slowly" |
| 0.7x–0.9x | "Speak slowly" |
| 0.9x–1.1x | "" (no instruction — natural pace) |
| 1.1x–1.3x | "Speak slightly faster" |
| 1.3x–1.6x | "Speak faster" |
| 1.6x–2.0x | "Speak very fast" |

---

### F-03: FastAPI + Celery + Redis Integration (RQ-03)

**Source:** FastAPI docs (Context7), Celery docs (Context7) — HIGH confidence

**Architecture pattern:**
1. FastAPI receives POST request → validates with Pydantic → creates Job in SQLite → dispatches Celery task → returns 202 with job_id
2. Celery worker picks up task → updates status via DB → runs TTS inference → saves audio → marks job complete
3. Frontend polls GET `/jobs/{id}` → gets status updates → loads audio when complete

**Celery configuration (critical for GPU workers):**
```python
# backend/workers/celery_app.py
from celery import Celery

app = Celery("ttsqwen", broker="redis://localhost:6379/0")

app.conf.update(
    result_backend="redis://localhost:6379/1",
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    worker_concurrency=1,              # ONE task at a time per GPU
    worker_prefetch_multiplier=1,       # Don't prefetch extra tasks
    task_soft_time_limit=300,           # 5 min soft limit
    task_time_limit=600,                # 10 min hard limit
    worker_max_tasks_per_child=50,      # Recycle worker every 50 tasks
    task_routes={
        "workers.tasks.tts_generate": {"queue": "tts"},
    },
)
```

**FastAPI endpoint pattern:**
```python
@router.post("/generate", status_code=202)
async def create_tts_job(request: TTSRequest):
    job = await job_manager.create_job(type="tts_generate", params=request.dict())
    generate_speech.delay(job_id=job.id, text=request.text, ...)
    return {"job_id": job.id, "status": "queued"}

@router.get("/jobs/{job_id}")
async def get_job_status(job_id: str):
    job = await job_manager.get_job(job_id)
    return {"id": job.id, "status": job.status, "audio_url": job.result_url}
```

**Job status lifecycle:** `queued` → `processing` → `completed` / `failed`

**Important:** FastAPI's `BackgroundTasks` is NOT suitable for GPU inference — use Celery. FastAPI docs explicitly say: "For heavy background computations, consider using larger tools like Celery."

---

### F-04: WaveSurfer.js 7.x + Next.js Dark Theme (RQ-04)

**Source:** WaveSurfer.js GitHub/Context7 — HIGH confidence

**Initialization pattern:**
```javascript
import WaveSurfer from 'wavesurfer.js'

const wavesurfer = WaveSurfer.create({
  container: '#waveform',        // CSS selector or DOM element
  waveColor: '#4F4A85',          // Unplayed waveform color
  progressColor: '#383351',      // Played waveform color
  url: '/audio/demo.mp3',
  height: 80,
  barWidth: 2,
  barGap: 1,
  barRadius: 2,
  interact: true,                // Click to seek
  dragToSeek: true,
})
```

**Dark theme styling (per D-02, D-12):**
- `waveColor`: Muted purple/gray (e.g., `#4F4A85` or similar dark-subtle)
- `progressColor`: Slightly brighter (e.g., `#6B65A0`)
- `cursorColor`: Accent color for playback position
- Container background: Match dark theme background
- Bar style: Thin bars with gap (barWidth: 2, barGap: 1) for clean look

**React integration:**
- Create instance in `useEffect`, destroy in cleanup
- Use `ref` for container element
- Listen to events: `ready`, `finish`, `timeupdate`, `interaction`
- For empty state (D-19): call `wavesurfer.empty()` to show placeholder

**Lifecycle management:**
```javascript
useEffect(() => {
  const ws = WaveSurfer.create({ container: ref.current, ... })
  ws.on('ready', () => setIsReady(true))
  return () => ws.destroy()  // Critical: prevent memory leaks
}, [])
```

**Loading new audio:** `wavesurfer.load(url)` or `wavesurfer.loadBlob(blob)`

---

### F-05: Text Chunking Strategy for Long Inputs (RQ-05)

**Source:** Project research, Qwen3-TTS token limits — MEDIUM confidence

**Problem:** Qwen3-TTS uses `max_new_tokens=2048` default. For very long text (>1000 chars), the model may truncate or produce lower quality.

**Chunking approach:**
1. **Split at sentence boundaries** — use `re.split(r'(?<=[.!?])\s+', text)` for clean splits
2. **Target chunk size:** 200–500 characters per chunk (roughly 1-2 paragraphs)
3. **Process chunks sequentially** through Celery task (one task, internal loop)
4. **Concatenate audio** using soundfile: read each WAV, concatenate numpy arrays, write final WAV
5. **Show unified progress** — update job progress percentage as chunks complete (per D-10)

**Implementation in Celery task:**
```python
@celery_app.task(bind=True, name="tts.generate")
def generate_speech(self, job_id: str, text: str, ...):
    chunks = split_text_into_chunks(text, max_chars=400)
    audio_segments = []
    for i, chunk in enumerate(chunks):
        self.update_state(state="PROCESSING", meta={"progress": int((i / len(chunks)) * 100)})
        wavs, sr = model.generate_custom_voice(text=chunk, ...)
        audio_segments.append(wavs[0])
    # Concatenate
    final_audio = np.concatenate(audio_segments)
    sf.write(output_path, final_audio, sr)
```

**Edge cases:**
- Text with no sentence boundaries (single long paragraph) → split at comma/semicolon or fixed character count
- Mixed language text → Qwen3-TTS supports `language="auto"` for adaptive switching
- Empty chunks after splitting → filter out

---

### F-06: GPU/VRAM Management for Celery Workers (RQ-06)

**Source:** Qwen3-TTS docs, Pitfalls research — HIGH confidence

**Model size:** Qwen3-TTS-12Hz-1.7B-CustomVoice ≈ 2-3GB VRAM (with bfloat16 + FlashAttention 2)

**Memory management strategy:**
1. **Load model once at worker startup** — never per-request
2. **Use `torch.inference_mode()`** context manager during synthesis
3. **Clear GPU cache after each task:** `torch.cuda.empty_cache()`
4. **Delete intermediate tensors:** explicit `del wavs` after saving
5. **Worker concurrency = 1** — one GPU inference at a time
6. **Recycle workers:** `worker_max_tasks_per_child=50` to reclaim leaked memory

**Startup pattern:**
```python
# Module-level singleton in worker
_model = None

def get_model():
    global _model
    if _model is None:
        _model = Qwen3TTSModel.from_pretrained(
            "Qwen/Qwen3-TTS-12Hz-1.7B-CustomVoice",
            device_map="cuda:0",
            dtype=torch.bfloat16,
            attn_implementation="flash_attention_2",
        )
    return _model
```

**Per-task cleanup:**
```python
import torch

def synthesize_with_cleanup(model, text, ...):
    with torch.inference_mode():
        wavs, sr = model.generate_custom_voice(text=text, ...)
    # Save audio
    sf.write(path, wavs[0], sr)
    # Cleanup
    del wavs
    torch.cuda.empty_cache()
```

**Celery worker startup with model warmup:**
```python
from celery.signals import worker_process_init

@worker_process_init.connect
def init_model(**kwargs):
    """Load model into GPU when worker process starts."""
    get_model()  # Triggers lazy loading
```

---

## Standard Stack

Based on project research + this phase's specific findings:

### Backend (Python 3.12)
| Package | Version | Purpose |
|---------|---------|---------|
| fastapi | 0.136+ | REST API framework |
| uvicorn[standard] | 0.34+ | ASGI server |
| celery[redis] | 5.6+ | Async task queue |
| redis | 5.x | Message broker + result backend |
| sqlalchemy[asyncio] | 2.0+ | ORM (async, with aiosqlite for SQLite) |
| aiosqlite | 0.20+ | Async SQLite driver |
| alembic | 1.13+ | Database migrations |
| pydantic | 2.x | Request/response validation |
| pydantic-settings | 2.x | Environment-based config |
| qwen-tts | 0.1.1 | TTS engine |
| torch | 2.5+ | PyTorch (installed with qwen-tts) |
| soundfile | 0.12+ | WAV audio I/O |
| flash-attn | latest | FlashAttention 2 for GPU efficiency |

### Frontend (Next.js 15)
| Package | Version | Purpose |
|---------|---------|---------|
| next | 15.x | React framework |
| react | 19.x | UI library |
| typescript | 5.x | Type safety |
| tailwindcss | 4.x | Utility-first CSS |
| wavesurfer.js | 7.x | Waveform visualization + playback |
| lucide-react | latest | Icons |
| @tanstack/react-query | 5.x | Async state management (job polling) |
| zustand | 5.x | Client UI state |
| zod | 3.x | Schema validation |

### System Dependencies
| Dependency | Purpose |
|-----------|---------|
| FFmpeg 6.x+ | WAV→MP3 conversion, atempo speed adjustment |
| Redis 7.x+ | Celery broker + result backend |
| NVIDIA CUDA 12.x | GPU acceleration |
| Python 3.12 | Runtime (NOT 3.14) |

---

## Architecture Patterns

### Async Job Pattern (Non-Negotiable)
- FastAPI → dispatches Celery task → returns 202 immediately
- Celery worker processes on GPU
- Frontend polls for status updates
- API NEVER calls inference directly

### Engine Abstraction (BaseTTSEngine)
- Abstract interface: `synthesize(text, speaker, language, speed, instruct) -> SynthesisResult`
- `QwenTTSEngine` adapter wraps `generate_custom_voice`
- Worker code depends on interface, not model-specific API
- Enables future engine swaps without changing task logic

### Model Singleton per Worker
- Load once at worker startup via Celery `worker_process_init` signal
- `torch.inference_mode()` during synthesis
- `torch.cuda.empty_cache()` after each task
- `worker_concurrency=1`, `worker_max_tasks_per_child=50`

### Audio Pipeline
- Qwen3-TTS outputs numpy arrays at 24kHz
- Save as WAV via `soundfile.write()`
- Convert to MP3 via FFmpeg subprocess for download
- Serve audio files via FastAPI static files or dedicated endpoint

---

## Don't Hand-Roll

| What | Use Instead | Why |
|------|-------------|-----|
| SSML parser | Qwen3-TTS `instruct` parameter | Model uses natural language, not SSML |
| Audio resampling | FFmpeg or scipy.signal.resample_poly | Proper anti-aliasing, no artifacts |
| Custom task queue | Celery + Redis | Battle-tested, handles failures, retries, time limits |
| Model loading per request | Singleton + Celery worker init | GPU load takes 30-90s, model is 2-3GB |
| WAV→MP3 conversion | FFmpeg subprocess | Proper LAME encoding, metadata support |
| Waveform rendering | WaveSurfer.js 7.x | Industry standard, handles all edge cases |

---

## Common Pitfalls

### Pitfall 1: Speed control has no native API parameter
Qwen3-TTS `generate_custom_voice` has NO `speed` parameter. Must use `instruct` text or FFmpeg `atempo`. Planning must account for this — the speed slider must map to `instruct` strings or post-processing.

### Pitfall 2: GPU memory leak in long-running workers
Without explicit `torch.cuda.empty_cache()` and `worker_max_tasks_per_child`, VRAM leaks accumulate. Must design into worker architecture from Phase 1.

### Pitfall 3: Celery worker pool conflicts with CUDA
Default prefork pool doesn't work well with CUDA contexts. Use `worker_concurrency=1` (solo pool effectively). Don't use gevent/eventlet with GPU operations.

### Pitfall 4: Redis visibility_timeout for long tasks
If Redis `visibility_timeout` is shorter than task duration, tasks get re-queued. Set `visibility_timeout > 600` (longer than task_time_limit).

### Pitfall 5: Audio sample rate mismatch
Qwen3-TTS outputs at 24kHz. Browser may expect 44.1kHz. When converting WAV→MP3 via FFmpeg, must handle sample rate correctly. Test in Chrome, Firefox, Safari.

### Pitfall 6: First inference is slow (model warmup)
First CUDA inference compiles kernels (10-30s extra). Run a dummy inference at worker startup to warm up.

---

## Implications for Phase 1 Planning

### Must-Have Components
1. **FastAPI app skeleton** with config, CORS, health check
2. **SQLite database** with SQLAlchemy models: Job, AudioFile
3. **Celery worker** with Redis broker, singleton model loading
4. **Qwen3-TTS engine adapter** wrapping `generate_custom_voice`
5. **Async job endpoints**: POST /generate → 202, GET /jobs/{id}
6. **Audio file serving** endpoint
7. **WAV→MP3 conversion** via FFmpeg
8. **Text preprocessing pipeline**: strip HTML, normalize text
9. **Text chunking** for long inputs with audio concatenation
10. **Next.js frontend** with single-page layout, voice cards, waveform player, download buttons
11. **Docker Compose** for API + Worker + Redis

### Key Technical Decisions for Planning
- Speed control: hybrid approach (instruct text + FFmpeg atempo fallback)
- Voice catalog: seeded from `model.get_supported_speakers()` at worker startup
- Job polling: frontend polls every 2 seconds with TanStack Query
- Audio storage: local filesystem, served via FastAPI static mount
- No authentication in Phase 1 (deferred to Phase 3)

---

## Sources

### Primary (HIGH confidence)
- Qwen3-TTS Context7 (`/kritsanan1/qwen3-tts`) — API, speakers, languages, generation parameters
- FastAPI Context7 (`/websites/fastapi_tiangolo`) — BackgroundTasks caveat, async patterns, file upload
- Celery Context7 (`/websites/celeryq_dev_en_stable`) — Redis broker, time limits, worker config
- WaveSurfer.js Context7 (`/katspaugh/wavesurfer.js`) — API, React integration, lifecycle

### Secondary (from project research)
- `.planning/research/SUMMARY.md` — Architecture overview, pitfalls, phase ordering
- `.planning/research/STACK.md` — Full stack with versions, installation, architecture diagram
- `.planning/research/ARCHITECTURE.md` — Layer descriptions, data flows, project structure
- `.planning/research/PITFALLS.md` — 8 critical pitfalls with prevention strategies

---

*Research completed: 2026-04-25*
*Ready for planning: yes*
