#!/bin/bash

# Run database migrations
echo "Running database migrations..."
alembic upgrade head

# Start the application
echo "Starting Gunicorn server..."
exec gunicorn main:app \
     -k uvicorn.workers.UvicornWorker \
     -w 4 \
     --bind 0.0.0.0:8000 \
     --timeout 120 \
     --graceful-timeout 30 \
     --access-logfile -
