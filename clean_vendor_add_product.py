import codecs
import re

filepath = r"c:\Users\hp\Desktop\projet2\ecommerce-store\frontend\src\pages\VendorAddProduct.jsx"

with codecs.open(filepath, 'r', 'utf-8') as f:
    content = f.read()

# Fix double t() wraps
content = content.replace("t('vendor.add_product_failed', t('vendor.add_product_failed', 'فشل إضافة المنتج'))", "t('vendor.add_product_failed', 'فشل إضافة المنتج')")
content = content.replace('t("vendor.add_product_failed_dot", t("vendor.add_product_failed_dot", "فشل إضافة المنتج."))', 't("vendor.add_product_failed_dot", "فشل إضافة المنتج.")')
content = content.replace('{t("vendor.base_price_50", "{t(\"vendor.base_price_50\", \"السعر الأساسي: 50 ر.س\")}")}', '{t("vendor.base_price_50", "السعر الأساسي: 50 ر.س")}')

with codecs.open(filepath, 'w', 'utf-8') as f:
    f.write(content)

# Now what lines have arabic but no t()?
ar_regex = re.compile(r'[\u0600-\u06FF]+')
t_pattern = re.compile(r"""t\([^)]+\)""")

count = 0
for i, line in enumerate(content.split('\n')):
    if line.strip().startswith('//') or line.strip().startswith('import '):
        continue
    if ar_regex.search(line) and not t_pattern.search(line):
        print(f"Line {i+1}: {line.strip()}")
        count += 1
print(f"Total untranslated: {count}")

