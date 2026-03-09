import sys
import os

# Setup sys.path to allow importing app modules
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.core.database import Base, engine
import app.models  # This imports __init__.py which calls all _try_import

# In some cases models might need the app initialized to register properly
try:
    from main import app as main_app
except ImportError:
    pass

def init_cms_db():
    print("Ensuring all tables are created...")
    # Base.metadata.create_all(bind=engine) will create any tables that don't exist yet
    Base.metadata.create_all(bind=engine)
    print("Database tables synchronized.")

if __name__ == "__main__":
    init_cms_db()
