# Local development with Redis

To run a local Redis instance and test cache invalidation behavior, use the compose file in the project root:

```pwsh
docker compose -f ../docker-compose.dev.yml up -d

# Run backend and frontend locally
# (backend) in a new terminal:
Set-Location -Path 'C:\Users\hp\Desktop\projet2\ecommerce-store\backend'
$env:REDIS_URL = 'redis://localhost:6379'
uvicorn main:app --app-dir backend --reload

# (frontend) in another terminal:
Set-Location -Path 'C:\Users\hp\Desktop\projet2\ecommerce-store\frontend'
npm run dev
```

React Frontend Setup & API Contract

Overview

- Development tool: Vite + React
- Basic fetch/axios wrapper `src/services/api.js` configured with `withCredentials: true` so cookie-based refresh works.

Auth Flow (contract):

1. POST /api/v1/auth/login (form data): sets `refresh_token` cookie and `csrf_token` cookie; returns { access_token, csrf_token }

   - Example in React: use axios.post('/auth/login', new URLSearchParams({username, password}), {headers:{'Content-Type':'application/x-www-form-urlencoded'}})

2. To refresh access token:

   - Client calls POST /api/v1/auth/token with header `X-CSRF-Token: <csrf_token>`; `refresh_token` cookie will be sent automatically if `withCredentials:true`.
   - Response returns new access_token and rotates refresh cookie; client must update local csrf token.

3. Logout
   - POST /api/v1/auth/logout with header `X-CSRF-Token: <csrf_token>` and cookie; server clears cookies.

Products API:

- GET /api/v1/products?q=&limit=10
- GET /api/v1/products/:id

Caching notes (server-side):

- The backend uses Redis namespaced cache invalidation for product lists and details.
  - Lists: keys are saved under a `products` namespace and a version is incremented when products change.
  - Details: keys are saved under a `product` namespace per product id and the service invalidates those when a product is updated or deleted.
- Frontend doesn't need to manage these cache keys — the server invalidates them atomically.
- If your frontend caches product lists locally (in memory or via SW/Service Worker), prefer to:
  - Revalidate after a POST/PUT/DELETE flow, or
  - Use a unique cache key (e.g., include timestamp or version query param) for requests that must bypass server TTL.

Tip: Use `limit` and `q` query parameters as part of the request signature so the server caches multiple variations separately.

Admin cache control

- There's a protected admin endpoint `GET /api/v1/admin/cache/namespaces` that lists known cache namespaces and their versions (e.g., `products`, `product`).
- You can bump a namespace via `POST /api/v1/admin/cache/namespaces/{namespace}/bump` which increments the namespace version and invalidates previous keys.
- The frontend includes a simple Admin page showing these namespaces and a button to bump them (requires admin credentials). The page is under `/admin/cache` and is protected by `ProtectedRoute`.

Notes for frontend devs

- Use `api.js` axios instance with `withCredentials:true`.
- Always include X-CSRF-Token header when exchanging refresh token or logout.
- Avoid storing refresh token in localStorage; server sets it in HttpOnly cookie.

Next steps for frontend

- Implement routes and components: Home, Products, ProductDetail, Cart, Checkout.
- Implement `auth` higher-order component or ProtectedRoute that checks tokens and uses refresh flow.
- Implement API service for Orders and Cart persistence.

How to run locally

- Install dependencies in the `frontend` folder:

  ```pwsh
  Set-Location 'c:\Users\hp\Desktop\projet2\ecommerce-store\frontend'
  npm install
  npm run dev
  ```

Open the browser at `http://localhost:3000` (or the URL Vite shows).
Troubleshooting Login Issues

---

- If login requests from the UI fail while direct API calls to the backend succeed (e.g., `curl` or a Postman request to port 8000), ensure the Vite dev proxy points to the backend used by your local `uvicorn` instance. By default we run the backend on port `8000`. You can customize the proxy via an env var:

```pwsh
$env:VITE_BACKEND_URL='http://127.0.0.1:8000' # before running npm run dev
npm run dev
```

This ensures that the frontend proxies requests to the same backend you're running locally and avoids CORS/Proxy mismatch issues.

## Cloudinary / Image Upload

This project supports two upload workflows for product images:

Direct browser upload to Cloudinary (recommended for production): uses an unsigned upload preset _or_ a server-signed upload (preferred for better security). When the backend is configured with Cloudinary, the client will first call `GET /api/v1/cloudinary-sign` to obtain a server-signed `signature` and `timestamp` to perform a signed upload to Cloudinary directly from the browser.

To configure direct upload (recommended):

1. Create an unsigned upload preset in Cloudinary:

- Go to your Cloudinary dashboard → Settings → Upload → Upload presets
- Create a new preset and set `Unsigned` to `Yes`.
- Note the `upload_preset` and your Cloud name.

2. Set environment variables for the frontend (Vite):

