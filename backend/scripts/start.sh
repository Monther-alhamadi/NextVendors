#!/bin/bash
set -e  # Exit immediately if any command fails

echo "=== NextVendors Backend Startup ==="

# ── Step 1: Run Alembic migrations ──────────────────────────────────
echo "Running database migrations..."
alembic upgrade head

# ── Step 2: Seed Initial Data ───────────────────────────────────────
echo "Seeding initial data..."
python scripts/seed_data.py

echo "Checking for Superuser auto-creation variables..."
python scripts/manage_admin.py

# ── Step 3: Start the application ───────────────────────────────────
echo "Starting Gunicorn server..."
exec gunicorn main:app \
     -k uvicorn.workers.UvicornWorker \
     -w 4 \
     --bind 0.0.0.0:8000 \
     --timeout 120 \
     --graceful-timeout 30 \
     --access-logfile -
