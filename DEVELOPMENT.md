# VoxCraft — Development Guide

## Quick Start

```bash
# 1. Copy environment variables (auto-created on first start-dev)
cp .env.example .env

# 2. Configure the external TTS server (edit .env)
#    TTS_SERVER_URL=http://127.0.0.1:8000
#    TTS_SERVER_API_KEY=dummy

# 3. Install Redis (one time)
sudo apt-get install -y redis-server

# 4. Start everything
./scripts/start-dev.sh

# 5. Stop everything
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

On first run it auto-creates `.env` from `.env.example` and installs dependencies if missing.

### `./scripts/stop-dev.sh [keep]`

Stops all services. Use `keep` to stop processes but keep Redis running.

---

## URLs

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8001 |
| API Health | http://localhost:8001/api/health |
| Swagger Docs | http://localhost:8001/docs |
| TTS Server | `TTS_SERVER_URL` from `.env` (external, port 8000) |

> **Note:** The API runs on port `8001` to avoid conflict with the external TTS server which typically runs on port `8000`.

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
- **Redis** (native `redis-server` — see below)
- **External TTS Server** running (see `TTS_SERVER_URL` in `.env`)

### 1. Redis

```bash
# Install (one time)
sudo apt-get install -y redis-server

# Start
redis-server --daemonize yes

# Verify
redis-cli ping   # should reply PONG
```

### 2. Backend

```bash
cd backend

# Create virtual environment and install dependencies
uv venv .venv --python 3.12
uv pip install -r requirements.txt --python .venv/bin/python

# Start API server (hot-reload) on port 8001
.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload

# In another terminal — start Celery worker
cd backend
.venv/bin/celery -A workers.celery_app worker --loglevel=info --queues=tts --concurrency=1
```

> **Note:** The backend no longer loads ML models locally. It proxies TTS
> requests to the external server configured in `TTS_SERVER_URL`. No GPU
> is needed in the backend process.

### 3. Frontend

```bash
cd frontend

# Install dependencies
pnpm install

# Start dev server
pnpm dev
```

---

## Docker Compose (optional)

If you prefer a fully containerized environment, `docker-compose.yml` is still provided for production-like deployments. However, for local development with an external TTS server running on the host (port 8000), running natively is simpler and avoids network bridging issues.

```bash
# Start all services in Docker (advanced / CI use)
docker compose up --build

# Stop
docker compose down
```

> **Note:** When using Docker Compose, ensure the TTS server is accessible from within the Docker network (e.g., use `host.docker.internal:8000` on macOS/Windows or run the TTS server in Docker too).

---

## Environment Variables

See `.env.example` for all available variables. Key ones:

| Variable | Default | Description |
|----------|---------|-------------|
| `TTS_SERVER_URL` | `http://127.0.0.1:8000` | External OpenAI-compatible TTS server |
| `TTS_SERVER_API_KEY` | `dummy` | API key for the TTS server |
| `DATABASE_URL` | `sqlite+aiosqlite:///./voxcraft.db` | SQLite for dev |
| `REDIS_URL` | `redis://localhost:6379/0` | Redis broker |
| `CORS_ORIGINS` | `["http://localhost:3000"]` | Allowed origins |
| `GPU_DEVICE` | `cuda:0` | Legacy — only used for local model loading |
