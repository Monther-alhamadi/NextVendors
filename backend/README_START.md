## Start backend helper (Windows PowerShell)

This project includes a helper to start the backend on local Windows machines while handling common issues (virtualenv activation, port conflicts).

Usage (PowerShell):

```powershell
cd backend\scripts
.\start_backend.ps1 -port 8000 -venvName ".venv_clean"
```

If the script detects another process using port 8000 it will prompt you to terminate it or choose an alternate port.

If PowerShell refuses to run activation scripts, see Execution Policy section below.

Execution policy (if activation fails):

```powershell
# Run as admin to persist change
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
# Or allow for the current session only
Set-ExecutionPolicy Bypass -Scope Process -Force
```

See `start_backend.ps1` for implementation details.
