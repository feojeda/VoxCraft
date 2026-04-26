"""Application configuration via environment variables.

Uses pydantic-settings to load configuration from environment variables
and .env files. All settings have sensible defaults for local development.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables.

    All values can be overridden via a .env file or environment variables.
    """

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./ttsqwen.db"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # Audio output
    AUDIO_OUTPUT_DIR: str = "./audio_output"

    # Celery
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/1"

    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:3000"]

    # TTS Server (OpenAI-compatible HTTP API)
    TTS_SERVER_URL: str = "http://192.168.4.35:8000"
    TTS_SERVER_API_KEY: str = "dummy"

    # GPU / Inference (legacy — only used if loading model locally)
    GPU_DEVICE: str = "cuda:0"
    WORKER_CONCURRENCY: int = 1
    TASK_SOFT_TIME_LIMIT: int = 300
    TASK_TIME_LIMIT: int = 600


settings = Settings()
