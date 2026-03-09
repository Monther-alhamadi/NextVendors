from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from fastapi.responses import StreamingResponse
from typing import Dict, Any
from app.api.v1.dependencies import require_role
from app.core.database import SessionLocal
from app.services.importer_service import ImporterService
from app.services.task_service import TaskService
from app.services.report_service import generate_order_pdf

router = APIRouter(prefix="/admin/tools", tags=["admin"])


@router.post("/import/upload")
def upload_import_file(
    file: UploadFile = File(...), _admin=Depends(require_role("admin"))
):
    # Accept CSV or JSON uploads and import products
    ext = (file.filename or "").lower()
    db = SessionLocal()
    svc = ImporterService(db)
    try:
        if ext.endswith(".csv") or file.content_type == "text/csv":
            # save to temp file
            import tempfile

            tf = tempfile.NamedTemporaryFile(delete=False, suffix=".csv")
            try:
                content = file.file.read()
                tf.write(content)
                tf.close()
                created = svc.import_from_csv(tf.name)
            finally:
                try:
                    import os

                    os.remove(tf.name)
                except Exception:
                    pass
        elif ext.endswith(".json") or file.content_type == "application/json":
            # read as JSON list
            import json

            raw = file.file.read().decode("utf-8")
            try:
                data = json.loads(raw)
            except Exception:
                raise HTTPException(status_code=400, detail="Invalid JSON")
            created = svc.import_from_dicts(data if isinstance(data, list) else [])
        else:
            raise HTTPException(status_code=400, detail="Unsupported file type")
        return {"created": len(created)}
    finally:
        db.close()

from pydantic import BaseModel
class ImportUrlRequest(BaseModel):
    url: str
    provider: str = "aliexpress"

@router.post("/import/url")
def import_from_url(
    payload: ImportUrlRequest, 
    _admin=Depends(require_role("admin"))
):
    db = SessionLocal()
    svc = ImporterService(db)
    try:
        result = svc.import_from_url(payload.url, payload.provider)
        if isinstance(result, dict) and "status" in result and result["status"] == "error":
             raise HTTPException(status_code=400, detail=result["msg"])
        
        # If result is a Product model, return basic info
        return {"created": 1, "product": {"id": result.id, "name": result.name}}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        db.close()


@router.get("/tasks")
def list_tasks(_admin=Depends(require_role("admin"))):
    db = SessionLocal()
    try:
        ts = TaskService(db)
        tasks = ts.get_all()
        out = [
            {
                "id": t.id,
                "name": t.name,
                "status": t.status,
                "created_at": getattr(t, "created_at", None),
            }
            for t in tasks
        ]
        return out
    finally:
        db.close()


@router.post("/tasks")
def enqueue_task(payload: Dict[str, Any], _admin=Depends(require_role("admin"))):
    db = SessionLocal()
    try:
        ts = TaskService(db)
        name = payload.get("name")
        data = payload.get("payload")
        if not name:
            raise HTTPException(status_code=400, detail="name is required")
        t = ts.enqueue(name, data)
        return {"id": t.id, "status": t.status}
    finally:
        db.close()


@router.post("/tasks/{task_id}/run")
def run_task(task_id: int, _admin=Depends(require_role("admin"))):
    # Run a task synchronously using the local registry
    try:
        from backend.scripts.run_tasks import TASK_REGISTRY as REG
    except Exception:
        REG = {}
    db = SessionLocal()
    try:
        ts = TaskService(db)
        t = ts.get_by_id(task_id)
        if not t:
            raise HTTPException(status_code=404, detail="task not found")
        t = ts.run_task(t, REG)
        return {"id": t.id, "status": t.status, "result": t.result}
    finally:
        db.close()


@router.get("/orders/{order_id}/pdf")
def download_order_pdf(order_id: int, _admin=Depends(require_role("admin"))):
    db = SessionLocal()
    try:
        pdf = generate_order_pdf(db, order_id)
        if not pdf:
            raise HTTPException(status_code=404, detail="order not found")
        return StreamingResponse(
            iter([pdf]),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=order_{order_id}.pdf"
            },
        )
    finally:
        db.close()
