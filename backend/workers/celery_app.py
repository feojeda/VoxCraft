"""Celery application configuration for VoxCraft.

Configures the Celery worker with Redis broker, production-ready settings
for GPU-bound TTS inference, and auto-discovery of task modules.

Key design decisions:
- worker_concurrency=1: GPU can only handle one inference at a time
- worker_prefetch_multiplier=1: Don't prefetch extra tasks
- worker_max_tasks_per_child=50: Recycle workers to prevent VRAM leaks
- visibility_timeout=720: Must exceed task_time_limit to prevent re-queuing
"""

from celery import Celery

from app.config import settings

celery_app = Celery("voxcraft")

celery_app.conf.update(
    broker_url=settings.CELERY_BROKER_URL,
    result_backend=settings.CELERY_RESULT_BACKEND,
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    worker_concurrency=settings.WORKER_CONCURRENCY,
    worker_prefetch_multiplier=1,
    task_soft_time_limit=settings.TASK_SOFT_TIME_LIMIT,
    task_time_limit=settings.TASK_TIME_LIMIT,
    worker_max_tasks_per_child=50,
    task_routes={
        "workers.tasks.tts_generate": {"queue": "tts"},
        "workers.tasks.voice_clone": {"queue": "tts"},
    },
    visibility_timeout=720,
)

# Auto-discover tasks in workers/tasks/ directory
celery_app.autodiscover_tasks(["workers.tasks"])


@celery_app.task(name="workers.ping")
def ping() -> dict[str, str]:
    """Simple ping task for testing Celery connectivity."""
    return {"status": "pong"}
