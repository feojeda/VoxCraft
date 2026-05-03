#!/usr/bin/env bash
# VoxCraft — Setup script
#
# One-time setup for local development. Idempotent: safe to re-run.
# Installs system dependencies, Python/Node packages, and creates .env.
#
# Usage:
#   ./scripts/setup.sh

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

info()  { echo -e "${CYAN}ℹ${NC}  $*"; }
ok()    { echo -e "${GREEN}✓${NC}  $*"; }
warn()  { echo -e "${YELLOW}⚠${NC}  $*"; }
err()   { echo -e "${RED}✗${NC}  $*" >&2; }

check_cmd() {
    command -v "$1" >/dev/null 2>&1
}

require_python_version() {
    local required="$1"
    if ! check_cmd python3; then
        err "python3 is not installed. Install Python ${required} first."
        exit 1
    fi
    local version
    version=$(python3 --version 2>&1 | awk '{print $2}')
    if [[ ! "$version" =~ ^${required} ]]; then
        err "Python ${required} is required, but found ${version}."
        exit 1
    fi
    ok "Python ${version}"
}

require_node_version() {
    local required="$1"
    if ! check_cmd node; then
        err "Node.js is not installed. Install Node.js ${required}+ first."
        exit 1
    fi
    local version
    version=$(node --version | sed 's/v//')
    local major
    major=$(echo "$version" | cut -d. -f1)
    if [ "$major" -lt "$required" ]; then
        err "Node.js ${required}+ is required, but found ${version}."
        exit 1
    fi
    ok "Node.js ${version}"
}

# ═══════════════════════════════════════════════════════════════════════════════
# Header
# ═══════════════════════════════════════════════════════════════════════════════
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " VoxCraft — Setup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# ═══════════════════════════════════════════════════════════════════════════════
# 1. Check Python
# ═══════════════════════════════════════════════════════════════════════════════
info "Checking Python..."
require_python_version "3.12"

# ═══════════════════════════════════════════════════════════════════════════════
# 2. Check uv
# ═══════════════════════════════════════════════════════════════════════════════
info "Checking uv (Python package manager)..."
if check_cmd uv; then
    ok "uv $(uv --version | awk '{print $2}')"
else
    err "uv is not installed. Install it:"
    err "  curl -LsSf https://astral.sh/uv/install.sh | sh"
    exit 1
fi

# ═══════════════════════════════════════════════════════════════════════════════
# 3. Check Node.js
# ═══════════════════════════════════════════════════════════════════════════════
info "Checking Node.js..."
require_node_version 20

# ═══════════════════════════════════════════════════════════════════════════════
# 4. Check pnpm
# ═══════════════════════════════════════════════════════════════════════════════
info "Checking pnpm..."
if check_cmd pnpm; then
    ok "pnpm $(pnpm --version)"
else
    warn "pnpm not found. Installing..."
    npm install -g pnpm
    ok "pnpm installed"
fi

# ═══════════════════════════════════════════════════════════════════════════════
# 5. Check Redis
# ═══════════════════════════════════════════════════════════════════════════════
info "Checking Redis..."
if check_cmd redis-server && check_cmd redis-cli; then
    ok "redis-server $(redis-server --version | awk '{print $3}' | sed 's/v=//')"
else
    warn "Redis not found. Installing..."
    if check_cmd apt-get; then
        sudo apt-get update
        sudo apt-get install -y redis-server
    elif check_cmd dnf; then
        sudo dnf install -y redis
    elif check_cmd brew; then
        brew install redis
    else
        err "Could not install Redis automatically. Install redis-server manually."
        exit 1
    fi
    ok "Redis installed"
fi

# ═══════════════════════════════════════════════════════════════════════════════
# 6. Create .env
# ═══════════════════════════════════════════════════════════════════════════════
info "Checking .env..."
if [ -f "${ROOT_DIR}/.env" ]; then
    ok ".env already exists"
else
    cp "${ROOT_DIR}/.env.example" "${ROOT_DIR}/.env"
    ok ".env created from .env.example"
fi

# ═══════════════════════════════════════════════════════════════════════════════
# 7. Backend dependencies
# ═══════════════════════════════════════════════════════════════════════════════
info "Installing backend dependencies..."
cd "${ROOT_DIR}/backend"

if [ ! -d ".venv" ]; then
    uv venv .venv --python 3.12
    ok "Python virtual environment created"
fi

uv pip install -r requirements.txt --python .venv/bin/python
ok "Backend dependencies installed"

# ═══════════════════════════════════════════════════════════════════════════════
# 8. Frontend dependencies
# ═══════════════════════════════════════════════════════════════════════════════
info "Installing frontend dependencies..."
cd "${ROOT_DIR}/frontend"

if [ ! -d "node_modules" ]; then
    pnpm install
    ok "Frontend dependencies installed"
else
    ok "node_modules already exists"
fi

# ═══════════════════════════════════════════════════════════════════════════════
# 9. Verify TTS server connectivity
# ═══════════════════════════════════════════════════════════════════════════════
info "Checking TTS server connectivity..."
TTS_URL=$(grep "^TTS_SERVER_URL=" "${ROOT_DIR}/.env" 2>/dev/null | cut -d= -f2 || echo "")
if [ -n "$TTS_URL" ]; then
    TTS_HOST=$(echo "$TTS_URL" | sed -E 's|https?://||' | cut -d: -f1)
    TTS_PORT=$(echo "$TTS_URL" | sed -E 's|https?://||' | cut -d: -f2)
    TTS_PORT="${TTS_PORT:-80}"
    if check_cmd nc && nc -z "$TTS_HOST" "$TTS_PORT" 2>/dev/null; then
        ok "TTS server reachable at ${TTS_URL}"
    else
        warn "TTS server not reachable at ${TTS_URL}"
        warn "Make sure the external TTS server is running before generating audio"
    fi
else
    warn "TTS_SERVER_URL not set in .env"
fi

# ═══════════════════════════════════════════════════════════════════════════════
# Done
# ═══════════════════════════════════════════════════════════════════════════════
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " ✅ Setup complete"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  Next steps:"
echo ""
echo "    ./scripts/start-dev.sh     # Start all services"
echo "    ./scripts/stop-dev.sh      # Stop all services"
echo ""
echo "  Services will be available at:"
echo "    Frontend:      http://localhost:3000"
echo "    Backend API:   http://localhost:8001"
echo "    API Docs:      http://localhost:8001/docs"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
