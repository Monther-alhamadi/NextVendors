# ── Production Dockerfile ──────────────────────────────────────────
# Multi-worker Gunicorn + Uvicorn for production performance.
# For development with hot-reload, use Dockerfile.dev instead.
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app

WORKDIR /app

RUN apt-get update && \
    apt-get install -y --no-install-recommends gcc && \
    rm -rf /var/lib/apt/lists/*

COPY requirements.txt requirements-dev.txt* ./
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

COPY . .
RUN mkdir -p /app/static/uploads /app/logs && \
    chmod +x /app/scripts/start.sh

EXPOSE 8000

# Production: Use the startup script to run migrations and then start gunicorn
CMD ["/app/scripts/start.sh"]