- Create a `.env.local` file under `frontend` and add:

```pwsh
VITE_CLOUDINARY_CLOUD_NAME=<your-cloud-name>
VITE_CLOUDINARY_UPLOAD_PRESET=<your-upload-preset>
```

3. Rebuild your frontend for the variables to be available:

```pwsh
Set-Location -Path 'C:\Users\hp\Desktop\projet2\ecommerce-store\frontend'
npm run build
```

4. The admin product edit page will upload images directly to Cloudinary if both variables are present; otherwise it falls back to the backend upload endpoint.

Server-side Cloudinary (optional):

If you prefer to upload via the backend (server-to-cloudinary), set the following environment variable for the backend:

```pwsh
$env:CLOUDINARY_URL = 'cloudinary://<API_KEY>:<API_SECRET>@<CLOUD_NAME>'
```

This allows the backend to upload images to Cloudinary. The client will still use the returned `url` (which may be a Cloudinary secure URL).

Notes on security:

- Unsigned uploads are convenient but are less secure: only allow unsigned uploads with appropriate restrictions (upload preset settings like allowed formats and max file size) and set moderation rules if needed.
- For a fully secure flow, use unsigned uploads with client-side validation plus a server-side signature, or server-side signed uploads that require admin authentication.

--

## Admin pages & routes

- The frontend contains a small administrative UI for managing users, viewing audits/logs, and controlling cache namespaces. The primary routes (protected and requiring admin credentials) are:

  - `/admin/users` — manage users (list, activate/deactivate, delete)
  - `/admin/audit` — audit/refresh token logs (e.g., `/admin/audit/refresh-tokens`)
  - `/admin/logs` — view recent logs (`/admin/logs/recent`)
  - `/admin/cache` — view and bump cache namespaces, toggle preview features

- In development, the admin links are visible in the header when `VITE_SHOW_ADMIN_DEV` is set to `true` or when running the frontend in a non-production Vite mode. The `e2e/global-setup` script uses `backend/scripts/create_admin.py` to create a `devadmin` user for tests.

## Environment variables (frontend)

- `VITE_BACKEND_URL` — optional override for the backend API host (used in dev/proxy)
- `VITE_CLOUDINARY_CLOUD_NAME` — Cloudinary cloud name (unsigned upload fallback)
- `VITE_CLOUDINARY_UPLOAD_PRESET` — Cloudinary unsigned preset name (unsigned upload fallback)
- `VITE_SHOW_ADMIN_DEV` — set to `true` to show admin link in the header during dev runs
- `VITE_ENABLE_RAPTOR_MINI` — debug/preview flag to show a Raptor mini banner

## Cloudinary signed uploads (summary)

- The app supports three upload paths in order of preference for security:
  1. Server-signed direct browser upload: the frontend calls `GET /api/v1/cloudinary-sign` to obtain a signature/timestamp/upload_url and then uploads directly to Cloudinary. This is the recommended secure flow.
  2. Direct unsigned upload using a Cloudinary preset: set `VITE_CLOUDINARY_CLOUD_NAME` and `VITE_CLOUDINARY_UPLOAD_PRESET` so the client can upload directly using the preset (less secure; requires preset restrictions).
  3. Server-side upload (fallback): the frontend POSTs to `/api/v1/upload-image` and the backend uploads to Cloudinary or stores the image.

## Testing (local & CI)

Local unit tests (Vitest):

```pwsh
Set-Location -Path 'C:\Users\hp\Desktop\projet2\ecommerce-store\frontend'
npm install
npm run test:unit
# run a single test file:
npx vitest run src/pages/__tests__/AdminUsers.test.jsx
```

Local E2E tests (Playwright):

1. Start the backend and apply migrations (e.g., `alembic upgrade head`). Ensure the backend is reachable by the frontend (e.g., `http://127.0.0.1:8000`) and set `VITE_BACKEND_URL` if needed.
1. Create a `devadmin` user (optional — Playwright global setup will also try):

```pwsh
python ..\\backend\\scripts\\create_admin.py --username devadmin --email devadmin@example.com --password password
```

1. Install Playwright and run the tests:

```pwsh
npm install
npx playwright install --with-deps
npm run test:e2e
```

Notes for CI automation (example checklist):

- Run `alembic upgrade head` to ensure database schema is present.
- Start backend service and ensure it is reachable at `VITE_BACKEND_URL`.
- Install frontend deps: `npm ci`.
- Install Playwright browsers on CI runner: `npx playwright install --with-deps`.
- Set `VITE_*` env variables required for the build/test (e.g., `VITE_BACKEND_URL`, `VITE_CLOUDINARY_CLOUD_NAME` if using unsigned preset, `VITE_SHOW_ADMIN_DEV` for admin links in dev/CI).
- Run E2E: `npm run test:e2e`.

This should provide a stable CI flow for running the UI tests against a test backend.
