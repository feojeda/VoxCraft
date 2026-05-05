# VoxCraft

**Forge worlds with your voice.**

[Leer en español](README.es.md)

VoxCraft is a text-to-speech (TTS) web application that generates high-quality audio from text using cloned or predefined voices, with expressive prosody control (emotions, speed, style instructions). Built for content creators who need narrations, audio for videos, and podcasts.

---

## Features

- **Speech synthesis** — Generate audio from text using 9 predefined voices (English, Chinese, Japanese, Korean)
- **Voice cloning** — Clone any voice from a 3-second audio sample
- **Voice design** — Create custom voices from natural language descriptions ("Male, 30s, deep and warm")
- **Emotion presets** — Happy, sad, angry, neutral, whisper
- **Speed control** — Adjustable playback speed (0.5x to 2.0x)
- **Custom prosody** — Natural language style instructions ("Speak slowly with a melancholic tone")
- **Pronunciation dictionary** — Fix mispronounced brand names and technical terms
- **Voice presets** — Save and reuse voice + emotion + speed configurations
- **Batch processing** — Upload CSV files to generate hundreds of audio clips at once
- **Sharing** — Generate public share links for audio clips
- **User accounts** — Registration, login, personal voice library and history
- **10 languages** — Spanish, English, Chinese, French, German, Italian, Japanese, Korean, Portuguese, Russian

---

## Architecture

