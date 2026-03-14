import codecs
import re
import os

base = r"c:\Users\hp\Desktop\projet2\ecommerce-store\frontend\src"

corrections = [
    {
        "file": f"{base}\\pages\\Checkout.jsx",
        "reps": [
            ("⚠️ نعتذر للعملاء الكرام، هذه الخدمة غير متاحة حالياً نظراً للتعقيدات الإدارية من طرف البنك.", "{t('checkout.card_unavailable', '⚠️ نعتذر للعملاء الكرام، هذه الخدمة غير متاحة حالياً نظراً للتعقيدات الإدارية من طرف البنك.')}"),
            ("🔒 نظام الدفع الإلكتروني بالبطاقات قيد التطوير حالياً للعمل بأعلى معايير الأمان العالمية.", "{t('checkout.card_system_wip', '🔒 نظام الدفع الإلكتروني بالبطاقات قيد التطوير حالياً للعمل بأعلى معايير الأمان العالمية.')}"),
        ]
    },
    {
        "file": f"{base}\\pages\\ProductDetail.jsx",
        "reps": [
            ("const msg = `مرحباً، أود إتمام شراء المنتج: ${product.name} (الكمية: ${qty}). رقم الطلب المرجعي: #${orderRes.order_id}`;", 
             "const msg = t('product.whatsapp_msg', 'مرحباً، أود إتمام شراء المنتج: {{name}} (الكمية: {{qty}}). رقم الطلب المرجعي: #{{orderId}}', { name: product.name, qty, orderId: orderRes.order_id });")
        ]
    },
    {
        "file": f"{base}\\pages\\VendorDropshipping.jsx",
        "reps": [
            ("مرحباً بك في أسواق الجملة العالمية! ابحث عن أي منتج تريده (ساعات، إإلكترونيات، ملابس)، وسنقوم نحن", "{t('vendor.ds_hero_desc_1', 'مرحباً بك في أسواق الجملة العالمية! ابحث عن أي منتج تريده (ساعات، إإلكترونيات، ملابس)، وسنقوم نحن')}")
        ]
    },
    {
        "file": f"{base}\\utils\\formatters.js",
        "reps": [
            ("currencySymbol = 'ر.س'", "currencySymbol = 'ر.س'"), # Keep as is but maybe we should use i18n here? 
            # Actually formatters is a JS file, it doesn't have useTranslation. 
            # I'll let it be for now since it's logical constant.
        ]
    }
]

for item in corrections:
    path = item["file"]
    if os.path.exists(path):
        with codecs.open(path, 'r', 'utf-8') as f:
            content = f.read()
        for old, new in item["reps"]:
            content = content.replace(old, new)
        with codecs.open(path, 'w', 'utf-8') as f:
            f.write(content)
        print(f"Patched {os.path.basename(path)}")

# Final Check
ar_regex = re.compile(r'[\u0600-\u06FF]+')
t_pattern = re.compile(r"""t\(.*\)""")
skip_files = ['translation.json', 'useProductValidation.jsx', 'ConfigContext.jsx', 'formatters.js']

total = 0
for root, dirs, files in os.walk(base):
    for file in files:
        if not (file.endswith('.jsx') or file.endswith('.js')): continue
        if file in skip_files: continue
        p = os.path.join(root, file)
        with codecs.open(p, 'r', 'utf-8') as f:
            for i, line in enumerate(f):
                s = line.strip()
                if s.startswith('//') or s.startswith('import ') or s.startswith('/*') or s.startswith('*'): continue
                if ar_regex.search(line) and not t_pattern.search(line):
                    print(f"STRAY: {file}:{i+1} -> {s}")
                    total += 1
print(f"Total Stray: {total}")
