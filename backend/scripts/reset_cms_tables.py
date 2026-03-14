import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

import app.models # Load all models
from app.core.database import SessionLocal, engine
from app.models.cms import Page, Widget
from sqlalchemy import text

def reset_cms_tables():
    print("Dropping and recreating CMS tables...")
    try:
        # We use raw sql here to safely drop only the CMS tables so we don't wipe out users/products
        with engine.connect() as conn:
            conn.execute(text("DROP TABLE IF EXISTS cms_widgets"))
            conn.execute(text("DROP TABLE IF EXISTS cms_pages"))
            
        print("Creating tables via SQLAlchemy models to ensure correct schema...")
        Page.__table__.create(engine)
        Widget.__table__.create(engine)
        print("CMS tables recreated successfully.")
    except Exception as e:
        print(f"Failed to reset CMS tables: {e}")

if __name__ == "__main__":
    reset_cms_tables()
