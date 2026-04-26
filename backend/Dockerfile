# ttsQwen Backend — FastAPI + Celery Worker
#
# The worker proxies TTS requests to an external OpenAI-compatible server
# instead of loading models locally. No GPU needed in this container.
# The TTS server runs separately and handles its own GPU inference.

# Stage 1: Builder — install Python dependencies
FROM python:3.12-slim AS builder

WORKDIR /build

# System dependencies for audio processing
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    libsndfile1 \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --prefix /install -r requirements.txt

# Stage 2: Runtime — minimal image with installed packages
FROM python:3.12-slim AS runtime

WORKDIR /app

# Runtime system dependencies (ffmpeg for audio conversion, libsndfile1 for soundfile)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    libsndfile1 \
    && rm -rf /var/lib/apt/lists/*

# Copy installed Python packages from builder
COPY --from=builder /install /usr/local

# Copy application code
COPY . .

# Create audio output directory
RUN mkdir -p /app/audio_output

# Expose API port
EXPOSE 8000

# Default: run API server (override command for worker)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
