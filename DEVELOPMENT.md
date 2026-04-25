# ttsQwen — Development Guide

## Quick Start

```bash
# 1. Copy environment variables (auto-created on first start-dev)
cp .env.example .env

# 2. Start everything
./scripts/start-dev.sh

# 3. Stop everything
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

### 1. Redis

```bash
docker run -d --name ttsqwen-redis -p 6379:6379 redis:7-alpine
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

---

## Environment Variables

See `.env.example` for all available variables. Key ones:

| Variable | Default | Description |
|----------|---------|-------------|
| `GPU_DEVICE` | `cuda:0` | `cpu` for local dev without GPU |
| `DATABASE_URL` | `sqlite+aiosqlite:///./ttsqwen.db` | SQLite for dev |
| `REDIS_URL` | `redis://localhost:6379/0` | Redis broker |
| `CORS_ORIGINS` | `["http://localhost:3000"]` | Allowed origins |
