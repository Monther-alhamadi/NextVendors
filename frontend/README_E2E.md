E2E / Local test instructions

This file describes the minimal steps to run the Admin E2E test locally.

Prerequisites

- Node.js (recommended 18+)
- Python venv with project `.venv` activated (for backend) or a running backend accessible at `http://127.0.0.1:8000`.

1. Build frontend

```powershell
# from project root
npm run build --prefix frontend
```

2. Serve the built SPA (Express server)

```powershell
# start server from frontend folder
Push-Location frontend
npm run serve-spa
# server serves: http://localhost:3000
Pop-Location
```

(Alternative: use the included Python server which sets correct MIME types)

```powershell
# from project root
$env:PORT='3000'
.venv\Scripts\python.exe frontend/dev/serve-spa-py.py
```

3. Start backend

```powershell
# from project root, using venv
.venv\Scripts\python.exe -m uvicorn main:app --app-dir backend --host 127.0.0.1 --port 8000
```

4. Run the E2E test

```powershell
# from project root or frontend
Push-Location frontend
$env:BACKEND_URL='http://127.0.0.1:8000'
npx playwright test e2e/admin-upload-cancel.spec.ts -c playwright.config.ts -j 1
Pop-Location
```

Diagnostics

- Playwright test saves diagnostics to `frontend/test-results/` when it cannot find expected elements.
- Use `frontend/e2e/debug-admin-page.spec.ts` to capture console/network traces if needed.

If you want, I can add a GitHub Actions workflow to run these steps on PRs.
