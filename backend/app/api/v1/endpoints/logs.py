from datetime import datetime, timezone
from collections import deque
from threading import Lock

from fastapi import APIRouter, Body, Depends, Query
from typing import Optional
from app.api.v1.dependencies import require_role_optional, require_role
from app.core.logging_config import get_logger
from app.core.config import settings
import httpx

router = APIRouter()

logger = get_logger("frontend_logger")

# In-memory storage for frontend logs (limited size deque). For production,
# use a log aggregator / external store. Thread-safe with Lock.
LOGS: deque = deque(maxlen=200)
LOGS_LOCK = Lock()


@router.post("/logs")
def receive_logs(payload: dict = Body(...), _user=Depends(require_role_optional())):
    """Receive logs from the frontend for aggregation. This accepts a JSON payload and logs it centrally.

    The endpoint is open while implementing and relies on a require_role_optional dependency which returns None for unauthenticated users.
    """
    level = (payload.get("level") or "info").lower()
    message = payload.get("message") or payload
    source = payload.get("source")
    # Build stored log entry
    entry = {
        "received_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "level": level,
        "message": message,
        "payload": payload,
        "source": source,
        "user_id": getattr(_user, "id", None) if _user else None,
    }
    if level == "error":
        logger.error(message)
    elif level == "warning":
        logger.warning(message)
    else:
        logger.info(message)

    # Store the log in the in-memory deque
    try:
        with LOGS_LOCK:
            LOGS.append(entry)
    except Exception:
        # if memory store fails, continue gracefully
        logger.exception("Failed to append log to in-memory store")
    return {"ok": True}

    # Optionally forward to an aggregator
    if settings.LOG_AGGREGATOR_URL:
        try:
            httpx.post(
                settings.LOG_AGGREGATOR_URL, json={"payload": payload}, timeout=2.0
            )
        except Exception:
            pass
    return {"ok": True}


@router.get("/admin/logs/recent")
def get_recent_logs(
    # allow clients to request more than the deque length; server will cap by LOGS maxlen
    limit: int = Query(100, ge=1),
    level: Optional[str] = Query(None),
    q: Optional[str] = Query(None),
    _admin=Depends(require_role("admin")),
):
    """Return recent frontend logs stored in memory.

    This endpoint is only for admin use and supports filtering by `level`
    and a `q` query string that searches the message text.
    """
    with LOGS_LOCK:
        items = list(LOGS)

    # filter by level
    if level:
        level_l = level.lower()
        items = [i for i in items if (i.get("level") or "").lower() == level_l]

    # filter by query substring in message or payload
    if q:
        q_l = q.lower()

        def matches(i):
            msg = i.get("message")
            if msg and q_l in str(msg).lower():
                return True
            # check payload JSON string
            payload = i.get("payload")
            try:
                if payload and q_l in str(payload).lower():
                    return True
            except Exception:
                pass
            return False

        items = [i for i in items if matches(i)]

    # Return most recent first
    items = list(reversed(items))
    return items[:limit]
