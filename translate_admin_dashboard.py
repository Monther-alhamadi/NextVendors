import codecs

filepath = r"c:\Users\hp\Desktop\projet2\ecommerce-store\frontend\src\pages\AdminDashboard.jsx"

with codecs.open(filepath, 'r', 'utf-8') as f:
    content = f.read()

replacements = [
    # PERIOD_OPTIONS
    ('label: "يومي"', 'label: t("dashboard.period_daily", "يومي")'),
    ('label: "أسبوعي"', 'label: t("dashboard.period_weekly", "أسبوعي")'),
    ('label: "شهري"', 'label: t("dashboard.period_monthly", "شهري")'),
    ('label: "سنوي"', 'label: t("dashboard.period_yearly", "سنوي")'),
    
    # KPI Cards Text
    (">مقارنة بالفترة السابقة</div>", ">{t('dashboard.compare_prev_period', 'مقارنة بالفترة السابقة')}</div>"),
    
    # Time Ago logic
    ('return "الآن";', 'return t("dashboard.time_now", "الآن");'),
    ('return `منذ ${mins} دقيقة`;', 'return t("dashboard.time_mins_ago", "منذ {{count}} دقيقة", { count: mins });'),
    ('return `منذ ${hours} ساعة`;', 'return t("dashboard.time_hours_ago", "منذ {{count}} ساعة", { count: hours });'),
    ('return `منذ ${days} يوم`;', 'return t("dashboard.time_days_ago", "منذ {{count}} يوم", { count: days });'),
    
    # Header
    (">نظرة عامة على أداء المنصة ومؤشرات النمو</p>", ">{t('admin.dashboard_subtitle', 'نظرة عامة على أداء المنصة ومؤشرات النمو')}</p>"),
    ("> تحديث</button>", ">{t('common.refresh', 'تحديث')}</button>"),
    
    # KPI Grid calls
    ('title="إجمالي المبيعات (GMV)"', 'title={t("dashboard.kpi_gmv", "إجمالي المبيعات (GMV)")}'),
    ('title="أرباح المنصة"', 'title={t("dashboard.kpi_profit", "أرباح المنصة")}'),
    ('title="الطلبات"', 'title={t("dashboard.kpi_orders", "الطلبات")}'),
    ('title="متوسط قيمة الطلب"', 'title={t("dashboard.kpi_avg_order", "متوسط قيمة الطلب")}'),
    
    # Revenue Chart Section
    ("المبيعات (", "{t('dashboard.sales', 'المبيعات')} ("),
    ("المتاجر:", "{t('dashboard.vendors_count', 'المتاجر')}:"),
    ("المستخدمين:", "{t('dashboard.users_count', 'المستخدمين')}:"),
    
    ("['`${value.toLocaleString()} ر.س`', 'المبيعات']", "['`${value.toLocaleString()} ${t(\"common.currency\", \"ر.س\")}`', t('dashboard.sales', 'المبيعات')]"),
    ("name=\"المبيعات\"", "name={t(\"dashboard.sales\", \"المبيعات\")}"),
    
    ("لا توجد بيانات مبيعات للفترة المحددة", "{t('dashboard.no_sales_data', 'لا توجد بيانات مبيعات للفترة المحددة')}"),
    
    # Activity Stream
    ("النشاط الأخير", "{t('dashboard.recent_activity', 'النشاط الأخير')}"),
    ("لا توجد أنشطة حديثة", "{t('dashboard.no_recent_activity', 'لا توجد أنشطة حديثة')}"),
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
print(f"Total untranslated strings in AdminDashboard.jsx: {count}")
