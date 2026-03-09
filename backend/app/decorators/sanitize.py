import functools
import re
import inspect
from typing import Any
from app.core.logging_config import get_logger

try:
    from pydantic import BaseModel
except Exception:
    BaseModel = None

logger = get_logger("decorator.sanitize")

_script_re = re.compile(r"<script.*?>.*?</script>", re.IGNORECASE | re.DOTALL)
_tag_re = re.compile(r"<.*?>", re.IGNORECASE | re.DOTALL)


def _sanitize_value(v: Any):
    if isinstance(v, str):
        # remove script tags and inline event attributes
        v = _script_re.sub("", v)
        v = _tag_re.sub("", v)
        # trim and return
        return v.strip()
    if isinstance(v, dict):
        return {k: _sanitize_value(val) for k, val in v.items()}
    if isinstance(v, list):
        return [_sanitize_value(i) for i in v]
    return v


def sanitize_inputs(func):
    """Sanitize inputs for a function or coroutine.

    The decorator supports both sync and async functions. For sync
    functions we provide a regular (sync) wrapper. For async/coroutine
    functions we provide an async wrapper that awaits the underlying
    function.
    """

    @functools.wraps(func)
    def _sanitize_args_values(args_, kwargs_):
        new_args = []
        for a in args_:
            if BaseModel is not None and isinstance(a, BaseModel):
                data = a.model_dump() if hasattr(a, "model_dump") else a.dict()
                sd = _sanitize_value(data)
                new_args.append(a.__class__(**sd))
            else:
                new_args.append(_sanitize_value(a))

        new_kwargs = {}
        for k, v in kwargs_.items():
            if BaseModel is not None and isinstance(v, BaseModel):
                data = v.model_dump() if hasattr(v, "model_dump") else v.dict()
                sd = _sanitize_value(data)
                new_kwargs[k] = v.__class__(**sd)
            else:
                new_kwargs[k] = _sanitize_value(v)

        return tuple(new_args), new_kwargs

    # If the wrapped function is a coroutine function, return an async wrapper
    if inspect.iscoroutinefunction(func):

        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            try:
                new_args, new_kwargs = _sanitize_args_values(args, kwargs)
            except Exception as e:
                logger.exception("Sanitization failed: %s", e)
                new_args, new_kwargs = args, kwargs

            result = func(*new_args, **new_kwargs)
            if inspect.isawaitable(result):
                result = await result
            return result

        return wrapper

    # Otherwise, return a synchronous wrapper
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        try:
            new_args, new_kwargs = _sanitize_args_values(args, kwargs)
        except Exception as e:
            logger.exception("Sanitization failed: %s", e)
            new_args, new_kwargs = args, kwargs
        return func(*new_args, **new_kwargs)

    return wrapper
