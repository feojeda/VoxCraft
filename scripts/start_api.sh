#!/bin/bash
set -euo pipefail

[ -f /opt/voxcraft/env.vars ] && { set -a; source /opt/voxcraft/env.vars; set +a; }

exec /opt/voxcraft/current/venv/bin/uvicorn app.main:app \
    --host 0.0.0.0 \
    --port 8001
