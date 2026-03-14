import codecs

filepath = r"c:\Users\hp\Desktop\projet2\ecommerce-store\frontend\src\components\cms\DynamicBanners.jsx"

with codecs.open(filepath, 'r', 'utf-8') as f:
    content = f.read()

replacements = [
    (
"""const DEVICE_OPTIONS = [
  { value: "all", label: "الكل" },
  { value: "desktop", label: "سطح المكتب فقط" },
  { value: "mobile", label: "الجوال فقط" },
];""",
"""const getDeviceOptions = (t) => [
  { value: "all", label: t("common.all", "الكل") },
  { value: "desktop", label: t("admin.banners.desktop_only", "سطح المكتب فقط") },
  { value: "mobile", label: t("admin.banners.mobile_only", "الجوال فقط") },
];"""
    ),
    (
"""const PAGE_OPTIONS = [
  { value: "home", label: "الصفحة الرئيسية" },
  { value: "products", label: "صفحة المنتجات" },
  { value: "all", label: "جميع الصفحات" },
];""",
"""const getPageOptions = (t) => [
  { value: "home", label: t("admin.banners.page_home", "الصفحة الرئيسية") },
  { value: "products", label: t("admin.banners.page_products", "صفحة المنتجات") },
  { value: "all", label: t("common.all_pages", "جميع الصفحات") },
];"""
    ),
    (
        "const { t } = useTranslation();",
        "const { t } = useTranslation();\n  const DEVICE_OPTIONS = getDeviceOptions(t);\n  const PAGE_OPTIONS = getPageOptions(t);"
    ),
    
    # Toasts
    ('"الرجاء إدخال عنوان ورابط الصورة على الأقل"', 't("admin.banners.req_fields", "الرجاء إدخال عنوان ورابط الصورة على الأقل")'),
    ('"تم تحديث البانر بنجاح"', 't("admin.banners.update_success", "تم تحديث البانر بنجاح")'),
    ('"تم إنشاء البانر بنجاح"', 't("admin.banners.create_success", "تم إنشاء البانر بنجاح")'),
    ('"تم حذف البانر"', 't("admin.banners.delete_success", "تم حذف البانر")'),
    
    # Headers
    ('<h1 className={styles.title}>{t("admin.dynamic_banners", "إدارة البانرات الديناميكية")}</h1>', '<h1 className={styles.title}>{t("admin.dynamic_banners_title", "إدارة البانرات الديناميكية")}</h1>'),
    ('إنشاء بانر جديد', '{t("admin.banners.create_new", "إنشاء بانر جديد")}'),
    ('<div className={styles.loading}>جارٍ تحميل البانرات...</div>', '<div className={styles.loading}>{t("admin.banners.loading_banners", "جارٍ تحميل البانرات...")}</div>'),
    ('<p>لا توجد بانرات بعد. أنشئ بانرك الأول!</p>', '<p>{t("admin.banners.empty", "لا توجد بانرات بعد. أنشئ بانرك الأول!")}</p>'),
    ('إنشاء بانر</button>', '{t("admin.banners.create_banner", "إنشاء بانر")}</button>'),

    # Card content
    ('"بانر بدون عنوان"', 't("admin.banners.untitled", "بانر بدون عنوان")'),
    ('title={banner.is_active ? "إخفاء" : "إظهار"}', 'title={banner.is_active ? t("common.hide", "إخفاء") : t("common.show", "إظهار")}'),
    ('title="تعديل"', 'title={t("common.edit", "تعديل")}'),
    ('title="حذف"', 'title={t("common.delete", "حذف")}'),

    # Modal header
    ('<h2>{editingBanner ? "تعديل البانر" : "إنشاء بانر جديد"}</h2>', '<h2>{editingBanner ? t("admin.banners.edit_banner", "تعديل البانر") : t("admin.banners.create_new", "إنشاء بانر جديد")}</h2>'),

    # Form labels
    ('<label>عنوان البانر</label>', '<label>{t("admin.banners.banner_title", "عنوان البانر")}</label>'),
    ('placeholder="مثال: عرض الصيف"', 'placeholder={t("admin.banners.title_ph", "مثال: عرض الصيف")}'),
    ('<label>الصفحة المستهدفة</label>', '<label>{t("admin.banners.target_page", "الصفحة المستهدفة")}</label>'),
    ('<label>الجهاز المستهدف</label>', '<label>{t("admin.banners.target_device", "الجهاز المستهدف")}</label>'),
    ('<label>رابط صورة البانر *</label>', '<label>{t("admin.banners.img_url", "رابط صورة البانر *")}</label>'),
    ('<label>رابط الضغط (اختياري)</label>', '<label>{t("admin.banners.link_url", "رابط الضغط (اختياري)")}</label>'),
    ('<label>رقم الترتيب</label>', '<label>{t("common.order", "رقم الترتيب")}</label>'),
    ('<label>نص بديل للصورة (SEO)</label>', '<label>{t("admin.banners.alt_text", "نص بديل للصورة (SEO)")}</label>'),
    ('placeholder="وصف الصورة..."', 'placeholder={t("admin.banners.alt_ph", "وصف الصورة...")}'),
    ('<label>نص ترويجي (اختياري)</label>', '<label>{t("admin.banners.subtitle_text", "نص ترويجي (اختياري)")}</label>'),
    ('placeholder="وفر حتى 50%..."', 'placeholder={t("admin.banners.subtitle_ph", "وفر حتى 50%...")}'),
    ('<span>تفعيل البانر فوراً</span>', '<span>{t("admin.banners.activate_now", "تفعيل البانر فوراً")}</span>'),
    ('إلغاء</button>', '{t("common.cancel", "إلغاء")}</button>'),
    ('{saving ? "جارٍ الحفظ..." : "حفظ البانر"}', '{saving ? t("common.saving", "جارٍ الحفظ...") : t("admin.banners.save", "حفظ البانر")}'),

    # Delete Confirm
    ('<h3>تأكيد الحذف</h3>', '<h3>{t("common.confirm_delete", "تأكيد الحذف")}</h3>'),
    ('<p>هل أنت متأكد من حذف هذا البانر؟</p>', '<p>{t("admin.banners.delete_warn", "هل أنت متأكد من حذف هذا البانر؟")}</p>'),
    ('حذف</button>', '{t("common.delete", "حذف")}</button>'),

]

for old, new in replacements:
    if old not in content:
        print(f"Warning: Could not find '{old}'")
    content = content.replace(old, new)

with codecs.open(filepath, 'w', 'utf-8') as f:
    f.write(content)
print("Done translating DynamicBanners.jsx.")
