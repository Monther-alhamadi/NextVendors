from slowapi import Limiter
from slowapi.util import get_remote_address
from app.core.config import settings
import importlib

# Create a limiter in an import-safe way. Tests/dev often don't have Redis
# available, and the limits library will raise if the Redis storage backend
# is requested but the `redis` package is not installed. Prefer an in-memory
# fallback for local tests.
try:
    importlib.import_module("redis")
    _redis_available = True
except Exception:
    _redis_available = False

if settings.REDIS_URL and _redis_available:
    limiter = Limiter(key_func=get_remote_address, storage_uri=settings.REDIS_URL)
else:
    limiter = Limiter(key_func=get_remote_address, storage_uri="memory://")
