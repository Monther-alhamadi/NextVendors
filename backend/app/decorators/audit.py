from functools import wraps
import inspect
from app.core.logging_config import get_logger
from fastapi import Request

logger = get_logger("decorator.audit")


def audit(action_name: str):
    """Decorator to emit a structured audit log for critical actions.

    Usage:
    @audit("product.create")
    def create_product(...):
        ...
    """

    def decorator(func):
        # Provide different wrappers for async vs sync functions so we don't
        # accidentally `await` non-awaitable results (this has caused errors
        # when decorators were stacked around sync endpoints).
        if inspect.iscoroutinefunction(func):

            @wraps(func)
            async def wrapper(*args, **kwargs):
                req = None
                for a in args:
                    if isinstance(a, Request):
                        req = a
                        break
                logger.info(
                    {
                        "event": "audit.enter",
                        "action": action_name,
                        "path": getattr(req, 'url', None),
                    }
                )
                try:
                    result = func(*args, **kwargs)
                    if inspect.isawaitable(result):
                        result = await result
                    logger.info(
                        {
                            "event": "audit.success",
                            "action": action_name,
                            "path": getattr(req, 'url', None),
                        }
                    )
                    return result
                except Exception as e:
                    logger.exception(
                        {"event": "audit.error", "action": action_name, "error": str(e)}
                    )
                    raise

            return wrapper

        # Sync wrapper for non-async functions
        @wraps(func)
        def wrapper(*args, **kwargs):
            req = None
            for a in args:
                if isinstance(a, Request):
                    req = a
                    break
            logger.info(
                {
                    "event": "audit.enter",
                    "action": action_name,
                    "path": getattr(req, 'url', None),
                }
            )
            try:
                result = func(*args, **kwargs)
                # If a sync function returns an awaitable it's likely a bug;
                # raise an informative error rather than trying to await here.
                if inspect.isawaitable(result):
                    raise RuntimeError(
                        "Decorated sync function returned an awaitable; ensure the function is async or remove audit decorator"
                    )
                logger.info(
                    {
                        "event": "audit.success",
                        "action": action_name,
                        "path": getattr(req, 'url', None),
                    }
                )
                return result
            except Exception as e:
                logger.exception(
                    {"event": "audit.error", "action": action_name, "error": str(e)}
                )
                raise

        return wrapper

    return decorator
