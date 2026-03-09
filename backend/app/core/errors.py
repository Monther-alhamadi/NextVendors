from typing import Optional, Dict, Any
from fastapi import HTTPException


class AppError(Exception):
    """Base class for domain errors.

    Subclasses may set `status_code` and/or provide `detail` text and
    `headers` to include when converting into an `HTTPException`.
    """

    status_code: int = 500
    detail: Optional[str] = None
    headers: Optional[Dict[str, Any]] = None

    def __init__(
        self,
        detail: Optional[str] = None,
        status_code: Optional[int] = None,
        headers: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(detail)
        if detail is not None:
            self.detail = detail
        if status_code is not None:
            self.status_code = status_code
        self.headers = headers or {}


class NotFoundError(AppError):
    status_code = 404
    detail = "Not found"


class ValidationError(AppError):
    status_code = 400
    detail = "Validation error"


class ConflictError(AppError):
    status_code = 409
    detail = "Conflict"


_MAP = {
    NotFoundError: (404, "Not found"),
    ValidationError: (400, "Validation error"),
    ConflictError: (409, "Conflict"),
}


def to_http_exception(err: AppError) -> HTTPException:
    """Convert a domain AppError into a FastAPI HTTPException.

    Keeps error handling centralized and consistent.
    """
    # If the exception provides an explicit status_code, prefer that
    status_code = (
        getattr(err, "status_code", None)
        or _MAP.get(type(err), (500, "Internal server error"))[0]
    )
    default_detail = _MAP.get(type(err), (500, "Internal server error"))[1]
    detail = err.detail or (str(err) if str(err) else default_detail)
    headers = getattr(err, "headers", None) or {}
    return HTTPException(status_code=status_code, detail=detail, headers=headers)


def raise_as_http(err: AppError) -> None:
    """Raise a domain AppError as a FastAPI HTTPException.

    Useful as a small helper in endpoints to map domain errors to HTTP
    responses.
    """
    raise to_http_exception(err)
