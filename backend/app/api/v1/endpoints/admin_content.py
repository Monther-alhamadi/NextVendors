from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import Column, Integer, String, Boolean, DateTime, JSON, Float
from typing import List, Dict, Any, Optional
from datetime import datetime
from app.core.database import get_db, Base
from app.models.banner import Banner
from app.api.v1.dependencies import require_role
from app.decorators.audit import audit

# ─────────────────────────────────────────────────────────────────────────────
# Models (defined inline; could be moved to app/models/ if they grow large)
# ─────────────────────────────────────────────────────────────────────────────

class LegacyWidget(Base):
    """
    Dynamic UI Widget managed by the Admin.
    Controls what sections appear on which pages and in what order.
    The frontend reads /public/page-layout/{page} and renders sections accordingly.
    """
    __tablename__ = "cms_widgets_legacy"

    id         = Column(Integer, primary_key=True, index=True)
    type       = Column(String, nullable=False)   # "banner_carousel", "categories_bar",
                                                   # "flash_sale", "product_grid", "ad",
                                                   # "custom_html", "text_block"
    title      = Column(String, nullable=True)
    content    = Column(JSON, nullable=True)       # flexible payload per type
    page       = Column(String, default="home")    # "home", "products", "all"
    position   = Column(Integer, default=0)        # ordering index (lower = shown first)
    is_active  = Column(Boolean, default=True)     # admin toggle: show/hide
    device     = Column(String, default="all")     # "all", "mobile", "desktop"
    start_at   = Column(DateTime, nullable=True)   # scheduled display start
    end_at     = Column(DateTime, nullable=True)   # scheduled display end
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class AdPlacement(Base):
    """
    Advertisement placements managed by the Admin.
    Supports image ads, HTML ads, and external ad scripts keyed by zone.
    """
    __tablename__ = "cms_ads"

    id         = Column(Integer, primary_key=True, index=True)
    zone       = Column(String, nullable=False)    # "homepage_top", "product_list",
                                                    # "sidebar", "checkout_bottom"
    title      = Column(String, nullable=True)
    content    = Column(JSON, nullable=True)        # {type: "image", url, link} or
                                                    # {type: "html", code}
    is_active  = Column(Boolean, default=True)
    start_at   = Column(DateTime, nullable=True)
    end_at     = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class ThemeSetting(Base):
    """
    Key-value store for theme / branding settings.
    Examples: primary_color, store_name, store_logo, hero_enabled, etc.
    """
    __tablename__ = "cms_theme_settings"

    id    = Column(Integer, primary_key=True, index=True)
    key   = Column(String, unique=True, nullable=False)
    value = Column(String, nullable=True)


# ─────────────────────────────────────────────────────────────────────────────
# Router
# ─────────────────────────────────────────────────────────────────────────────

router = APIRouter(tags=["cms"])

# ══════════════════════════════════════════════════════════════════════════════
# PUBLIC ENDPOINTS  (no authentication required — for the storefront)
# ══════════════════════════════════════════════════════════════════════════════

@router.get("/public/page-layout/{page}")
def get_page_layout(page: str, db: Session = Depends(get_db)):
    """
    Return the ordered list of active widgets for a given page.
    The frontend renders sections based on this list.
    Skips widgets whose scheduled window has expired.
    """
    now = datetime.utcnow()
    widgets = (
        db.query(LegacyWidget)
        .filter(
            LegacyWidget.page.in_([page, "all"]),
            LegacyWidget.is_active == True,
        )
        .order_by(LegacyWidget.position)
        .all()
    )

    result = []
    for w in widgets:
        # Respect scheduling
        if w.start_at and now < w.start_at:
            continue
        if w.end_at and now > w.end_at:
            continue
        result.append({
            "id":       w.id,
            "type":     w.type,
            "title":    w.title,
            "content":  w.content,
            "position": w.position,
            "device":   w.device,
        })
    return result


@router.get("/public/widgets")
def get_public_widgets(db: Session = Depends(get_db)):
    """Alias for homepage widgets (backwards-compatible with governanceService.js)."""
    return get_page_layout("home", db)

