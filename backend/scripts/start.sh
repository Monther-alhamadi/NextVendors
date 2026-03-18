#!/bin/bash
set -e  # Exit immediately if any command fails

echo "=== NextVendors Backend Startup ==="

# ── Step 1: Run Alembic migrations ──────────────────────────────────
echo "[1/3] Running Alembic migrations..."
if alembic upgrade head; then
    echo "[1/3] ✅ Alembic migrations completed successfully."
else
    echo "[1/3] ⚠️  Alembic migrations failed. Falling back to auto-create tables..."
    # Fallback: use Python to create all tables via Base.metadata.create_all
    python -c "
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath('.')))
try:
    from app.core.database import init_db
    init_db()
    print('[1/3] ✅ Fallback table creation succeeded.')
except Exception as e:
    print(f'[1/3] ❌ Fallback table creation also failed: {e}')
    sys.exit(1)
"
fi

# ── Step 2: Verify critical tables exist ────────────────────────────
echo "[2/3] Verifying database tables..."
python -c "
from app.core.database import engine
from sqlalchemy import inspect
inspector = inspect(engine)
tables = inspector.get_table_names()
print(f'    Found {len(tables)} tables: {tables[:10]}...' if len(tables) > 10 else f'    Found {len(tables)} tables: {tables}')
required = ['users', 'products', 'orders']
missing = [t for t in required if t not in tables]
if missing:
    print(f'    ⚠️  Missing critical tables: {missing}')
    print('    Attempting to create missing tables...')
    from app.core.database import init_db
    init_db()
    # Re-check
    tables = inspect(engine).get_table_names()
    still_missing = [t for t in required if t not in tables]
    if still_missing:
        print(f'    ❌ Still missing: {still_missing}')
        import sys; sys.exit(1)
    else:
        print('    ✅ All critical tables now exist.')
else:
    print('    ✅ All critical tables verified.')
"

# ── Step 3: Start the application ───────────────────────────────────
echo "[3/3] Starting Gunicorn server..."
exec gunicorn main:app \
     -k uvicorn.workers.UvicornWorker \
     -w 4 \
     --bind 0.0.0.0:8000 \
     --timeout 120 \
     --graceful-timeout 30 \
     --access-logfile -
