#!/bin/bash
set -euo pipefail

[ -f /opt/voxcraft/env.vars ] && { set -a; source /opt/voxcraft/env.vars; set +a; }

exec /opt/voxcraft/current/venv/bin/celery \
    -A workers.celery_app worker \
    --loglevel=info \
    --queues=tts \
    --concurrency=1
