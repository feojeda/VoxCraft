#!/usr/bin/env bash
# ttsQwen — Start local development environment
#
# Starts all services for local development:
#   1. Redis (via Docker, if not already running)
#   2. Backend FastAPI server (uvicorn, port 8000) — proxies TTS to external server
#   3. Celery worker (queues TTS jobs, calls external OpenAI-compatible server)
#   4. Frontend Next.js dev server (port 3000)
#
# The backend no longer loads ML models locally. TTS inference runs on
# a separate OpenAI-compatible server (see TTS_SERVER_URL in .env).
#
# Usage:
#   ./scripts/start-dev.sh          # Start all services
#   ./scripts/start-dev.sh backend  # Start backend + Redis only
#   ./scripts/start-dev.sh frontend # Start frontend only
#
# Stop all services: ./scripts/stop-dev.sh

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PID_DIR="${ROOT_DIR}/.dev-pids"
LOG_DIR="${ROOT_DIR}/.dev-logs"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

info()  { echo -e "${CYAN}ℹ${NC}  $*"; }
ok()    { echo -e "${GREEN}✓${NC}  $*"; }
warn()  { echo -e "${YELLOW}⚠${NC}  $*"; }
err()   { echo -e "${RED}✗${NC}  $*" >&2; }

mkdir -p "$PID_DIR" "$LOG_DIR"

TARGET="${1:-all}"

# ─── .env check ───────────────────────────────────────────────────────────────
if [ ! -f "${ROOT_DIR}/.env" ]; then
    info "Creating .env from .env.example..."
    cp "${ROOT_DIR}/.env.example" "${ROOT_DIR}/.env"
    ok ".env created"
fi

# ─── TTS Server check ─────────────────────────────────────────────────────────
TTS_URL=$(grep "^TTS_SERVER_URL=" "${ROOT_DIR}/.env" 2>/dev/null | cut -d= -f2 || echo "")
if [ -n "$TTS_URL" ]; then
    TTS_HOST=$(echo "$TTS_URL" | sed -E 's|https?://||' | cut -d: -f1)
    TTS_PORT=$(echo "$TTS_URL" | sed -E 's|https?://||' | cut -d: -f2)
    TTS_PORT="${TTS_PORT:-80}"
    if ! nc -z "$TTS_HOST" "$TTS_PORT" 2>/dev/null; then
        warn "TTS server not reachable at ${TTS_URL}"
        warn "Make sure the external TTS server is running before generating audio"
    else
        ok "TTS server reachable at ${TTS_URL}"
    fi
fi

# ─── Redis ────────────────────────────────────────────────────────────────────
start_redis() {
    if docker exec ttsqwen-redis redis-cli ping > /dev/null 2>&1; then
        ok "Redis already running (Docker)"
        return 0
    fi

    if docker ps --format '{{.Names}}' | grep -q 'ttsqwen-redis'; then
        ok "Redis container already running"
        return 0
    fi

    info "Starting Redis via Docker..."
    docker run -d \
        --name ttsqwen-redis \
        -p 6379:6379 \
        redis:7-alpine \
        redis-server --appendonly yes \
        > /dev/null 2>&1 || {
            err "Failed to start Redis. Is Docker running? (colima start)"
            exit 1
        }
    ok "Redis started on localhost:6379"
}

# ─── Backend ──────────────────────────────────────────────────────────────────
start_backend() {
    if [ -f "${PID_DIR}/api.pid" ] && kill -0 "$(cat "${PID_DIR}/api.pid")" 2>/dev/null; then
        ok "Backend API already running (PID $(cat "${PID_DIR}/api.pid"))"
    else
        info "Starting backend API (uvicorn)..."

        if [ ! -d "${ROOT_DIR}/backend/.venv" ]; then
            info "Creating Python virtual environment..."
            uv venv "${ROOT_DIR}/backend/.venv" --python 3.12
            uv pip install -r "${ROOT_DIR}/backend/requirements.txt" \
                --python "${ROOT_DIR}/backend/.venv/bin/python"
        fi

        cd "${ROOT_DIR}/backend"
        .venv/bin/uvicorn app.main:app \
            --host 0.0.0.0 \
            --port 8000 \
            --reload \
            > "${LOG_DIR}/api.log" 2>&1 &
        echo $! > "${PID_DIR}/api.pid"
        cd "$ROOT_DIR"
        ok "Backend API started on http://localhost:8000"
    fi

    if [ -f "${PID_DIR}/worker.pid" ] && kill -0 "$(cat "${PID_DIR}/worker.pid")" 2>/dev/null; then
        ok "Celery worker already running (PID $(cat "${PID_DIR}/worker.pid"))"
    else
        info "Starting Celery worker..."
        cd "${ROOT_DIR}/backend"
        .venv/bin/celery -A workers.celery_app worker \
            --loglevel=info \
            --queues=tts \
            --concurrency=1 \
            > "${LOG_DIR}/worker.log" 2>&1 &
        echo $! > "${PID_DIR}/worker.pid"
        cd "$ROOT_DIR"
        ok "Celery worker started"
    fi
}

# ─── Frontend ─────────────────────────────────────────────────────────────────
start_frontend() {
    if [ -f "${PID_DIR}/frontend.pid" ] && kill -0 "$(cat "${PID_DIR}/frontend.pid")" 2>/dev/null; then
        ok "Frontend already running (PID $(cat "${PID_DIR}/frontend.pid"))"
    else
        info "Starting frontend (Next.js dev server)..."
        cd "${ROOT_DIR}/frontend"

        if [ ! -d "node_modules" ]; then
            info "Installing frontend dependencies..."
            pnpm install
        fi

        pnpm dev > "${LOG_DIR}/frontend.log" 2>&1 &
        echo $! > "${PID_DIR}/frontend.pid"
        cd "$ROOT_DIR"
        ok "Frontend started on http://localhost:3000"
    fi
}

# ─── Main ─────────────────────────────────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " ttsQwen — Starting Development Environment"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

case "$TARGET" in
    all)
        start_redis
        start_backend
        start_frontend
        ;;
    backend)
        start_redis
        start_backend
        ;;
    frontend)
        start_frontend
        ;;
    redis)
        start_redis
        ;;
    *)
        err "Unknown target: ${TARGET}"
        echo "Usage: $0 [all|backend|frontend|redis]"
        exit 1
        ;;
esac

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  Services:"
echo ""
if [ -f "${PID_DIR}/api.pid" ]; then
    echo "    Backend API:   http://localhost:8000"
    echo "    API Health:    http://localhost:8000/api/health"
    echo "    API Docs:      http://localhost:8000/docs"
fi
if [ -f "${PID_DIR}/worker.pid" ]; then
    echo "    Celery Worker: running (proxies TTS to external server)"
fi
if [ -f "${PID_DIR}/frontend.pid" ]; then
    echo "    Frontend:      http://localhost:3000"
fi
echo ""
echo "  TTS Server:"
if [ -n "${TTS_URL:-}" ]; then
    echo "    ${TTS_URL}"
else
    echo "    (check TTS_SERVER_URL in .env)"
fi
echo ""
echo "  Logs:"
echo "    tail -f .dev-logs/api.log"
echo "    tail -f .dev-logs/worker.log"
echo "    tail -f .dev-logs/frontend.log"
echo ""
echo "  Stop:"
echo "    ./scripts/stop-dev.sh"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