@router.get("/public/vendor-ads")
def get_public_vendor_ads(db: Session = Depends(get_db)):
    """Return all active and paid vendor advertisements designed for the homepage."""
    from app.services.ad_service import AdService
    ad_service = AdService(db)
    ads = ad_service.get_public_active_ads()
    result = []
    for ad in ads:
        result.append({
            "id": ad.id,
            "vendor_id": ad.vendor_id,
            "image_url": ad.image_url,
            "target_url": ad.target_url,
            "placement": ad.placement
        })
    return result


@router.get("/public/ads/{zone}")
def get_ads_for_zone(zone: str, db: Session = Depends(get_db)):
    """Return active ads for a specific placement zone."""
    now = datetime.utcnow()
    ads = db.query(AdPlacement).filter(
        AdPlacement.zone == zone,
        AdPlacement.is_active == True
    ).all()

    return [
        ad for ad in ads
        if (ad.start_at is None or now >= ad.start_at)
        and (ad.end_at is None or now <= ad.end_at)
    ]


@router.get("/public/theme")
def get_public_theme(db: Session = Depends(get_db)):
    """Return all theme settings as a flat key-value dict for the storefront."""
    settings = db.query(ThemeSetting).all()
    return {s.key: s.value for s in settings}


@router.get("/public/banners")
def get_public_banners(db: Session = Depends(get_db)):
    """Return all active banners ordered by position."""
    return db.query(Banner).filter(
        getattr(Banner, "is_active", True) == True
    ).order_by(Banner.position).all()


# ══════════════════════════════════════════════════════════════════════════════
# ADMIN — BANNERS
# ══════════════════════════════════════════════════════════════════════════════

@router.get("/admin/content/banners")
def list_banners(db: Session = Depends(get_db), _admin=Depends(require_role("admin"))):
    return db.query(Banner).order_by(Banner.position).all()


@router.post("/admin/content/banners")
@audit("admin.banner.create")
def create_banner(
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
    _admin=Depends(require_role("admin"))
):
    banner = Banner(**payload)
    db.add(banner)
    db.commit()
    db.refresh(banner)
    return banner


@router.put("/admin/content/banners/{banner_id}")
@audit("admin.banner.update")
def update_banner(
    banner_id: int,
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
    _admin=Depends(require_role("admin"))
):
    banner = db.query(Banner).filter(Banner.id == banner_id).first()
    if not banner:
        raise HTTPException(status_code=404, detail="Banner not found")
    for k, v in payload.items():
        setattr(banner, k, v)
    db.commit()
    db.refresh(banner)
    return banner


@router.delete("/admin/content/banners/{banner_id}")
@audit("admin.banner.delete")
def delete_banner(
    banner_id: int,
    db: Session = Depends(get_db),
    _admin=Depends(require_role("admin"))
):
    banner = db.query(Banner).filter(Banner.id == banner_id).first()
    if not banner:
        raise HTTPException(status_code=404, detail="Banner not found")
    db.delete(banner)
    db.commit()
    return {"status": "ok"}


# ══════════════════════════════════════════════════════════════════════════════
# ADMIN — WIDGETS (page layout control)
# ══════════════════════════════════════════════════════════════════════════════

@router.get("/admin/widgets")
def list_widgets(
    page: Optional[str] = None,
    db: Session = Depends(get_db),
    _admin=Depends(require_role("admin"))
):
    """List all widgets, optionally filtered by page."""
    q = db.query(LegacyWidget)
    if page:
        q = q.filter(LegacyWidget.page == page)
    return q.order_by(LegacyWidget.position).all()


@router.post("/admin/widgets")
@audit("admin.widget.create")
def create_widget(
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
    _admin=Depends(require_role("admin"))
):
    widget = LegacyWidget(**{k: v for k, v in payload.items() if hasattr(LegacyWidget, k)})
    db.add(widget)
    db.commit()
    db.refresh(widget)
    return widget


