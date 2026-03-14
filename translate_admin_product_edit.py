import codecs

filepath = r"c:\Users\hp\Desktop\projet2\ecommerce-store\frontend\src\pages\AdminProductEdit.jsx"

with codecs.open(filepath, 'r', 'utf-8') as f:
    content = f.read()

replacements = [
    ('newErrors.name = "اسم المنتج مطلوب";', 'newErrors.name = t("admin.product_edit.err_name", "اسم المنتج مطلوب");'),
    ('newErrors.price = "السعر يجب أن يكون أكبر من صفر";', 'newErrors.price = t("admin.product_edit.err_price", "السعر يجب أن يكون أكبر من صفر");'),
    ('newErrors.inventory = "الكمية غير صحيحة";', 'newErrors.inventory = t("admin.product_edit.err_inventory", "الكمية غير صحيحة");'),
    ('toast.push({ message: "يرجى تصحيح الأخطاء في النموذج", type: "error" });', 'toast.push({ message: t("admin.product_edit.err_fix_form", "يرجى تصحيح الأخطاء في النموذج"), type: "error" });'),
    
    ("{id === \"new\" ? 'قم بتعبئة تفاصيل المنتج لرفعه على المنصة' : 'يمكنك تعديل معلومات المنتج، الصور، والأسعار'}", "{id === \"new\" ? t('admin.product_edit.subtitle_new', 'قم بتعبئة تفاصيل المنتج لرفعه على المنصة') : t('admin.product_edit.subtitle_edit', 'يمكنك تعديل معلومات المنتج، الصور، والأسعار')}"),
    
    ('> إلغاء</button>', '>{t("common.cancel", "إلغاء")}</button>'),
    (" {saving ? 'جاري الحفظ...' : 'حفظ المنتج'}", " {saving ? t('common.saving', 'جاري الحفظ...') : t('admin.product_edit.save_product', 'حفظ المنتج')}"),
    
    ('المعلومات الأساسية', '{t("admin.product_edit.tab_basic", "المعلومات الأساسية")}'),
    (' الصور والوسائط ({images.length})', ' {t("admin.product_edit.tab_media", "الصور والوسائط")} ({images.length})'),
    (' خيارات متقدمة', ' {t("admin.product_edit.tab_advanced", "خيارات متقدمة")}'),
    (' تفاصيل المنتج</h3>', ' {t("admin.product_edit.product_details", "تفاصيل المنتج")}</h3>'),
    
    ('<label className={styles.fieldLabel}>اسم المنتج *</label>', '<label className={styles.fieldLabel}>{t("admin.product_edit.product_name", "اسم المنتج")} *</label>'),
    ('placeholder="مثال: حذاء رياضي نايك أير ماكس"', 'placeholder={t("admin.product_edit.name_ph", "مثال: حذاء رياضي نايك أير ماكس")}'),
    
    ('<label className={styles.fieldLabel}>التصنيف</label>', '<label className={styles.fieldLabel}>{t("admin.product_edit.category", "التصنيف")}</label>'),
    ('placeholder="مثال: أحذية رياضية"', 'placeholder={t("admin.product_edit.category_ph", "مثال: أحذية رياضية")}'),
    
    ('<label className={styles.fieldLabel}>الوصف التفصيلي</label>', '<label className={styles.fieldLabel}>{t("admin.product_edit.description", "الوصف التفصيلي")}</label>'),
    ('placeholder="اكتب وصفاً جذاباً ومفصلاً للمنتج يوضح ميزاته وفوائده..."', 'placeholder={t("admin.product_edit.desc_ph", "اكتب وصفاً جذاباً ومفصلاً للمنتج يوضح ميزاته وفوائده...")}'),
    
    (' معرض الصور</h3>', ' {t("admin.product_edit.image_gallery", "معرض الصور")}</h3>'),
    (">جاري الرفع...</span>", ">{t('common.uploading', 'جاري الرفع...')}</span>"),
    (">إضافة صورة</span>", ">{t('admin.product_edit.add_image', 'إضافة صورة')}</span>"),
    
    (' إعدادات SEO ومحركات البحث</h3>', ' {t("admin.product_edit.seo_settings", "إعدادات SEO ومحركات البحث")}</h3>'),
    ('هذه الميزة قيد التطوير وستتوفر قريباً للتحكم في عنوان الـ Meta ووصف الصفحة.', '{t("admin.product_edit.seo_wip", "هذه الميزة قيد التطوير وستتوفر قريباً للتحكم في عنوان الـ Meta ووصف الصفحة.")}'),
    
    (' التسعير والمخزون</h3>', ' {t("admin.product_edit.pricing_inventory", "التسعير والمخزون")}</h3>'),
    ('سعر البيع ({t(\'common.currency\', \'ر.س\')}) *</label>', '{t("admin.product_edit.sale_price", "سعر البيع")} ({t(\'common.currency\', \'ر.س\')}) *</label>'),
    ('الكمية المتوفرة (المخزون) *</label>', '{t("admin.product_edit.available_qty", "الكمية المتوفرة (المخزون)")} *</label>'),
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
print(f"Total untranslated in AdminProductEdit.jsx: {count}")
