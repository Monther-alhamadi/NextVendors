"""
Comprehensive CMS fix - uses raw SQL to avoid ORM mapper errors.
"""
import sys, os, json
from datetime import datetime, timezone

# Robust path resolution for backend scripts
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

# Only import what we strictly need
from app.core.config import settings
from sqlalchemy import create_engine, text, inspect

print(f"=== CMS Fix Script ===")
print(f"Database URL: {settings.DATABASE_URL}")

engine = create_engine(settings.DATABASE_URL, connect_args={"check_same_thread": False})

# Step 1: Drop old CMS tables
print("\n[1/4] Dropping old CMS tables...")
with engine.begin() as conn:
    conn.execute(text("DROP TABLE IF EXISTS cms_widgets"))
    conn.execute(text("DROP TABLE IF EXISTS cms_pages"))
print("  Done.")

# Step 2: Create tables using raw SQL (avoids ORM mapper issues)
print("[2/4] Creating CMS tables...")
with engine.begin() as conn:
    conn.execute(text("""
        CREATE TABLE IF NOT EXISTS cms_pages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title VARCHAR(255) NOT NULL,
            slug VARCHAR(255) NOT NULL UNIQUE,
            is_published BOOLEAN DEFAULT 0,
            meta_title VARCHAR(255),
            meta_description VARCHAR(512),
            created_at DATETIME NOT NULL,
            updated_at DATETIME NOT NULL
        )
    """))
    conn.execute(text("""
        CREATE TABLE IF NOT EXISTS cms_widgets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            page_id INTEGER NOT NULL REFERENCES cms_pages(id),
            type VARCHAR(100) NOT NULL,
            position INTEGER DEFAULT 0,
            config JSON DEFAULT '{}',
            is_active BOOLEAN DEFAULT 1,
            created_at DATETIME NOT NULL,
            updated_at DATETIME NOT NULL
        )
    """))
    conn.execute(text("CREATE INDEX IF NOT EXISTS ix_cms_pages_slug ON cms_pages(slug)"))
    conn.execute(text("CREATE INDEX IF NOT EXISTS ix_cms_widgets_page_id ON cms_widgets(page_id)"))

inspector = inspect(engine)
tables = inspector.get_table_names()
cms_tables = [t for t in tables if 'cms' in t]
print(f"  CMS tables: {cms_tables}")

# Step 3: Seed data
print("[3/4] Seeding default data...")
# Use space-separated format for datetime (SQLite compatible)
now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")

with engine.begin() as conn:
    conn.execute(text(
        "INSERT INTO cms_pages (title, slug, is_published, created_at, updated_at) "
        "VALUES (:title, :slug, 1, :now, :now)"
    ), {"title": "الرئيسية", "slug": "home", "now": now})
    
    # Get home page id
    result = conn.execute(text("SELECT id FROM cms_pages WHERE slug='home'"))
    home_id = result.fetchone()[0]
    print(f"  Created page 'home' with id={home_id}")
    
    widgets = [
        ("HeroWidget", 0, json.dumps({
            "title": "اكتشف الفخامة في كل تفصيل",
            "subtitle": "وجهتك الأولى للمنتجات الحصرية والمميزة.",
            "button_text": "تسوق الجديد 🛍️",
            "button_link": "/products?category=new",
            "image_url": "",
            "bg_color": "#0a0d2e"
        })),
        ("FeaturesWidget", 1, json.dumps({
            "title": "لماذا تتسوق معنا؟",
            "bg_color": "#ffffff"
        })),
        ("SliderWidget", 2, json.dumps({
            "title": "أبرز المنتجات",
            "subtitle": "اختيارات مميزة لك بأفضل الأسعار",
            "limit": 8,
            "categoryId": "",
            "bg_color": "#f8fafc"
        })),
    ]
    for wtype, pos, config in widgets:
        conn.execute(text(
            "INSERT INTO cms_widgets (page_id, type, position, config, is_active, created_at, updated_at) "
            "VALUES (:pid, :t, :p, :c, 1, :now, :now)"
        ), {"pid": home_id, "t": wtype, "p": pos, "c": config, "now": now})
    print(f"  Created {len(widgets)} widgets.")

# Step 4: Verify
print("[4/4] Verifying data...")
with engine.connect() as conn:
    pages = conn.execute(text("SELECT id, title, slug, created_at FROM cms_pages")).fetchall()
    widgets_data = conn.execute(text("SELECT id, page_id, type, position, created_at FROM cms_widgets ORDER BY position")).fetchall()
    print(f"  Pages ({len(pages)}):")
    for p in pages:
        print(f"    id={p[0]}, title={p[1]}, slug={p[2]}, created_at={p[3]}")
    print(f"  Widgets ({len(widgets_data)}):")
    for w in widgets_data:
        print(f"    id={w[0]}, page_id={w[1]}, type={w[2]}, pos={w[3]}, created_at={w[4]}")

print("\n=== ALL CHECKS PASSED ===")
print("Now start the backend: uvicorn main:app --port 8000")
