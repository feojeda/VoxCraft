#!/bin/bash
set -euo pipefail

export HOSTNAME="0.0.0.0"
export PORT=3005

exec /home/feojeda/.local/bin/node /opt/voxcraft/current/frontend/server.js