VoxCraft does **not** run the TTS model itself. It acts as a frontend + API layer that proxies inference requests to an external TTS server running [Qwen3-TTS](https://github.com/qwenlm/qwen3-tts).

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│                  │     │                  │     │                 │
│   Frontend       │────▶│   Backend API    │────▶│  TTS Server     │
│   Next.js        │     │   FastAPI        │     │  Qwen3-TTS      │
│   port 3005      │     │   port 8001      │     │  port 8000      │
│                  │     │                  │     │  (GPU required) │
└─────────────────┘     └──────┬───────────┘     └─────────────────┘
                               │
                               ▼
                        ┌──────────────┐
                        │    Redis     │
                        │  (Celery     │
                        │   broker)    │
                        │  port 6379   │
                        └──────────────┘
```

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Frontend | Next.js 15 + React 19 + Tailwind CSS | Web UI |
| Backend API | FastAPI (Python 3.12) | REST API, user management, job orchestration |
| Celery Worker | Celery + Redis | Asynchronous TTS job processing |
| TTS Server | Qwen3-TTS (external) | GPU inference engine |
| Database | SQLite (dev) / PostgreSQL (prod) | Users, jobs, voices, presets |

### How inference works

1. User submits text + voice settings via the web UI
2. Frontend calls the Backend API (`POST /api/generate`)
3. API creates a job in the database and enqueues it to Celery via Redis
4. Celery worker picks up the job and sends an HTTP request to the external TTS server
5. TTS server runs Qwen3-TTS inference on GPU and returns WAV audio
6. Worker saves the WAV file and converts to MP3 via FFmpeg
7. Frontend polls for job completion and displays the audio player

### TTS server endpoints used

The external TTS server must expose an OpenAI-compatible API with these endpoints:

| Endpoint | Model | Purpose |
|----------|-------|---------|
| `POST /v1/audio/speech` | `Qwen/Qwen3-TTS-12Hz-1.7B-CustomVoice` | Predefined voice synthesis + emotion |
| `POST /v1/audio/voice-design` | `Qwen/Qwen3-TTS-12Hz-1.7B-VoiceDesign` | Create voice from text description |
| `POST /v1/audio/voice-clone` | `Qwen/Qwen3-TTS-12Hz-1.7B-Base` | Clone voice from reference audio |
| `POST /v1/audio/voice-clone/prompt` | `Qwen/Qwen3-TTS-12Hz-1.7B-Base` | Pre-compute clone prompt for reuse |
| `POST /v1/audio/voice-clone/generate` | `Qwen/Qwen3-TTS-12Hz-1.7B-Base` | Synthesize using pre-computed clone prompt |

---

## Prerequisites

- **Python 3.12+** with [`uv`](https://docs.astral.sh/uv/) package manager
- **Node.js 20+** with [`pnpm`](https://pnpm.io/)
- **Redis** — native `redis-server` or via package manager
- **FFmpeg** — for audio format conversion
- **A running TTS server** — Qwen3-TTS with OpenAI-compatible API (see [TTS Server Setup](#tts-server-setup))

---

## Quick Start

### Linux (Ubuntu/Debian)

```bash
# 1. Clone the repo
git clone https://github.com/feojeda/VoxCraft.git
cd VoxCraft

# 2. Run setup (installs all dependencies, creates .env)
./scripts/setup.sh

# 3. Edit .env and point to your TTS server
#    TTS_SERVER_URL=http://127.0.0.1:8000
#    TTS_SERVER_API_KEY=dummy

# 4. Start all services
./scripts/start-dev.sh

# 5. Open in browser
#    http://localhost:3005
```

### Manual Setup (any OS)

```bash
# 1. Clone the repo
git clone https://github.com/feojeda/VoxCraft.git
cd VoxCraft

# 2. Copy environment config
cp .env.example .env
```

#### Backend

```bash
cd backend

# Create virtual environment and install dependencies
uv venv .venv --python 3.12
uv pip install -r requirements.txt --python .venv/bin/python

# Start API server (port 8001)
.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload

# In another terminal — start Celery worker
.venv/bin/celery -A workers.celery_app worker --loglevel=info --queues=tts --concurrency=1
```

#### Frontend

```bash
cd frontend

# Install dependencies
pnpm install

# Start dev server (port 3005)
pnpm dev
```

#### Redis

**Linux:**
```bash
sudo apt-get install -y redis-server
sudo systemctl start redis-server
```

**macOS:**
```bash
brew install redis
brew services start redis
```

**Windows:** See [Windows Setup](#windows-setup) below.

---

## Windows Setup

Windows requires some extra steps since the project was designed for Unix-like systems.

### 1. Install dependencies

- **Python 3.12**: Download from [python.org](https://www.python.org/downloads/)
- **Node.js 20+**: Download from [nodejs.org](https://nodejs.org/)
- **pnpm**: `npm install -g pnpm`
- **uv**: `pip install uv` or follow [uv docs](https://docs.astral.sh/uv/getting-started/installation/)
- **Redis**: Use [Memurai](https://www.memurai.com/) or run Redis via WSL

**Option A: WSL (recommended)**

The easiest way on Windows is using WSL (Windows Subsystem for Linux):

```bash
wsl --install
# Then follow the Linux Quick Start instructions inside WSL
```

**Option B: Native Windows**

```powershell
# Redis alternative: install Memurai or use WSL for Redis

# Backend
cd backend
uv venv .venv --python 3.12
uv pip install -r requirements.txt --python .venv\Scripts\python.exe

# Start API
.venv\Scripts\uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload

# Start worker (another terminal)
.venv\Scripts\celery -A workers.celery_app worker --loglevel=info --queues=tts --concurrency=1

# Frontend (another terminal)
cd frontend
pnpm install
pnpm dev
```

> **Note:** The shell scripts (`scripts/*.sh`) are designed for bash. On Windows, either use WSL, Git Bash, or run each service manually as shown above.

### 2. FFmpeg on Windows

Download from [ffmpeg.org](https://ffmpeg.org/download.html) and add to your PATH. Required for WAV → MP3 conversion.

---

## Configuration

All configuration is done via the `.env` file (copy from `.env.example`).

### Key variables

| Variable | Default | Description |
|----------|---------|-------------|
| `TTS_SERVER_URL` | `http://127.0.0.1:8000` | **URL of your Qwen3-TTS server** |
| `TTS_SERVER_API_KEY` | `dummy` | API key for the TTS server |
| `DATABASE_URL` | `sqlite+aiosqlite:///./voxcraft.db` | Database connection string |
| `REDIS_URL` | `redis://localhost:6379/0` | Redis broker URL |
| `CELERY_BROKER_URL` | `redis://localhost:6379/0` | Celery message broker |
| `CELERY_RESULT_BACKEND` | `redis://localhost:6379/1` | Celery result storage |
| `CORS_ORIGINS` | `["http://localhost:3005"]` | Allowed frontend origins |
| `SECRET_KEY` | `change-me-in-production` | JWT signing key |
| `AUDIO_OUTPUT_DIR` | `./audio_output` | Where generated audio is saved |

### Pointing to a different TTS server

Edit `.env` and change `TTS_SERVER_URL`:

```env
# Local server
TTS_SERVER_URL=http://127.0.0.1:8000

# Remote server
TTS_SERVER_URL=http://192.168.1.100:8000

# Server with API key
TTS_SERVER_URL=https://tts-api.example.com
TTS_SERVER_API_KEY=sk-your-key-here
```

Then restart the Celery worker (the API server hot-reloads automatically):

```bash
./scripts/stop-dev.sh
./scripts/start-dev.sh
```

---

## TTS Server Setup

VoxCraft requires an external TTS server running Qwen3-TTS models. This is **not included** in this repository — it's a separate service.

### What you need

- A machine with an **NVIDIA GPU** (recommended: 6+ GB VRAM)
- Python 3.12+
- The `qwen-tts` package or a serving framework like vLLM/SGLang

### Quick setup

```bash
# Install Qwen3-TTS
pip install qwen-tts
pip install flash-attn --no-build-isolation

# Start the OpenAI-compatible server (example — adjust to your setup)
# The server must listen on the port configured in TTS_SERVER_URL
python -m qwen_tts.server --host 0.0.0.0 --port 8000
```

Refer to the [Qwen3-TTS documentation](https://github.com/qwenlm/qwen3-tts) for detailed setup instructions and GPU requirements.

### Verify the TTS server is running

```bash
# Health check
curl http://127.0.0.1:8000/health

# List available models
curl http://127.0.0.1:8000/v1/models

# Test synthesis
curl -X POST http://127.0.0.1:8000/v1/audio/speech \
  -H "Content-Type: application/json" \
  -d '{"model":"Qwen/Qwen3-TTS-12Hz-1.7B-CustomVoice","input":"Hello world","voice":"ryan","response_format":"wav"}' \
  -o test.wav
```

---

## API Reference

Once running, full interactive API docs are available at:

- **Swagger UI**: http://localhost:8001/docs
- **ReDoc**: http://localhost:8001/redoc

### Main endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Create account |
| `POST` | `/api/auth/login` | Login (sets JWT cookie) |
| `POST` | `/api/auth/logout` | Logout |
| `GET` | `/api/auth/me` | Current user profile |
| `POST` | `/api/generate` | Create TTS job |
| `GET` | `/api/jobs/{id}` | Poll job status |
| `GET` | `/api/voices/predefined` | List predefined speakers |
| `POST` | `/api/voices` | Upload cloned voice |
| `GET` | `/api/voices` | List user's cloned voices |
| `PATCH` | `/api/voices/{id}` | Rename cloned voice |
| `DELETE` | `/api/voices/{id}` | Delete cloned voice |
| `GET` | `/api/audio/{id}/wav` | Download WAV audio |
| `GET` | `/api/audio/{id}/mp3` | Download MP3 audio |
| `GET` | `/api/history` | List generation history |
| `DELETE` | `/api/history/{id}` | Delete history item |
| `GET` | `/api/presets` | List voice presets |
| `POST` | `/api/presets` | Create voice preset |
| `DELETE` | `/api/presets/{id}` | Delete preset |
| `GET` | `/api/pronunciation` | List pronunciation entries |
| `POST` | `/api/pronunciation` | Add pronunciation rule |
| `DELETE` | `/api/pronunciation/{id}` | Delete rule |
| `POST` | `/api/batches` | Upload CSV for batch processing |
| `GET` | `/api/batches/{id}` | Get batch status |
| `GET` | `/api/batches/{id}/download` | Download batch as ZIP |
| `POST` | `/api/shares` | Create share link |
| `GET` | `/api/shares/public/{token}` | Public share page |
| `DELETE` | `/api/shares/{id}` | Revoke share link |

---

## Predefined Voices

| Voice | Language | Gender | Style |
|-------|----------|--------|-------|
| Vivian | Chinese | Female | Warm and expressive |
| Serena | English | Female | Clear and natural |
| Ryan | English | Male | Professional and warm |
| Aiden | English | Male | Young and energetic |
| Dylan | English | Male | Deep and resonant |
| Eric | English | Male | Calm and authoritative |
| Anna | Japanese | Female | Gentle and precise |
| Sohee | Korean | Female | Bright and friendly |
| Uncle Fu | Chinese | Male | Wise and experienced |

---

## Development

### Scripts

| Script | Description |
|--------|-------------|
| `./scripts/setup.sh` | One-time setup: install all dependencies, create `.env` |
| `./scripts/start-dev.sh` | Start all services (Redis + API + Worker + Frontend) |
| `./scripts/start-dev.sh backend` | Start only Redis + API + Worker |
| `./scripts/start-dev.sh frontend` | Start only Frontend |
| `./scripts/stop-dev.sh` | Stop all services |
| `./scripts/stop-dev.sh keep` | Stop processes but keep Redis running |
| `./scripts/test-pipeline.sh` | End-to-end pipeline integration test |

### Ports

| Service | Port |
|---------|------|
| Frontend | 3005 |
| Backend API | 8001 |
| TTS Server | 8000 (external) |
| Redis | 6379 |

### Logs

```bash
tail -f .dev-logs/api.log       # Backend API
tail -f .dev-logs/worker.log    # Celery worker
tail -f .dev-logs/frontend.log  # Next.js dev server
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, React 19, TypeScript, Tailwind CSS 4, Zustand, TanStack Query, WaveSurfer.js |
| Backend | FastAPI, SQLAlchemy 2.0 (async), Pydantic, Celery, Redis |
| Auth | JWT cookies, bcrypt password hashing |
| Database | SQLite (dev) / PostgreSQL (prod) via Alembic migrations |
| Audio | FFmpeg (WAV ↔ MP3), soundfile |
| TTS Engine | Qwen3-TTS (external, GPU required) |

---

## License

This project is licensed under the Apache 2.0 License. The TTS engine (Qwen3-TTS) is also Apache 2.0.
