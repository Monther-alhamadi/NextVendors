from fastapi import APIRouter, Request

router = APIRouter(prefix="", tags=["config"])


@router.get("/api/v1/config")
def public_config(request: Request):
    """Public config endpoint returned to clients; exposes feature flags.

    This endpoint intentionally does not require authentication and provides
    lightweight runtime build options such as 'raptor_mini_enabled' to
    help client UIs render feature previews that are centrally controlled.
    """
    return {
        "raptor_mini_enabled": bool(
            getattr(request.app.state, "enable_raptor_mini", False)
        )
    }
