import codecs
import re
import os

# Read each file, do line-level replacements using line numbers

def patch_line(filepath, line_num, old_substr, new_substr):
    with codecs.open(filepath, 'r', 'utf-8') as f:
        lines = f.readlines()
    if line_num - 1 < len(lines):
        lines[line_num - 1] = lines[line_num - 1].replace(old_substr, new_substr)
    with codecs.open(filepath, 'w', 'utf-8') as f:
        f.writelines(lines)

base = r"c:\Users\hp\Desktop\projet2\ecommerce-store\frontend\src"

# Checkout.jsx - lines 255, 267 - these have double-space in them
patch_line(f"{base}\\pages\\Checkout.jsx", 255,
    "نعتذر للعملاء الكرام، هذه الخدمة غير متاحة حالياً نظراً للتعقيد  دات الإدارية من طرف البنك.",
    "{t('checkout.card_unavailable', 'نعتذر للعملاء الكرام، هذه الخدمة غير متاحة حالياً نظراً للتعقيد  دات الإدارية من طرف البنك.')}")
patch_line(f"{base}\\pages\\Checkout.jsx", 267,
    "نظام الدفع الإلكتروني بالبطاقات قيد التطوير حالياً للعمل بأعلى  معايير الأمان العالمية.",
    "{t('checkout.card_system_wip', 'نظام الدفع الإلكتروني بالبطاقات قيد التطوير حالياً للعمل بأعلى  معايير الأمان العالمية.')}")
print("Checkout.jsx patched")

# ProductDetail.jsx - line 138 - template literal with variables
patch_line(f"{base}\\pages\\ProductDetail.jsx", 138,
    "`مرحباً، أود إتمام شراء المنتج: ${product.name} (الكميية: ${qty}). رقم الطلب المرجعي: #${orderRes.order_id}`",
    "t('product.whatsapp_msg', 'مرحباً، أود إتمام شراء المنتج: {{name}} (الكمية: {{qty}}). رقم الطلب المرجعي: #{{orderId}}', { name: product.name, qty, orderId: orderRes.order_id })")
print("ProductDetail.jsx patched")

# VendorDropshipping.jsx - line 65
with codecs.open(f"{base}\\pages\\VendorDropshipping.jsx", 'r', 'utf-8') as f:
    content = f.read()

# Find the exact arabic text on line 65 and wrap it
lines = content.split('\n')
for i, line in enumerate(lines):
    if re.search(r'مرحباً بك في أسواق الجملة', line) and 't(' not in line:
        # Get the leading whitespace
        leading = line[:len(line) - len(line.lstrip())]
        stripped = line.strip()
        lines[i] = leading + '{t("vendor.ds_hero_desc_1", "' + stripped + '")}'
        print(f"VendorDropshipping.jsx line {i+1} patched")
        break

with codecs.open(f"{base}\\pages\\VendorDropshipping.jsx", 'w', 'utf-8') as f:
    f.write('\n'.join(lines))

# Now run analyzer equivalent
ar_regex = re.compile(r'[\u0600-\u06FF]+')
t_pattern = re.compile(r"""t\(.*\)""")
skip_files = ['translation.json', 'useProductValidation.jsx', 'ConfigContext.jsx', 'formatters.js']

total = 0
for root, dirs, files in os.walk(f"{base}"):
    for file in files:
        if not (file.endswith('.jsx') or file.endswith('.js')): continue
        if file in skip_files: continue
        path = os.path.join(root, file)
        with codecs.open(path, 'r', 'utf-8') as f:
            for i, line in enumerate(f):
                s = line.strip()
                if s.startswith('//') or s.startswith('import ') or s.startswith('/*') or s.startswith('*'): continue
                if ar_regex.search(line) and not t_pattern.search(line):
                    print(f"STRAY: {file}:{i+1} → {s[:80]}")
                    total += 1

print(f"\nTotal stray Arabic lines remaining: {total}")
