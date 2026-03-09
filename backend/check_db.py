import sqlite3
import os

dbs = [
    'c:/Users/hp/Desktop/projet2/ecommerce-store/dev.db',
    'c:/Users/hp/Desktop/projet2/ecommerce-store/backend/app.db',
    'c:/Users/hp/Desktop/projet2/ecommerce-store/app.db'
]

for db in dbs:
    db_path = os.path.normpath(db)
    if not os.path.exists(db_path):
        continue
    try:
        print(f'\n--- {db_path} ---')
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = [r[0] for r in cursor.fetchall()]
        print('Target Tables Found:', [t for t in tables if t in ('suppliers', 'vendor_plans')])
        print('All Tables:', tables)
        conn.close()
    except Exception as e:
        print('Error:', e)
