import logging
import os
import logging.handlers

try:
    from pythonjsonlogger import jsonlogger  # type: ignore
except Exception:
    jsonlogger = None

try:
    import sentry_sdk
    from sentry_sdk.integrations.logging import LoggingIntegration
except Exception:
    sentry_sdk = None
    LoggingIntegration = None

try:
    import httpx
except Exception:
    httpx = None


def init_logging():
    # Basic JSON logger config
    log_level = os.environ.get("LOG_LEVEL", "INFO")
    root_logger = logging.getLogger()
    root_logger.setLevel(log_level)
    # JSON formatter if available, otherwise fall back to default formatter
    logHandler = logging.StreamHandler()
    if jsonlogger is not None:
        formatter = jsonlogger.JsonFormatter(
            '%(asctime)s %(levelname)s %(name)s %(message)s'
        )
    else:
        from logging import Formatter

        formatter = Formatter('%(asctime)s %(levelname)s %(name)s %(message)s')
    logHandler.setFormatter(formatter)
    # add console handler
    root_logger.handlers = [logHandler]

    # add rotating file handler
    logfile = os.environ.get("LOG_FILE_PATH", "logs/app.log")
    os.makedirs(os.path.dirname(logfile), exist_ok=True)
    rotating = logging.handlers.RotatingFileHandler(
        logfile, maxBytes=10 * 1024 * 1024, backupCount=5
    )
    rotating.setFormatter(formatter)
    root_logger.addHandler(rotating)

    # Optionally log to file for shipping
    log_file = os.environ.get("LOG_FILE")
    if log_file:
        fh = logging.FileHandler(log_file)
        fh.setFormatter(formatter)
        root_logger.addHandler(fh)

    # Sentry logging integration (captures warnings and above)
    sentry_dsn = os.environ.get("SENTRY_DSN")
    if sentry_dsn and sentry_sdk is not None:
        sentry_logging = LoggingIntegration(
            level=logging.INFO, event_level=logging.WARNING
        )
        sentry_sdk.init(dsn=sentry_dsn, integrations=[sentry_logging])

    # optional HTTP log aggregator forwarding (best-effort; non-blocking)
    aggregator = os.environ.get("LOG_AGGREGATOR_URL")
    if aggregator:
        try:

            class AsyncHTTPHandler(logging.handlers.BufferingHandler):
                def __init__(self, url):
                    super().__init__(capacity=1000)
                    self.url = url

                def flush(self):
                    if not self.buffer:
                        return
                    # Prepare a payload
                    payload = [r.getMessage() for r in self.buffer]
                    self.buffer = []
                    try:
                        httpx.post(self.url, json={"logs": payload}, timeout=2.0)
                    except Exception:
                        pass

            http_handler = AsyncHTTPHandler(aggregator)
            http_handler.setLevel(logging.INFO)
            http_handler.setFormatter(formatter)
            root_logger.addHandler(http_handler)
        except Exception:
            pass


def get_logger(name: str = __name__):
    return logging.getLogger(name)
