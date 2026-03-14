import codecs

filepath = r"c:\Users\hp\Desktop\projet2\ecommerce-store\frontend\src\pages\VendorProducts.jsx"

with codecs.open(filepath, 'r', 'utf-8') as f:
    content = f.read()

replacements = [
    # Headers
    ("إدارة الكتالوج الخاص بك والمخزون والتسعير.", "{t('vendor.products_subtitle', 'إدارة الكتالوج الخاص بك والمخزون والتسعير.')}"),
    
    # Stats 
    (">إجمالي المنتجات</div>", ">{t('vendor.stat_total', 'إجمالي المنتجات')}</div>"),
    (">نشط ومتوفر</div>", ">{t('vendor.stat_active', 'نشط ومتوفر')}</div>"),
    (">مسودات</div>", ">{t('vendor.stat_drafts', 'مسودات')}</div>"),
    (">نفذت الكمية</div>", ">{t('vendor.stat_out_of_stock', 'نفذت الكمية')}</div>"),
    
    # Filter Toolbar
    (">الكل</button>", ">{t('common.all', 'الكل')}</button>"),
    (">نشط</button>", ">{t('vendor.filter_active', 'نشط')}</button>"),
    (">مسودات</button>", ">{t('vendor.filter_drafts', 'مسودات')}</button>"),
    (">نفذت الكمية</button>", ">{t('vendor.filter_out_of_stock', 'نفذت الكمية')}</button>"),
    
    # Table Headings
    ("<th>المنتج</th>", "<th>{t('vendor.col_product', 'المنتج')}</th>"),
    ("<th>الحالة</th>", "<th>{t('vendor.col_status', 'الحالة')}</th>"),
    ("<th>السعر</th>", "<th>{t('vendor.col_price', 'السعر')}</th>"),
    ("<th>المخزون</th>", "<th>{t('vendor.col_inventory', 'المخزون')}</th>"),
    (">إجراءات</th>", ">{t('vendor.col_actions', 'إجراءات')}</th>"),
    
    # Empty State
    (">لا توجد منتجات</h3>", ">{t('vendor.no_products', 'لا توجد منتجات')}</h3>"),
    (">لم نتمكن من العثور على أي منتجات تطابق بحثك أو الفلتر المستخدم.</p>", ">{t('vendor.no_products_desc', 'لم نتمكن من العثور على أي منتجات تطابق بحثك أو الفلتر المستخدم.')}</p>"),
    (">إضافة منتج جديد<", ">{t('vendor.add_new', 'إضافة منتج جديد')}<"),
    
    # Table Body Badges
    ("? 'مسودة' : 'نشط'", "? t('vendor.status_draft', 'مسودة') : t('vendor.status_active', 'نشط')"),
    ("{p.cost_price?.toFixed(2)} ر.س", "{p.cost_price?.toFixed(2)} {t('common.currency', 'ر.س')}"),
    
    # Actions
    ("aria-label=\"تعديل\" title=\"تعديل\"", "aria-label={t('common.edit', 'تعديل')} title={t('common.edit', 'تعديل')}"),
    ("aria-label=\"حذف\" title=\"حذف\"", "aria-label={t('common.delete', 'حذف')} title={t('common.delete', 'حذف')}"),
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
print(f"Total untranslated strings in VendorProducts.jsx: {count}")
