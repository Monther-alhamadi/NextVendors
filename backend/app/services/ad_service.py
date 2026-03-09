from sqlalchemy.orm import Session
from app.models.advertisement import Advertisement
from datetime import datetime

class AdService:
    def __init__(self, db: Session):
        self.db = db

    def create_vendor_ad_request(self, vendor_id: int, ad_data: dict) -> Advertisement:
        ad = Advertisement(
            vendor_id=vendor_id,
            image_url=ad_data.get('image_url'),
            target_url=ad_data.get('target_url'),
            placement=ad_data.get('placement', 'homepage_hero'),
            status="pending",
            cost=ad_data.get('cost', 0.0)
        )
        self.db.add(ad)
        self.db.commit()
        self.db.refresh(ad)
        return ad

    def get_public_active_ads(self):
        now = datetime.utcnow()
        # Active and paid ads optionally within date ranges if set, otherwise just active and paid
        query = self.db.query(Advertisement).filter(
            Advertisement.status == 'active',
            Advertisement.is_paid == True
        )
        return query.all()

    def get_all_admin_ads(self):
        return self.db.query(Advertisement).order_by(Advertisement.created_at.desc()).all()

    def update_ad_status(self, ad_id: int, status: str, is_paid: bool = None) -> Advertisement:
        ad = self.db.query(Advertisement).filter(Advertisement.id == ad_id).first()
        if ad:
            ad.status = status
            if is_paid is not None:
                ad.is_paid = is_paid
            self.db.commit()
            self.db.refresh(ad)
        return ad
