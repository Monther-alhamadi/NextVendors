import functools
import time
import inspect
from app.core.logging_config import get_logger

logger = get_logger("decorator.monitor")


def log_and_time(func):
    """A decorator that logs function entry/exit and execution time.

    Use for endpoints or service methods to provide cross-cutting logging.
    """
    # Return an async wrapper for coroutine functions and a sync wrapper
    # for regular functions. This avoids accidentally awaiting non-awaitable
    # results when decorators are stacked.
    if inspect.iscoroutinefunction(func):

        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            start = time.time()
            try:
                logger.info({"event": "enter", "func": func.__name__})
                result = func(*args, **kwargs)
                if inspect.isawaitable(result):
                    result = await result
                return result
            except Exception as exc:
                # Log 4xx as info to avoid noise
                if hasattr(exc, 'status_code') and 400 <= exc.status_code < 500:
                    logger.info(
                         {"event": "client_error", "func": func.__name__, "error": str(exc)}
                    )
                else:
                    logger.exception(
                        {"event": "error", "func": func.__name__, "error": str(exc)}
                    )
                raise
            finally:
                elapsed = time.time() - start
                logger.info(
                    {
                        "event": "exit",
                        "func": func.__name__,
                        "duration_ms": int(elapsed * 1000),
                    }
                )

        return wrapper

    # sync wrapper
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        start = time.time()
        try:
            logger.info({"event": "enter", "func": func.__name__})
            result = func(*args, **kwargs)
            if inspect.isawaitable(result):
                raise RuntimeError(
                    "Decorated sync function returned an awaitable. Use async wrapper instead."
                )
            return result
        except Exception as exc:
            logger.exception(
                {"event": "error", "func": func.__name__, "error": str(exc)}
            )
            raise
        finally:
            elapsed = time.time() - start
            logger.info(
                {
                    "event": "exit",
                    "func": func.__name__,
                    "duration_ms": int(elapsed * 1000),
                }
            )

    return wrapper


def sync_log_and_time(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        start = time.time()
        try:
            logger.info({"event": "enter", "func": func.__name__})
            result = func(*args, **kwargs)
            # If the function returned an awaitable (rare for sync wrapper),
            # run it in the event loop instead of returning the coroutine.
            # We can't await here — this sync wrapper is intended for sync
            # functions — so for safety, raise a helpful error if that occurs.
            if inspect.isawaitable(result):
                raise RuntimeError(
                    "Decorated sync function returned an awaitable. Use async wrapper instead."
                )
            return result
        except Exception as exc:
            logger.exception(
                {"event": "error", "func": func.__name__, "error": str(exc)}
            )
            raise
        finally:
            elapsed = time.time() - start
            logger.info(
                {
                    "event": "exit",
                    "func": func.__name__,
                    "duration_ms": int(elapsed * 1000),
                }
            )

    return wrapper
