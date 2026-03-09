from fastapi import APIRouter, Depends, HTTPException, Request, Body
from typing import List, Dict
from app.api.v1.dependencies import require_role
from app.core.cache import get_namespace_version, bump_namespace_version
from app.decorators.audit import audit
from app.decorators.monitor import log_and_time
from app.decorators.sanitize import sanitize_inputs

router = APIRouter(prefix="/admin/cache", tags=["admin"])


@router.get("/namespaces", response_model=List[Dict])
def list_namespaces(_admin=Depends(require_role("admin"))):
    # For now we expose known namespaces; in a real app this might be
    # discovery-based or configurable.
    namespaces = ["products", "product"]
    result = []
    for ns in namespaces:
        v = get_namespace_version(ns)
        result.append({"namespace": ns, "version": v})
    return result


@router.post("/namespaces/{namespace}/bump")
@log_and_time
@audit("cache.bump")
def bump_namespace(namespace: str, _admin=Depends(require_role("admin"))):
    v = bump_namespace_version(namespace)
    if v is None:
        # Redis not configured or some error occurred; return a clear 503 so
        # callers know this is an infrastructure problem, not a code bug.
        raise HTTPException(
            status_code=503, detail="Redis not configured or failed to bump namespace"
        )
    return {"namespace": namespace, "version": v}


@router.get("/config")
def get_config(request: Request, _admin=Depends(require_role("admin"))):
    return {
        "raptor_mini_enabled": bool(
            getattr(request.app.state, "enable_raptor_mini", False)
        )
    }


@router.post("/config")
@log_and_time
@audit("admin.config.set")
@sanitize_inputs
def set_config(
    payload: dict = Body(None),
    request: Request = None,
    _admin=Depends(require_role("admin")),
):
    # Accept payload { "raptor_mini_enabled": true/false }
    if not payload or "raptor_mini_enabled" not in payload:
        raise HTTPException(status_code=400, detail="raptor_mini_enabled is required")
    val = bool(payload.get("raptor_mini_enabled"))
    request.app.state.enable_raptor_mini = val
    return {"raptor_mini_enabled": val}
