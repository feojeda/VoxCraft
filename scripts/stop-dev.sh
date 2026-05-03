#!/usr/bin/env bash
# VoxCraft — Stop local development environment
#
# Stops all services started by start-dev.sh:
#   - Frontend Next.js dev server
#   - Celery worker (TTS proxy)
#   - Backend FastAPI server
#   - Redis native server
#
# Usage:
#   ./scripts/stop-dev.sh       # Stop all services
#   ./scripts/stop-dev.sh keep  # Stop processes but keep Redis running

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PID_DIR="${ROOT_DIR}/.dev-pids"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

info()  { echo -e "${CYAN}ℹ${NC}  $*"; }
ok()    { echo -e "${GREEN}✓${NC}  $*"; }
warn()  { echo -e "${YELLOW}⚠${NC}  $*"; }

KEEP_REDIS="${1:-""}"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " VoxCraft — Stopping Development Environment"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

stop_pid() {
    local name="$1"
    local pid_file="${PID_DIR}/${name}.pid"

    if [ -f "$pid_file" ]; then
        local pid
        pid=$(cat "$pid_file")
        if kill -0 "$pid" 2>/dev/null; then
            info "Stopping ${name} (PID ${pid})..."
            kill "$pid" 2>/dev/null || true

            local waited=0
            while kill -0 "$pid" 2>/dev/null && [ $waited -lt 10 ]; do
                sleep 1
                waited=$((waited + 1))
            done

            if kill -0 "$pid" 2>/dev/null; then
                warn "Force killing ${name}..."
                kill -9 "$pid" 2>/dev/null || true
            fi
            ok "${name} stopped"
        else
            info "${name} not running (stale PID file)"
        fi
        rm -f "$pid_file"
    else
        info "${name} not running (no PID file)"
    fi
}

stop_pid "frontend"
stop_pid "worker"
stop_pid "api"

if [ "$KEEP_REDIS" != "keep" ]; then
    if command -v redis-cli >/dev/null 2>&1 && redis-cli ping >/dev/null 2>&1; then
        info "Stopping Redis (native)..."
        redis-cli shutdown >/dev/null 2>&1 || true
        ok "Redis stopped"
    else
        info "Redis not running"
    fi
else
    ok "Redis kept running (use './scripts/stop-dev.sh' without 'keep' to stop)"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
