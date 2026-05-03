# VoxCraft — Development Guide

## Quick Start

```bash
# 1. Copy environment variables (auto-created on first start-dev)
cp .env.example .env

# 2. Configure the external TTS server (edit .env)
#    TTS_SERVER_URL=http://192.168.4.35:8000
#    TTS_SERVER_API_KEY=dummy

# 3. Start everything
./scripts/start-dev.sh

# 4. Stop everything
./scripts/stop-dev.sh
```

## Development Commands

### `./scripts/start-dev.sh [target]`

Starts local development services.

| Target | What starts |
|--------|-------------|
| (default) | Redis + Backend API + Celery Worker + Frontend |
| `backend` | Redis + Backend API + Celery Worker |
| `frontend` | Frontend only |
| `redis` | Redis only |

On first run it auto-creates `.env` from `.env.example` with `GPU_DEVICE=cpu` and installs dependencies if missing.

### `./scripts/stop-dev.sh [keep]`

Stops all services. Use `keep` to stop processes but keep Redis running.

---

## URLs

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| API Health | http://localhost:8000/api/health |
| Swagger Docs | http://localhost:8000/docs |
| TTS Server | `TTS_SERVER_URL` from `.env` (external) |

## Logs

```bash
tail -f .dev-logs/api.log       # Backend API
tail -f .dev-logs/worker.log    # Celery worker
tail -f .dev-logs/frontend.log  # Next.js dev server
```

---

## Manual Start (without scripts)

### Prerequisites

- **Python 3.12+** (with `uv` package manager)
- **Node.js 20+** (with `pnpm`)
- **Docker** (for Redis — or a local Redis server)
- **External TTS Server** running (see `TTS_SERVER_URL` in `.env`)

### 1. Redis

```bash
docker run -d --name voxcraft-redis -p 6379:6379 redis:7-alpine
```

### 2. Backend

```bash
cd backend

# Create virtual environment and install dependencies
uv venv .venv --python 3.12
uv pip install -r requirements.txt --python .venv/bin/python

# Start API server (hot-reload)
.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# In another terminal — start Celery worker
cd backend
.venv/bin/celery -A workers.celery_app worker --loglevel=info --queues=tts --concurrency=1
```

> **Note:** The backend no longer loads ML models locally. It proxies TTS
> requests to the external server configured in `TTS_SERVER_URL`. No GPU
> is needed in the backend container/process.

### 3. Frontend

```bash
cd frontend

# Install dependencies
pnpm install

# Start dev server
pnpm dev
```

---

## Docker Compose (Full Stack)

For a containerized full-stack environment (production-like):

```bash
# Ensure Docker is running
colima start    # macOS with Colima

# Start all services
docker compose up --build

# Start only backend services
docker compose up redis api worker

# Follow logs
docker compose logs -f worker

# Stop
docker compose down

# Run pipeline integration test
./scripts/test-pipeline.sh
```

> **Note:** The `worker` service no longer needs GPU access. TTS inference
> runs on the external server (see `TTS_SERVER_URL` in `.env`). The worker
> only needs network connectivity to that server.

---

## Environment Variables

See `.env.example` for all available variables. Key ones:

| Variable | Default | Description |
|----------|---------|-------------|
| `TTS_SERVER_URL` | `http://192.168.4.35:8000` | External OpenAI-compatible TTS server |
| `TTS_SERVER_API_KEY` | `dummy` | API key for the TTS server |
| `DATABASE_URL` | `sqlite+aiosqlite:///./voxcraft.db` | SQLite for dev |
| `REDIS_URL` | `redis://localhost:6379/0` | Redis broker |
| `CORS_ORIGINS` | `["http://localhost:3000"]` | Allowed origins |
| `GPU_DEVICE` | `cuda:0` | Legacy — only used for local model loading |
