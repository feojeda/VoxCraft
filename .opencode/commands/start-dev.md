---
description: Start local development environment (Redis + Backend + Frontend + TTS proxy)
---

Start the ttsQwen local development environment by running:

```bash
./scripts/start-dev.sh $ARGUMENTS
```

If no arguments are provided, start all services (Redis, Backend API, Celery Worker, Frontend).
The backend proxies TTS requests to an external OpenAI-compatible server (see `TTS_SERVER_URL` in `.env`).
Valid arguments: `backend`, `frontend`, `redis`.

After starting, report which services are running, their URLs, and TTS server connectivity.
