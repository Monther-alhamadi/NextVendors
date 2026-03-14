import codecs

filepath = r"c:\Users\hp\Desktop\projet2\ecommerce-store\frontend\src\components\cms\WidgetConfigForm.jsx"

with codecs.open(filepath, 'r', 'utf-8') as f:
    content = f.read()

replacements = [
    ("label: 'البنر الرئيسي'", "label: t('cms.widgets.hero_label', 'البنر الرئيسي')"),
    ("label: 'شريط المنتجات'", "label: t('cms.widgets.slider_label', 'شريط المنتجات')"),
    ("label: 'مميزات المتجر'", "label: t('cms.widgets.features_label', 'مميزات المتجر')"),
    ("label: 'شبكة تصنيفات'", "label: t('cms.widgets.grid_label', 'شبكة تصنيفات')"),
    
    ("التصنيف (اختياري)", "{t('cms.widgets.category_filter_optional', 'فلتر التصنيف (اختياري)')}"),
    ("فلتر التصنيف (اختياري)", "{t('cms.widgets.category_filter_optional', 'فلتر التصنيف (اختياري)')}"), # wait, they were 'فلتر التصنيف (اختياري)' but I already replaced 'فلتر ' let's make it exact:
    
    (">المحتوى</h4>", ">{t('cms.widgets.content_section', 'المحتوى')}</h4>"),
    (">العنوان الرئيسي</label>", ">{t('cms.widgets.main_title', 'العنوان الرئيسي')}</label>"),
    ('placeholder="أدخل العنوان..."', 'placeholder={t("cms.widgets.enter_title_ph", "أدخل العنوان...")}'),
    
    (">النص الفرعي</label>", ">{t('cms.widgets.subtitle', 'النص الفرعي')}</label>"),
    ('placeholder="أدخل الوصف..."', 'placeholder={t("cms.widgets.enter_desc_ph", "أدخل الوصف...")}'),
    
    (">الزر والروابط</h4>", ">{t('cms.widgets.btn_links_section', 'الزر والروابط')}</h4>"),
    (">نص الزر</label>", ">{t('cms.widgets.btn_text', 'نص الزر')}</label>"),
    ('placeholder="تسوق الآن"', 'placeholder={t("cms.widgets.shop_now_ph", "تسوق الآن")}'),
    (">رابط الزر</label>", ">{t('cms.widgets.btn_link', 'رابط الزر')}</label>"),
    
    (">رابط صورة الخلفية</label>", ">{t('cms.widgets.bg_img_link', 'رابط صورة الخلفية')}</label>"),
    
    (">إعدادات العرض</h4>", ">{t('cms.widgets.display_settings', 'إعدادات العرض')}</h4>"),
    ("<label className={styles.label}>فلتر التصنيف (اختياري)</label>", "<label className={styles.label}>{t('cms.widgets.category_filter_optional', 'فلتر التصنيف (اختياري)')}</label>"),
    ('placeholder="اتركه فارغاً لعرض الكل"', 'placeholder={t("cms.widgets.leave_empty_ph", "اتركه فارغاً لعرض الكل")}'),
    (">عدد المنتجات</label>", ">{t('cms.widgets.product_count', 'عدد المنتجات')}</label>"),
    
    ("إدارة عناصر المميزات ستكون متاحة في الإصدار القادم من المحرر المتقدم.", "{t('cms.widgets.features_wip', 'إدارة عناصر المميزات ستكون متاحة في الإصدار القادم من المحرر المتقدم.')}"),
    
    (">المظهر والتصميم</h4>", ">{t('cms.widgets.appearance_section', 'المظهر والتصميم')}</h4>"),
    (">لون الخلفية</label>", ">{t('cms.widgets.bg_color', 'لون الخلفية')}</label>"),
    
    ("إلغاء", "{t('common.cancel', 'إلغاء')}"),
    ("حفظ الخصائص", "{t('cms.widgets.save_props', 'حفظ الخصائص')}"),
    (" • الترتيب: ", " • {t('cms.widgets.order', 'الترتيب')}: "),
]

# Ensure useTranslation is imported
if 'useTranslation' not in content:
    content = content.replace("import React, { useState, useEffect } from 'react';", "import React, { useState, useEffect } from 'react';\nimport { useTranslation } from 'react-i18next';")
    content = content.replace("export default function WidgetConfigForm({ widget, onSave, onCancel }) {", "export default function WidgetConfigForm({ widget, onSave, onCancel }) {\n  const { t } = useTranslation();")


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
print(f"Total untranslated strings in WidgetConfigForm.jsx: {count}")
