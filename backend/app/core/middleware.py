from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
from typing import Callable


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, csp: str = None):
        super().__init__(app)
        # default CSP: allow self and common sources
        # Keep value as a cleaned string to avoid invalid header values
        default_csp = "default-src 'self' 'unsafe-inline' https: data:;"
        self.csp = csp or default_csp

    async def dispatch(self, request, call_next: Callable):
        response: Response = await call_next(request)
        # Basic security headers
        response.headers.setdefault("X-Frame-Options", "DENY")
        response.headers.setdefault("X-Content-Type-Options", "nosniff")
        response.headers.setdefault(
            "Referrer-Policy", "strict-origin-when-cross-origin"
        )
        response.headers.setdefault("Permissions-Policy", "geolocation=()")
        response.headers.setdefault("X-XSS-Protection", "1; mode=block")
        # Strict-Transport-Security might only be set when HTTPS
        response.headers.setdefault(
            "Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload"
        )
        # Content-Security-Policy
        if self.csp:
            # Ensure header value is a clean str without control characters
            try:
                c = str(self.csp).strip()
                # remove non-printable/control characters which can break h11
                c = "".join(ch for ch in c if 32 <= ord(ch) <= 126)
                if c:
                    response.headers.setdefault("Content-Security-Policy", c)
            except Exception:
                # best-effort only
                response.headers.setdefault("Content-Security-Policy", "")
        return response
