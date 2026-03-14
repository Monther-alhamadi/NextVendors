import codecs

filepath = r"c:\Users\hp\Desktop\projet2\ecommerce-store\frontend\src\components\cms\CategoryShowcase.jsx"

with codecs.open(filepath, 'r', 'utf-8') as f:
    content = f.read()

replacements = [
    # WIDGET_TYPES array
    (
"""const WIDGET_TYPES = [
  { value: "categories_bar", label: "شريط الأقسام" },
  { value: "product_grid", label: "شبكة المنتجات المميزة" },
  { value: "flash_sale", label: "تخفيضات فلاش" },
  { value: "custom_html", label: "محتوى HTML مخصص" },
];""",
"""const getWidgetTypes = (t) => [
  { value: "categories_bar", label: t("admin.showcase.type_categories", "شريط الأقسام") },
  { value: "product_grid", label: t("admin.showcase.type_products", "شبكة المنتجات المميزة") },
  { value: "flash_sale", label: t("admin.showcase.type_flash", "تخفيضات فلاش") },
  { value: "custom_html", label: t("admin.showcase.type_html", "محتوى HTML مخصص") },
];"""
    ),
    
    # PAGE_OPTIONS array
    (
"""const PAGE_OPTIONS = [
  { value: "home", label: "الصفحة الرئيسية" },
  { value: "products", label: "صفحة المنتجات" },
  { value: "all", label: "جميع الصفحات" },
];""",
"""const getPageOptions = (t) => [
  { value: "home", label: t("admin.showcase.page_home", "الصفحة الرئيسية") },
  { value: "products", label: t("admin.showcase.page_products", "صفحة المنتجات") },
  { value: "all", label: t("common.all_pages", "جميع الصفحات") },
];"""
    ),

    # DEVICE_OPTIONS array
    (
"""const DEVICE_OPTIONS = [
  { value: "all", label: "الكل" },
  { value: "desktop", label: "سطح المكتب" },
  { value: "mobile", label: "الجوال" },
];""",
"""const getDeviceOptions = (t) => [
  { value: "all", label: t("common.all", "الكل") },
  { value: "desktop", label: t("common.desktop", "سطح المكتب") },
  { value: "mobile", label: t("common.mobile", "الجوال") },
];"""
    ),

    # Component inside declarations
    (
        "  const typeLabel = (v) => WIDGET_TYPES.find(t => t.value === v)?.label || v;",
        "  const WIDGET_TYPES = getWidgetTypes(t);\n  const PAGE_OPTIONS = getPageOptions(t);\n  const DEVICE_OPTIONS = getDeviceOptions(t);\n\n  const typeLabel = (v) => WIDGET_TYPES.find(t => t.value === v)?.label || v;"
    ),

    # Toasts
    ('"حدث خطأ"', 't("common.error_occurred", "حدث خطأ")'),
    ('"عنوان الودجت مطلوب"', 't("admin.showcase.title_req", "عنوان الودجت مطلوب")'),
    ('"تم تحديث الودجت بنجاح"', 't("admin.showcase.update_success", "تم تحديث الودجت بنجاح")'),
    ('"تم إنشاء الودجت بنجاح"', 't("admin.showcase.create_success", "تم إنشاء الودجت بنجاح")'),
    ('"تم حذف الودجت"', 't("admin.showcase.delete_success", "تم حذف الودجت")'),

    # Headings and General Strings
    ('<h1 className={styles.title}>{t("admin.category_showcase", "ودجت الصفحات والأقسام")}</h1>', '<h1 className={styles.title}>{t("admin.category_showcase_title", "ودجت الصفحات والأقسام")}</h1>'),
    ('<p className={styles.subtitle}>{t("admin.showcase_subtitle", "تحكم في العناصر والأقسام التفاعلية المعروضة في صفحات المتجر")}</p>', '<p className={styles.subtitle}>{t("admin.showcase_subtitle", "تحكم في العناصر والأقسام التفاعلية المعروضة في صفحات المتجر")}</p>'),
    ('إضافة ودجت جديد', '{t("admin.showcase.add_widget", "إضافة ودجت جديد")}'),
    ('<div className={styles.loading}>جارٍ التحميل...</div>', '<div className={styles.loading}>{t("common.loading", "جارٍ التحميل...")}</div>'),
    ('<p>لا توجد ودجت بعد. ابدأ بإضافة عناصر لصفحاتك!</p>', '<p>{t("admin.showcase.empty", "لا توجد ودجت بعد. ابدأ بإضافة عناصر لصفحاتك!")}</p>'),
    ('إضافة ودجت</button>', '{t("admin.showcase.add_widget_btn", "إضافة ودجت")}</button>'),
    ('ودجت</span>', '{t("admin.showcase.widget_word", "ودجت")}</span>'),
    ('الترتيب:', '{t("common.order", "الترتيب")}:'),
    ('title={widget.is_active ? "إخفاء" : "إظهار"}', 'title={widget.is_active ? t("common.hide", "إخفاء") : t("common.show", "إظهار")}'),
    ('<span>{widget.is_active ? "نشط" : "مخفي"}</span>', '<span>{widget.is_active ? t("common.active", "نشط") : t("common.hidden", "مخفي")}</span>'),
    ('<span>تعديل</span>', '<span>{t("common.edit", "تعديل")}</span>'),
    
    # Modal Strings
    (
        '<h2>{editingWidget ? "تعديل الودجت" : "إضافة ودجت جديد"}</h2>',
        '<h2>{editingWidget ? t("admin.showcase.edit_widget", "تعديل الودجت") : t("admin.showcase.new_widget", "إضافة ودجت جديد")}</h2>'
    ),
    ('<label>عنوان الودجت *</label>', '<label>{t("admin.showcase.widget_title", "عنوان الودجت")} *</label>'),
    ('placeholder="مثال: أقسام الصفحة الرئيسية"', 'placeholder={t("admin.showcase.title_ph", "مثال: أقسام الصفحة الرئيسية")}'),
    ('<label>نوع الودجت</label>', '<label>{t("admin.showcase.widget_type", "نوع الودجت")}</label>'),
    ('<label>الصفحة المستهدفة</label>', '<label>{t("admin.showcase.target_page", "الصفحة المستهدفة")}</label>'),
    ('<label>الجهاز المستهدف</label>', '<label>{t("admin.showcase.target_device", "الجهاز المستهدف")}</label>'),
    ('<label>رقم الترتيب</label>', '<label>{t("admin.showcase.order_num", "رقم الترتيب")}</label>'),
    ('<label>أقصى عدد عناصر</label>', '<label>{t("admin.showcase.max_items", "أقصى عدد عناصر")}</label>'),
    ('<label>ألوان التمييز</label>', '<label>{t("admin.showcase.highlight_color", "ألوان التمييز")}</label>'),
    ('<label>كود HTML</label>', '<label>{t("admin.showcase.html_code", "كود HTML")}</label>'),
    ('<span>تفعيل الودجت فوراً</span>', '<span>{t("admin.showcase.activate_now", "تفعيل الودجت فوراً")}</span>'),
    ('إلغاء</button>', '{t("common.cancel", "إلغاء")}</button>'),
    ('{saving ? "جارٍ الحفظ..." : "حفظ الودجت"}', '{saving ? t("common.saving", "جارٍ الحفظ...") : t("admin.showcase.save", "حفظ الودجت")}'),

    # Delete confirmation strings
    ('<h3>تأكيد الحذف</h3>', '<h3>{t("common.confirm_delete", "تأكيد الحذف")}</h3>'),
    ('<p>سيتم حذف هذا الودجت نهائياً من جميع الصفحات.</p>', '<p>{t("admin.showcase.delete_warn", "سيتم حذف هذا الودجت نهائياً من جميع الصفحات.")}</p>'),
    ('حذف</button>', '{t("common.delete", "حذف")}</button>')
]

for old, new in replacements:
    if old not in content:
        print(f"Warning: Could not find '{old}'")
    content = content.replace(old, new)

with codecs.open(filepath, 'w', 'utf-8') as f:
    f.write(content)
print("Done. Translated CategoryShowcase.jsx.")
