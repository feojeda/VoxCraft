"""FastAPI application entry point.

Configures CORS middleware, includes API routers under the /api prefix,
and provides a lifespan handler for startup/shutdown events.
"""

import logging
from contextlib import asynccontextmanager
from collections.abc import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response

from app.api.routes.audio import router as audio_router
from app.api.routes.auth import router as auth_router
from app.api.routes.batch import router as batch_router
from app.api.routes.compare import router as compare_router
from app.api.routes.health import router as health_router
from app.api.routes.history import router as history_router
from app.api.routes.presets import router as presets_router
from app.api.routes.pronunciation import router as pronunciation_router
from app.api.routes.share import router as share_router
from app.api.routes.tts import router as tts_router
from app.api.routes.voices import router as voices_router
from app.config import settings
from app.core.database import init_db

logger = logging.getLogger(__name__)


class ProxyHeadersMiddleware(BaseHTTPMiddleware):
    """Trust X-Forwarded-Proto from upstream proxy (Cloudflare).

    When behind a proxy, the original request scheme is in X-Forwarded-Proto.
    This middleware rewrites request.scope["scheme"] so that starlette/fastapi
    correctly detect HTTPS for cookie Secure flag, redirect URLs, etc.
    """

    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        if settings.BEHIND_PROXY:
            forwarded_proto = request.headers.get("X-Forwarded-Proto", "").split(",")[0].strip()
            if forwarded_proto == "https":
                request.scope["scheme"] = "https"
        return await call_next(request)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan: runs startup/shutdown logic."""
    logger.info("VoxCraft API starting up — version 0.1.0")
    await init_db()
    yield
    logger.info("VoxCraft API shutting down")


app = FastAPI(
    title="VoxCraft API",
    description="Text-to-speech generation API powered by Qwen3-TTS",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS middleware — restrict origins per threat model T-01-04
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Proxy headers middleware — trust X-Forwarded-Proto from Cloudflare
if settings.BEHIND_PROXY:
    app.add_middleware(ProxyHeadersMiddleware)

# Mount health routes under /api prefix
app.include_router(health_router, prefix="/api")
app.include_router(auth_router, prefix="/api")
app.include_router(tts_router, prefix="/api")
app.include_router(voices_router, prefix="/api")
app.include_router(pronunciation_router, prefix="/api")
app.include_router(history_router, prefix="/api")
app.include_router(presets_router, prefix="/api")
app.include_router(batch_router, prefix="/api")
app.include_router(compare_router, prefix="/api")
app.include_router(share_router, prefix="/api")
app.include_router(audio_router, prefix="/api")
