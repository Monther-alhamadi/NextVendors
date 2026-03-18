import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal
from app.models.system_setting import SystemSetting

def seed_initial_data():
    print("Starting data seeding process...")
    db = SessionLocal()
    try:
        # Seed public config constants if they don't exist
        default_settings = {
            "site_name": "NextVendors",
            "support_email": "support@nextvendors.com",
            "contact_phone": "+1 234 567 890",
            "currency_symbol": "$",
            "allow_registrations": "true",
            "enable_vendor_applications": "true",
            "default_tax_rate": "0.0",
        }

        for key, value in default_settings.items():
            exists = db.query(SystemSetting).filter(SystemSetting.key == key).first()
            if not exists:
                setting = SystemSetting(
                    key=key,
                    value=value,
                    data_type="string" if value not in ["true", "false"] else "bool"
                )
                db.add(setting)
                print(f"Added default setting: {key}")
            else:
                print(f"Setting already exists, skipping: {key}")

        db.commit()
        print("Data seeding completed successfully.")

    except Exception as e:
        print(f"Error during data seeding: {e}")
        db.rollback()
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    seed_initial_data()
