"""Application configuration via environment variables.

Uses pydantic-settings to load configuration from environment variables
and .env files. All settings have sensible defaults for local development.
"""

from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

_PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
_ENV_FILE = _PROJECT_ROOT / ".env"


class Settings(BaseSettings):
    """Application settings loaded from environment variables.

    All values can be overridden via a .env file or environment variables.
    """

    model_config = SettingsConfigDict(env_file=str(_ENV_FILE), env_file_encoding="utf-8")

    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./voxcraft.db"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # Audio output
    AUDIO_OUTPUT_DIR: str = "./audio_output"

    # Celery
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/1"

    # Auth
    SECRET_KEY: str = "change-me-in-production"
    ACCESS_TOKEN_EXPIRE_DAYS: int = 7

    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:3000"]

    # TTS Server (OpenAI-compatible HTTP API)
    TTS_SERVER_URL: str = "http://127.0.0.1:8000"
    TTS_SERVER_API_KEY: str = "dummy"

    # GPU / Inference (legacy — only used if loading model locally)
    GPU_DEVICE: str = "cuda:0"
    WORKER_CONCURRENCY: int = 1
    TASK_SOFT_TIME_LIMIT: int = 1800
    TASK_TIME_LIMIT: int = 3600


settings = Settings()
