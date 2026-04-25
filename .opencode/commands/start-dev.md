---
description: Start local development environment (Redis + Backend + Frontend)
---

Start the ttsQwen local development environment by running:

```bash
./scripts/start-dev.sh $ARGUMENTS
```

If no arguments are provided, start all services (Redis, Backend API, Celery Worker, Frontend).
Valid arguments: `backend`, `frontend`, `redis`.

After starting, report which services are running and their URLs.
