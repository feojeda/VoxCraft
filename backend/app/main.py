"""FastAPI application entry point.

Configures CORS middleware, includes API routers under the /api prefix,
and provides a lifespan handler for startup/shutdown events.
"""

import logging
from contextlib import asynccontextmanager
from collections.abc import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.health import router as health_router
from app.config import settings

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan: runs startup/shutdown logic."""
    logger.info("ttsQwen API starting up — version 0.1.0")
    yield
    logger.info("ttsQwen API shutting down")


app = FastAPI(
    title="ttsQwen API",
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

# Mount health routes under /api prefix
app.include_router(health_router, prefix="/api")
