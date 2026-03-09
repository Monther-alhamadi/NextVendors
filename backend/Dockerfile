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
RUN mkdir -p /app/static/uploads /app/logs

EXPOSE 8000

# Production: Gunicorn with 4 Uvicorn workers (adjust -w based on CPU cores)
# Formula: workers = 2 * CPU_CORES + 1
CMD ["gunicorn", "main:app", \
     "-k", "uvicorn.workers.UvicornWorker", \
     "-w", "4", \
     "--bind", "0.0.0.0:8000", \
     "--timeout", "120", \
     "--graceful-timeout", "30", \
     "--access-logfile", "-"]