@router.put("/admin/widgets/{widget_id}")
@audit("admin.widget.update")
def update_widget(
    widget_id: int,
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
    _admin=Depends(require_role("admin"))
):
    widget = db.query(LegacyWidget).filter(LegacyWidget.id == widget_id).first()
    if not widget:
        raise HTTPException(status_code=404, detail="Widget not found")
    payload.pop("id", None)
    payload["updated_at"] = datetime.utcnow()
    for k, v in payload.items():
        if hasattr(widget, k):
            setattr(widget, k, v)
    db.commit()
    db.refresh(widget)
    return widget


@router.put("/admin/widgets/reorder")
@audit("admin.widget.reorder")
def reorder_widgets(
    order: List[Dict[str, int]],   # [{id: 1, position: 0}, {id: 2, position: 1}]
    db: Session = Depends(get_db),
    _admin=Depends(require_role("admin"))
):
    """Batch-update widget positions (used for Drag & Drop in admin panel)."""
    for item in order:
        widget = db.query(LegacyWidget).filter(LegacyWidget.id == item["id"]).first()
        if widget:
            widget.position = item["position"]
    db.commit()
    return {"status": "ok", "updated": len(order)}


@router.delete("/admin/widgets/{widget_id}")
@audit("admin.widget.delete")
def delete_widget(
    widget_id: int,
    db: Session = Depends(get_db),
    _admin=Depends(require_role("admin"))
):
    widget = db.query(LegacyWidget).filter(LegacyWidget.id == widget_id).first()
    if not widget:
        raise HTTPException(status_code=404, detail="Widget not found")
    db.delete(widget)
    db.commit()
    return {"status": "ok"}


# ══════════════════════════════════════════════════════════════════════════════
# ADMIN — ADS
# ══════════════════════════════════════════════════════════════════════════════

@router.get("/admin/ads")
def list_ads(db: Session = Depends(get_db), _admin=Depends(require_role("admin"))):
    return db.query(AdPlacement).order_by(AdPlacement.zone).all()


@router.post("/admin/ads")
@audit("admin.ad.create")
def create_ad(
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
    _admin=Depends(require_role("admin"))
):
    ad = AdPlacement(**{k: v for k, v in payload.items() if hasattr(AdPlacement, k)})
    db.add(ad)
    db.commit()
    db.refresh(ad)
    return ad


@router.put("/admin/ads/{ad_id}")
@audit("admin.ad.update")
def update_ad(
    ad_id: int,
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
    _admin=Depends(require_role("admin"))
):
    ad = db.query(AdPlacement).filter(AdPlacement.id == ad_id).first()
    if not ad:
        raise HTTPException(status_code=404, detail="Ad not found")
    payload.pop("id", None)
    for k, v in payload.items():
        if hasattr(ad, k):
            setattr(ad, k, v)
    db.commit()
    db.refresh(ad)
    return ad


@router.delete("/admin/ads/{ad_id}")
@audit("admin.ad.delete")
def delete_ad(
    ad_id: int,
    db: Session = Depends(get_db),
    _admin=Depends(require_role("admin"))
):
    ad = db.query(AdPlacement).filter(AdPlacement.id == ad_id).first()
    if not ad:
        raise HTTPException(status_code=404, detail="Ad not found")
    db.delete(ad)
    db.commit()
    return {"status": "ok"}


# ══════════════════════════════════════════════════════════════════════════════
# ADMIN — THEME SETTINGS
# ══════════════════════════════════════════════════════════════════════════════

@router.get("/admin/theme")
def get_theme(db: Session = Depends(get_db), _admin=Depends(require_role("admin"))):
    """Return all theme settings as key-value pairs."""
    settings = db.query(ThemeSetting).all()
    return {s.key: s.value for s in settings}


@router.put("/admin/theme")
@audit("admin.theme.update")
def update_theme(
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
    _admin=Depends(require_role("admin"))
):
    """
    Update one or more theme settings.
    Accepts a flat dict: {"primary_color": "#4F46E5", "store_name": "متجري"}.
    Creates keys that don't exist yet (upsert).
    """
    for key, value in payload.items():
        setting = db.query(ThemeSetting).filter(ThemeSetting.key == key).first()
        if setting:
            setting.value = str(value)
        else:
            db.add(ThemeSetting(key=key, value=str(value)))
    db.commit()
    return {"status": "ok", "updated_keys": list(payload.keys())}
