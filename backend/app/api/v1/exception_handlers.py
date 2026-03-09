from fastapi import Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

try:
    import sentry_sdk
except Exception:
    sentry_sdk = None
import logging

logger = logging.getLogger(__name__)


async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    # send to sentry
    try:
        sentry_sdk.capture_exception(exc)
    except Exception:
        pass
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})


async def validation_exception_handler(request: Request, exc: RequestValidationError):
    try:
        sentry_sdk.capture_exception(exc)
    except Exception:
        pass
    return JSONResponse(status_code=422, content={"detail": exc.errors()})


async def generic_exception_handler(request: Request, exc: Exception):
    # log and report to sentry
    logger.exception("Unhandled exception")
    try:
        sentry_sdk.capture_exception(exc)
    except Exception:
        pass
    return JSONResponse(status_code=500, content={"detail": "Internal Server Error"})
