try:
    from prometheus_fastapi_instrumentator import Instrumentator
except Exception:
    Instrumentator = None
import os

try:
    import sentry_sdk
except Exception:
    sentry_sdk = None

_instrumentator = None


def init_monitoring(app):
    global _instrumentator
    # Initialize Prometheus instrumentation if available
    if Instrumentator is not None:
        try:
            # Instrumentator attempts to add middleware; in hot-reload / multi-process
            # startups it might conflict if called after the app has started.
            _instrumentator = Instrumentator().instrument(app).expose(app)
        except RuntimeError as e:
            # If middleware cannot be added because the app has already started,
            # skip instrumentation (non-fatal). This avoids noisy ERROR logs
            # during development with uvicorn's reloader.
            import logging

            logger = logging.getLogger("monitoring")
            logger.debug("Instrumentation skipped: %s", e)

    # Init Sentry if DSN exists
    sentry_dsn = os.environ.get("SENTRY_DSN")
    if sentry_dsn and sentry_sdk is not None:
        sentry_sdk.init(
            dsn=sentry_dsn,
            traces_sample_rate=float(os.environ.get("SENTRY_TRACES_SAMPLE_RATE", 0.1)),
        )
