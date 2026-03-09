import json
from typing import Optional
from app.core.config import settings

# Singleton connection pool — avoids creating a new TCP connection per cache call.
_redis_client = None


def _get_redis():
    global _redis_client
    if _redis_client is not None:
        return _redis_client
    if not settings.REDIS_URL:
        return None
    try:
        import redis
    except Exception:
        return None
    try:
        pool = redis.ConnectionPool.from_url(
            settings.REDIS_URL,
            max_connections=settings.REDIS_MAX_CONNECTIONS,
            decode_responses=False,
        )
        _redis_client = redis.Redis(connection_pool=pool)
        # Verify connectivity (non-fatal)
        _redis_client.ping()
        return _redis_client
    except Exception:
        _redis_client = None
        return None


def get_cache(key: str) -> Optional[str]:
    r = _get_redis()
    if not r:
        return None
    value = r.get(key)
    return value.decode("utf-8") if value else None


def set_cache(key: str, value, ttl: int = 60):
    r = _get_redis()
    if not r:
        return
    if not isinstance(value, str):
        # Use a permissive serializer: convert non-serializable objects to str()
        value = json.dumps(value, default=str)
    r.set(key, value, ex=ttl)


# Namespaced cache helpers — use a version stored in Redis to implement fast
# namespace invalidation without scanning keyspace. Keys are composed like
# => "{namespace}:{version}:{key}" — bumping the namespace version invalidates
# all previous keys atomically using `INCR` on `cache_version:{namespace}`.


def _namespace_key(namespace: str, key: str) -> str:
    version = get_namespace_version(namespace)
    return f"{namespace}:{version}:{key}"


def get_namespace_version(namespace: str) -> int:
    r = _get_redis()
    if not r:
        return 1
    v = r.get(f"cache_version:{namespace}")
    try:
        if not v:
            # initialize
            r.set(f"cache_version:{namespace}", "1")
            return 1
        if isinstance(v, bytes):
            v = v.decode("utf-8")
        return int(v)
    except Exception:
        return 1


def bump_namespace_version(namespace: str):
    r = _get_redis()
    if not r:
        return
    try:
        # atomic increment; if not present this sets to 0 then increments
        # depending on the redis library, incr returns the new value
        return r.incr(f"cache_version:{namespace}")
    except Exception:
        try:
            # fallback: read-parse-increment
            v = r.get(f"cache_version:{namespace}")
            if not v:
                r.set(f"cache_version:{namespace}", "2")
                return 2
            vv = int(v) + 1
            r.set(f"cache_version:{namespace}", str(vv))
            return vv
        except Exception:
            return None


def get_cache_ns(namespace: str, key: str) -> Optional[str]:
    # convenience wrapper that composes the namespaced key
    return get_cache(_namespace_key(namespace, key))


def set_cache_ns(namespace: str, key: str, value, ttl: int = 60):
    return set_cache(_namespace_key(namespace, key), value, ttl=ttl)


def delete_cache_ns(namespace: str, key: str):
    return delete_cache(_namespace_key(namespace, key))


def delete_cache(key: str):
    r = _get_redis()
    if not r:
        return
    try:
        r.delete(key)
    except Exception:
        # ignore errors
        pass


def delete_cache_pattern(pattern: str):
    r = _get_redis()
    if not r:
        return
    try:
        # keys may not be suitable for production on large keyspaces, but fine for demo
        keys = r.keys(pattern)
        if not keys:
            return
        r.delete(*keys)
    except Exception:
        try:
            # some redis clients return bytes keys
            keys = [
                k.decode("utf-8") if isinstance(k, bytes) else k
                for k in r.keys(pattern)
            ]
            if keys:
                r.delete(*keys)
        except Exception:
            pass
