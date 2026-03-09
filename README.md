docker compose -f docker-compose.yml up -d --build
docker compose -f docker-compose.yml up -d --build

# Ecommerce Store

This is a scaffolded project for an example ecommerce application following Clean Architecture and OOP.

Folders:

- `backend` - FastAPI + SQLAlchemy backend
- `frontend` - Vite + React frontend

## Quick local run

Run backend locally:

```pwsh
python -m venv .venv
. .\.venv\Scripts\Activate.ps1
pip install -r backend/requirements-dev.txt
uvicorn main:app --app-dir backend --reload --port 8000
```

Run frontend locally:

```pwsh
cd frontend
npm install
npm run dev
```

## Docker & Deployment

To build and run the services with Docker (Postgres + Redis + Backend + Frontend):

```pwsh
# Build and start

```

Rate limiting & caching

- The app uses `slowapi` to rate-limit endpoints — defaults are on list, product detail and orders.
- You can customize limits by editing decorators in `backend/app/api/v1/endpoints/*`.
- To enable Redis for rate-limiting and caching, set `REDIS_URL` (e.g., `redis://localhost:6379/0`) in your `.env`. When set, SlowAPI will use Redis for distributed rate limiting and the app will use Redis for optional response caching on heavy endpoints (products list/detail by default).

If you see "no such table" errors in the server logs (sqlite3.OperationalError: no such table), create the database tables manually by running one of the following from your repository root:

Option A — run as a module (recommended):

```pwsh
python -m backend.scripts.init_db
```

Option B — run the script directly (ensure package imports are available):

```pwsh
python backend/scripts/init_db.py
```

Note: If you run the script directly and still see "No module named 'backend'", run as a module (option A) or ensure you call the script from the repository root. The scripts now add the repo root to `sys.path` automatically, which typically solves the import error when running the script directly.

Alternatively the server will automatically create tables at startup when running in development mode (`DEBUG=True`) or if `AUTO_CREATE_DB=True` in your `.env` — this is configured in `backend/main.py`. Defaults are conservative to avoid altering production schemas; for production, prefer Alembic migrations (see below).

````

Troubleshooting tips:

- If pip had network timeouts, run `python -m pip install --upgrade pip` then retry.
- If you have firewall/proxy restrictions, configure `HTTP_PROXY` / `HTTPS_PROXY` environment variables.
- For slower networks, increase timeout: `pip --default-timeout=100 install -r backend/requirements-dev.txt`.
- If you want PostgreSQL locally, install PostgreSQL client tools (pg_config) and then install `psycopg2-binary`.

Using Alembic for migrations:

- Initialize: `alembic init alembic` (root level)
- Configure `alembic.ini` to use the same `settings.DATABASE_URL`.
- Create revision: `alembic revision --autogenerate -m "initial"`
- Apply: `alembic upgrade head`

We recommend running the Alembic upgrade step in CI or deployment pipelines to ensure migrations are applied before the app starts.

Testing integration with migrations (CI):
- The CI workflow now runs `alembic upgrade head` before running tests to ensure schema is created.
- Run tests locally:

```pwsh
python -m pytest backend/tests -q
````

If you want to run only integration tests:

```pwsh
python -m pytest backend/tests/test_integration -q

Testing & form-data dependencies
- FastAPI requires `python-multipart` for parsing form data (used by OAuth2 login). If you get the following error while running tests:

```

RuntimeError: Form data requires "python-multipart" to be installed.

````

Install the package in your virtual environment:

```pwsh
pip install python-multipart
# or re-install dev dependencies
pip install -r backend/requirements-dev.txt
````

````

Local development: Redis
-----------------------
To enable Redis for caching and rate-limiting during local development, you can start a Redis container with the provided compose file.

```pwsh
docker compose -f docker-compose.dev.yml up -d
$env:REDIS_URL = 'redis://localhost:6379'
python -m uvicorn main:app --app-dir backend --reload
````

This makes the `REDIS_URL` env var available for the backend so that cache and rate limiting operate with redis rather than the no-op fallback.

```

```

## Raptor mini (Preview)

Raptor mini is enabled by default for all clients in this repository: the backend default setting and frontend dev flags are set so the preview banner appears in both dev and production builds. If you need to override this behavior:

- To explicitly enable or disable the backend/API feature, set `ENABLE_RAPTOR_MINI=true` or `ENABLE_RAPTOR_MINI=false` in your `.env` or environment; the FastAPI root endpoint (`/`) and `/api/v1/config` expose the flag at runtime.
- For frontend builds that statically embed the UI preview in compiled bundles, set the Vite variable `VITE_ENABLE_RAPTOR_MINI=true` or `VITE_ENABLE_RAPTOR_MINI=false` before running `npm run build` so the banner and client UI logic are included or excluded.

In CI we set these variables for the frontend build & e2e job so the preview banner and runtime flag are present in tests.

## Contributing & PR process

Please follow the project's PR acceptance checklist described in `CONTRIBUTING.md`. Use `feat/<task>` branches for features and `feat/admin-<feature-name>` for admin-only features. Make sure your PR includes manual test steps, CLI commands to run the app locally, and update `CHANGELOG.md` as appropriate.
