import codecs

filepath = r"c:\Users\hp\Desktop\projet2\ecommerce-store\frontend\src\pages\VendorOrders.jsx"

with codecs.open(filepath, 'r', 'utf-8') as f:
    content = f.read()

replacements = [
    # Top level
    ("نظام إدارة الطلبات من التجهيز إلى الشحن.", "{t('vendor.orders_subtitle', 'نظام إدارة الطلبات من التجهيز إلى الشحن.')}"),
    
    # Status Config
    ("label: 'قيد الانتظار'", "label: t('orders.status_pending', 'قيد الانتظار')"),
    ("label: 'قيد التجهيز'", "label: t('orders.status_processing', 'قيد التجهيز')"),
    ("label: 'تم الشحن'", "label: t('orders.status_shipped', 'تم الشحن')"),
    ("label: 'مكتمل'", "label: t('orders.status_completed', 'مكتمل')"),
    
    # Customer Details
    ("|| 'عميل'", "|| t('orders.customer_fallback', 'عميل')"),
    ("|| 'غير محدد'", "|| t('orders.city_unspecified', 'غير محدد')"),
    
    # Card Actions Strings
    ("? '...' : 'تجهيز الطلب'", "? '...' : t('orders.action_start_processing', 'تجهيز الطلب')"),
    ("? '...' : 'شحن'", "? '...' : t('orders.action_ship', 'شحن')"),
    ("? '...' : 'اكتمال'", "? '...' : t('orders.action_complete', 'اكتمال')"),
    ("✅ متوفر لدى العميل", "✅ {t('orders.status_delivered_customer', 'متوفر لدى العميل')}"),
    
    # Kanban Board UI
    ("> لوحة كانبان", "> {t('orders.kanban_view', 'لوحة كانبان')}"),
    ("> القائمة", "> {t('orders.list_view', 'القائمة')}"),
    ("لا يوجد طلبات هنا", "{t('orders.no_orders_col', 'لا يوجد طلبات هنا')}"),
    
    # Table Headings
    ("<th>رقم الطلب</th>", "<th>{t('orders.col_order_num', 'رقم الطلب')}</th>"),
    ("<th>التاريخ</th>", "<th>{t('orders.col_date', 'التاريخ')}</th>"),
    ("<th>العميل</th>", "<th>{t('orders.col_customer', 'العميل')}</th>"),
    ("<th>المنتجات</th>", "<th>{t('orders.col_items', 'المنتجات')}</th>"),
    ("<th>الحالة</th>", "<th>{t('orders.col_status', 'الحالة')}</th>"),
    ("<th>إجراءات</th>", "<th>{t('orders.col_actions', 'إجراءات')}</th>"),
    
    # Table List Actions
    (">تجهيز</button>", ">{t('orders.action_start_processing_short', 'تجهيز')}</button>"),
    (">شحن</button>", ">{t('orders.action_ship_short', 'شحن')}</button>"),
    (">مكتمل</button>", ">{t('orders.action_complete_short', 'مكتمل')}</button>"),
    
    # Prompts
    ("prompt('أدخل رقم التتبع (اختياري)');", "prompt(t('orders.prompt_tracking', 'أدخل رقم التتبع (اختياري)'));"),
]

for old, new in replacements:
    if old not in content:
        print(f"Warning: Could not find '{old}'")
    content = content.replace(old, new)

with codecs.open(filepath, 'w', 'utf-8') as f:
    f.write(content)

import re
ar_regex = re.compile(r'[\u0600-\u06FF]+')
t_pattern = re.compile(r"""t\(.*\)""")

count = 0
for i, line in enumerate(content.split('\n')):
    if line.strip().startswith('//') or line.strip().startswith('import '):
        continue
    if ar_regex.search(line) and not t_pattern.search(line):
        print(f"Line {i+1}: {line.strip()}")
        count += 1
print(f"Total untranslated strings in VendorOrders.jsx: {count}")
