"""Health check endpoint.

Provides a simple health endpoint for load balancers and monitoring,
plus a detailed endpoint that checks Redis and Celery connectivity.
"""

from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.get("/health")
async def health_check() -> dict[str, str]:
    """Basic health check — returns API status and version."""
    return {"status": "ok", "version": "0.1.0"}


@router.get("/health/detail")
async def health_detail() -> dict[str, object]:
    """Detailed health check including Redis and Celery worker status.

    Checks:
    - API status (always ok if this responds)
    - Redis connectivity via ping
    - Celery worker count via inspect
    """
    result: dict[str, object] = {
        "api": "ok",
        "version": "0.1.0",
        "redis": "unknown",
        "celery_workers": 0,
    }

    # Check Redis connectivity
    try:
        import redis as redis_lib

        from app.config import settings

        r = redis_lib.from_url(settings.REDIS_URL)
        ping_result = r.ping()
        result["redis"] = "ok" if ping_result else "error"
        r.close()
    except Exception as e:
        result["redis"] = f"error: {e}"

    # Check Celery workers
    try:
        from workers.celery_app import celery_app

        inspect = celery_app.control.inspect()
        active = inspect.active() or {}
        result["celery_workers"] = len(active)
    except Exception:
        result["celery_workers"] = 0

    return result
