# Nomad + Consul Deployment Guide

## Overview

VoxCraft deploys via **Nomad** and auto-registers in **Consul**. The deployment pipeline is: Git push → GitHub Actions → Self-hosted runner → Nomad → Consul.

## Architecture

```
GitHub Actions (self-hosted runner)
  │
  ├─ 1. Run tests
  ├─ 2. Build release (venv + code)
  ├─ 3. Update symlink
  └─ 4. nomad job run → registers in Consul automatically
```

### Nomad job structure

One job (`voxcraft`) with three tasks in a single group:

| Task | Role | Port |
|------|------|------|
| **redis** | Message broker and result backend for Celery | 6379 |
| **api** | FastAPI application (uvicorn) | 8001 |
| **worker** | Celery worker for async TTS generation | — |

### Infrastructure access

```
Consul UI:  http://192.168.4.51:8500  (token required)
Nomad UI:   http://192.168.4.51:4646  (token required)
```

Tokens stored at: `/etc/voxcraft/consul.env`

## How to deploy

### First-time setup

Ensure the host has:
- **Nomad** + **Consul** running
- **redis-server** binary available (`apt-get install redis-server`)
- **Python 3.12** available
- **ffmpeg** and **libsndfile1** installed

### Deploy

```bash
# Manual deploy
sudo bash scripts/deploy.sh

# Or push to develop and let CI handle it
git push origin develop
```

The deploy script will:
1. Check Nomad is running and `raw_exec` driver is enabled
2. Create a versioned release at `/opt/voxcraft/releases/vNNN/`
3. Copy `backend/app/`, `backend/workers/`, and wrapper scripts
4. Create venv and install dependencies
5. Update `/opt/voxcraft/current` symlink
6. Create `/opt/voxcraft/env.vars` from template (first time only)
7. Submit the Nomad job
8. Clean up old releases (keeps last 3)

### Environment variables

Production env vars live at `/opt/voxcraft/env.vars`. Created from `scripts/env.vars` on first deploy.

Key variables to configure:
- `TTS_SERVER_URL` — URL of the qwen-tts-server (e.g. `http://localhost:8000`)
- `SECRET_KEY` — Must be changed from default
- `CORS_ORIGINS` — Allowed origins for the frontend

Edit and redeploy:
```bash
sudo nano /opt/voxcraft/env.vars
sudo bash scripts/deploy.sh
```

## Service management

```bash
# Status
nomad job status voxcraft

# Restart all tasks
nomad job restart voxcraft

# Stop
nomad job stop voxcraft

# Logs (get alloc-id from nomad job status)
nomad logs -f <alloc-id>
nomad logs -f -stderr <alloc-id>
```

## Rollback

```bash
sudo bash scripts/rollback.sh
```

Shows available releases and lets you pick one. Restarts the Nomad job automatically.

## File layout on server

```
/opt/voxcraft/
  current -> releases/v002       # symlink to active release
  releases/
    v001/                         # previous release
    v002/                         # active release
      app/                        # FastAPI application
      workers/                    # Celery workers
      scripts/
        start_api.sh              # API wrapper (sources env.vars)
        start_worker.sh           # Worker wrapper (sources env.vars)
      venv/                       # Python virtual environment
  data/
    voxcraft.db                   # SQLite database
  audio_output/                   # Generated audio files
  redis-data/                     # Redis persistence
  env.vars                        # Production environment variables
```

## Consul queries

```bash
# List all services
consul catalog services

# VoxCraft API health
curl http://localhost:8500/v1/health/service/voxcraft

# DNS lookup
dig @localhost -p 8600 voxcraft.service.consul
```

## Conventions

- Service name: `voxcraft` (lowercase)
- Ports: API on 8001, Redis on 6379
- Health checks: API at `GET /api/health`, Redis via TCP
- Releases: kept in `/opt/voxcraft/releases/v001`, `v002`, etc.
- Current version: `/opt/voxcraft/current` symlink
- Config: `/opt/voxcraft/env.vars`
- Data: `/opt/voxcraft/data/`
