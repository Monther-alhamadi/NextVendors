import sys
import os
import json
from datetime import datetime, timezone

sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.core.database import SessionLocal
from sqlalchemy import text

def seed():
    db = SessionLocal()
    now = datetime.now(timezone.utc)
    try:
        # Check if home page exists
        home_res = db.execute(text("SELECT id FROM cms_pages WHERE slug = 'home'")).fetchone()
        if not home_res:
            db.execute(
                text("INSERT INTO cms_pages (title, slug, is_published, created_at, updated_at) VALUES ('الرئيسية', 'home', 1, :now, :now)"),
                {"now": now}
            )
            db.commit()
            home_res = db.execute(text("SELECT id FROM cms_pages WHERE slug = 'home'")).fetchone()
        
        home_id = home_res[0]
        
        # Check if widgets exist
        widget_count = db.execute(text(f"SELECT COUNT(*) FROM cms_widgets WHERE page_id = {home_id}")).scalar()
        if widget_count == 0:
            print("Seeding default widgets...")
            
            hero_config = json.dumps({
                "title": "اكتشف الفخامة في كل تفصيل",
                "subtitle": "وجهتك الأولى للمنتجات الحصرية والمميزة. تسوق أحدث الصيحات العالمية بجودة لا تُضاهى وتوصيل يصل إليك في أسرع وقت.",
                "button_text": "تسوق الجديد 🛍️",
                "button_link": "/products?category=new",
                "image_url": "",
                "bg_color": "#0a0d2e"
            })
            features_config = json.dumps({
                "title": "لماذا تتسوق معنا؟",
                "bg_color": "#ffffff"
            })
            slider_config = json.dumps({
                "title": "أبرز المنتجات",
                "subtitle": "اختيارات مميزة لك بأفضل الأسعار",
                "limit": 8,
                "categoryId": "",
                "bg_color": "#f8fafc"
            })
            
            db.execute(text("INSERT INTO cms_widgets (page_id, type, position, config, is_active, created_at, updated_at) VALUES (:pid, 'HeroWidget', 0, :c1, 1, :now, :now)"), {"pid": home_id, "c1": hero_config, "now": now})
            db.execute(text("INSERT INTO cms_widgets (page_id, type, position, config, is_active, created_at, updated_at) VALUES (:pid, 'FeaturesWidget', 1, :c2, 1, :now, :now)"), {"pid": home_id, "c2": features_config, "now": now})
            db.execute(text("INSERT INTO cms_widgets (page_id, type, position, config, is_active, created_at, updated_at) VALUES (:pid, 'SliderWidget', 2, :c3, 1, :now, :now)"), {"pid": home_id, "c3": slider_config, "now": now})
            db.commit()
            print("Default widgets seeded successfully.")
        else:
            print("Widgets already exist.")
            
    except Exception as e:
        print(f"Error seeding CMS: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed()
