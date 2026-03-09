import sqlite3
import os

db_path = os.path.join(os.getcwd(), 'dev.db')
print(f"Connecting to: {db_path}")

try:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # 1. Update VendorPlan table
    try:
        cursor.execute('ALTER TABLE vendor_plans ADD COLUMN max_coupons INTEGER DEFAULT 0;')
        print('Added max_coupons to vendor_plans')
    except Exception as e:
        print('max_coupons:', e)

    try:
        cursor.execute('ALTER TABLE vendor_plans ADD COLUMN allow_whatsapp_checkout BOOLEAN DEFAULT 0;')
        print('Added allow_whatsapp_checkout to vendor_plans')
    except Exception as e:
        print('allow_whatsapp_checkout:', e)

    # 2. Update Suppliers table
    try:
        cursor.execute('ALTER TABLE suppliers ADD COLUMN override_limits JSON NULL;')
        print('Added override_limits to suppliers')
    except Exception as e:
        print('override_limits:', e)

    # 3. Create Advertisements table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS advertisements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        vendor_id INTEGER,
        image_url VARCHAR(500) NOT NULL,
        target_url VARCHAR(500),
        placement VARCHAR(50) DEFAULT 'homepage_hero',
        status VARCHAR(50) DEFAULT 'pending',
        start_date DATETIME,
        end_date DATETIME,
        cost FLOAT DEFAULT 0.0,
        is_paid BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(vendor_id) REFERENCES suppliers(id)
    );
    ''')
    print('Created advertisements table')

    conn.commit()
    conn.close()
    print('SQL Schema updated successfully.')
except Exception as e:
    print(f"Error connecting or executing: {e}")
