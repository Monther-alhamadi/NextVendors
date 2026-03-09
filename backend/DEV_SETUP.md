This project uses a Python virtual environment for development. Follow these steps to create a reproducible dev environment.

Windows (recommended):

1. Open PowerShell or Command Prompt in the `backend` folder.
2. Run `scripts\setup_dev_env.bat`.
3. Activate the venv: `call .venv\Scripts\activate`.

Optional: Install and enable `pre-commit` hooks to keep your tree clean:

1. With the venv active run:

```
pip install pre-commit
pre-commit install
pre-commit run --all-files
```

This will run `ruff`, `black`, and `isort` locally before commits.

Unix / macOS:

1. Open a terminal in the `backend` folder.
2. Run `./scripts/setup_dev_env.sh` (you may need to `chmod +x` first).
3. Activate the venv: `source .venv/bin/activate`.

This will install pinned development dependencies from `requirements-dev.txt` (including FastAPI and Pydantic versions compatible with the tests and application).
