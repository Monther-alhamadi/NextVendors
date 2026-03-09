"""
Cache-Control middleware — sets appropriate HTTP caching headers per route type.

Rules:
  - Static assets (/static, /assets): long-lived public cache (1 day)
  - Public catalog API (GET /api/v1/products, /api/v1/categories): short public cache (60s)
  - Admin/auth API: no-store, private
  - Everything else: no default (pass through)
"""

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp
from starlette.responses import Response
from typing import Callable

# Paths that should be publicly cacheable by browsers and CDNs
_PUBLIC_API_PREFIXES = (
    "/api/v1/products",
    "/api/v1/public/",
)

# Paths that must never be cached
_PRIVATE_API_PREFIXES = (
    "/api/v1/admin",
    "/api/v1/auth",
    "/api/v1/orders",
    "/api/v1/cart",
    "/api/v1/wishlist",
)


class CacheControlMiddleware(BaseHTTPMiddleware):
    def __init__(self, app: ASGIApp, max_age: int = 86400):
        super().__init__(app)
        self.max_age = max_age

    async def dispatch(self, request, call_next: Callable):
        response: Response = await call_next(request)
        try:
            path = request.url.path
            method = request.method

            # ── Static assets: aggressive caching ──
            if path.startswith("/static") or path.startswith("/assets"):
                response.headers.setdefault(
                    "Cache-Control", f"public, max-age={self.max_age}, immutable"
                )
            # ── Public catalog GET endpoints: short cache ──
            elif method == "GET" and any(path.startswith(p) for p in _PUBLIC_API_PREFIXES):
                response.headers.setdefault(
                    "Cache-Control", "public, max-age=60, s-maxage=300"
                )
            # ── Private/mutating endpoints: never cache ──
            elif any(path.startswith(p) for p in _PRIVATE_API_PREFIXES):
                response.headers.setdefault(
                    "Cache-Control", "no-store, no-cache, private, must-revalidate"
                )
            elif method in ("POST", "PUT", "PATCH", "DELETE"):
                response.headers.setdefault(
                    "Cache-Control", "no-store"
                )
        except Exception:
            pass
        return response
