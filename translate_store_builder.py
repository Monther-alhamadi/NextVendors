import codecs

filepath = r"c:\Users\hp\Desktop\projet2\ecommerce-store\frontend\src\pages\AdminStoreBuilder.jsx"

with codecs.open(filepath, 'r', 'utf-8') as f:
    content = f.read()

replacements = [
    # WIDGET_CATALOG
    (
"""const WIDGET_CATALOG = [
  {
    type: "HeroWidget",
    label: "البنر الرئيسي",
    labelEn: "Hero Banner",
    icon: Image,
    color: "#6366f1",
    description: "بنر كبير بخلفية وعنوان رئيسي وزر",
    default: { title: "مرحباً بك", subtitle: "", button_text: "تسوق الآن", bg_color: "#0a0d2e" }
  },
  {
    type: "SliderWidget",
    label: "شريط المنتجات",
    labelEn: "Product Carousel",
    icon: Layers,
    color: "#10b981",
    description: "عرض دائري لأحدث المنتجات أو تصنيف معين",
    default: { title: "أحدث المنتجات", categoryId: null, limit: 10, bg_color: "#f8fafc" }
  },
  {
    type: "FeaturesWidget",
    label: "مميزات المتجر",
    labelEn: "Store Features",
    icon: Star,
    color: "#f59e0b",
    description: "عرض أيقونات المميزات مثل التوصيل والجودة",
    default: { title: "لماذا تتسوق معنا؟", items: [], bg_color: "#ffffff" }
  },
  {
    type: "GridWidget",
    label: "شبكة تصنيفات",
    labelEn: "Category Grid",
    icon: Grid3X3,
    color: "#8b5cf6",
    description: "شبكة بصرية لتصنيفات المتجر",
    default: { title: "تسوق حسب القسم", bg_color: "#f8fafc" }
  },
];""",
"""const getWidgetCatalog = (t) => [
  {
    type: "HeroWidget",
    label: t("admin.builder.hero_label", "البنر الرئيسي"),
    labelEn: "Hero Banner",
    icon: Image,
    color: "#6366f1",
    description: t("admin.builder.hero_desc", "بنر كبير بخلفية وعنوان رئيسي وزر"),
    default: { title: t("admin.builder.hero_title_def", "مرحباً بك"), subtitle: "", button_text: t("admin.builder.hero_btn_def", "تسوق الآن"), bg_color: "#0a0d2e" }
  },
  {
    type: "SliderWidget",
    label: t("admin.builder.slider_label", "شريط المنتجات"),
    labelEn: "Product Carousel",
    icon: Layers,
    color: "#10b981",
    description: t("admin.builder.slider_desc", "عرض دائري لأحدث المنتجات أو تصنيف معين"),
    default: { title: t("admin.builder.slider_title_def", "أحدث المنتجات"), categoryId: null, limit: 10, bg_color: "#f8fafc" }
  },
  {
    type: "FeaturesWidget",
    label: t("admin.builder.features_label", "مميزات المتجر"),
    labelEn: "Store Features",
    icon: Star,
    color: "#f59e0b",
    description: t("admin.builder.features_desc", "عرض أيقونات المميزات مثل التوصيل والجودة"),
    default: { title: t("admin.builder.features_title_def", "لماذا تتسوق معنا؟"), items: [], bg_color: "#ffffff" }
  },
  {
    type: "GridWidget",
    label: t("admin.builder.grid_label", "شبكة تصنيفات"),
    labelEn: "Category Grid",
    icon: Grid3X3,
    color: "#8b5cf6",
    description: t("admin.builder.grid_desc", "شبكة بصرية لتصنيفات المتجر"),
    default: { title: t("admin.builder.grid_title_def", "تسوق حسب القسم"), bg_color: "#f8fafc" }
  },
];"""
    ),
    (
        "function getWidgetMeta(type) {",
        "function getWidgetMeta(type, catalog) {"
    ),
    (
        "return WIDGET_CATALOG.find(w => w.type === type) ||",
        "return catalog.find(w => w.type === type) ||"
    ),

    # Inside Component
    (
        "const { t } = useTranslation();",
        "const { t } = useTranslation();\n  const WIDGET_CATALOG = getWidgetCatalog(t);"
    ),

    # Other Strings
    ('title: "الرئيسية"', 'title: t("admin.builder.home_page", "الرئيسية")'),
    ('"فشل تحميل الصفحات"', 't("admin.builder.err_load_pages", "فشل تحميل الصفحات")'),
    ('"فشل تحميل بيانات الصفحة"', 't("admin.builder.err_load_page_data", "فشل تحميل بيانات الصفحة")'),
    ('"تم إضافة المكون بنجاح ✨"', 't("admin.builder.widget_added", "تم إضافة المكون بنجاح ✨")'),
    ('"خطأ أثناء إضافة المكون"', 't("admin.builder.widget_add_err", "خطأ أثناء إضافة المكون")'),
    ('("هل أنت متأكد من حذف هذا المكون؟")', '(t("admin.builder.del_confirm", "هل أنت متأكد من حذف هذا المكون؟"))'),
    ('"تم الحذف"', 't("common.deleted", "تم الحذف")'),
    ('"فشل الحذف"', 't("common.delete_failed", "فشل الحذف")'),
    ('"تم تفعيل المكون" : "تم إخفاء المكون"', 't("admin.builder.widget_activated", "تم تفعيل المكون") : t("admin.builder.widget_hidden", "تم إخفاء المكون")'),
    ('"فشل تعديل الحالة"', 't("admin.builder.status_err", "فشل تعديل الحالة")'),
    ('"تم حفظ التعديلات ✓"', 't("common.saved", "تم حفظ التعديلات ✓")'),
    ('"لم يتم حفظ التعديلات"', 't("common.save_failed", "لم يتم حفظ التعديلات")'),
    ('"تمت إعادة ضبط الترتيب"', 't("admin.builder.order_reset", "تمت إعادة ضبط الترتيب")'),
    ('"تم حفظ الترتيب بنجاح ✓"', 't("admin.builder.order_saved", "تم حفظ الترتيب بنجاح ✓")'),
    ('"فشل حفظ الترتيب"', 't("admin.builder.order_save_err", "فشل حفظ الترتيب")'),
    ('<p>جاري تحميل المُنشئ المرئي...</p>', '<p>{t("admin.builder.loading_builder", "جاري تحميل المُنشئ المرئي...")}</p>'),
    ('<h1 className={styles.title}>منشئ المتجر المرئي</h1>', '<h1 className={styles.title}>{t("admin.builder.title", "منشئ المتجر المرئي")}</h1>'),
    ('<p className={styles.subtitle}>تخصيص كامل لواجهة المتجر بالسحب والإفلات</p>', '<p className={styles.subtitle}>{t("admin.builder.subtitle", "تخصيص كامل لواجهة المتجر بالسحب والإفلات")}</p>'),
    ('إعادة الضبط', '{t("admin.builder.reset", "إعادة الضبط")}'),
    ('{saving ? "جاري الحفظ..." : "حفظ الترتيب"}', '{saving ? t("common.saving", "جاري الحفظ...") : t("admin.builder.save_order", "حفظ الترتيب")}'),
    ('معاينة المتجر', '{t("admin.builder.preview", "معاينة المتجر")}'),
    ('<span>الصفحة:</span>', '<span>{t("admin.builder.page", "الصفحة:")}</span>'),
    ('مباشر</span>', '{t("common.live", "مباشر")}</span>'),
    ('مكون\n              </span>', '{t("admin.builder.widget_word", "مكون")}\n              </span>'),
    ('<p>هذه الصفحة فارغة</p>', '<p>{t("admin.builder.empty_page", "هذه الصفحة فارغة")}</p>'),
    ('<span>أضف مكونات من الزر أدناه لبدء بناء واجهتك</span>', '<span>{t("admin.builder.empty_page_hint", "أضف مكونات من الزر أدناه لبدء بناء واجهتك")}</span>'),
    ('const meta = getWidgetMeta(widget.type);', 'const meta = getWidgetMeta(widget.type, WIDGET_CATALOG);'),
    ('|| "بدون عنوان"', '|| t("common.untitled", "بدون عنوان")'),
    ('title={widget.is_active ? "إخفاء" : "إظهار"}', 'title={widget.is_active ? t("common.hide", "إخفاء") : t("common.show", "إظهار")}'),
    ('إضافة مكون جديد', '{t("admin.builder.add_widget", "إضافة مكون جديد")}'),
    ('<h2>إعدادات المكون</h2>', '<h2>{t("admin.builder.widget_settings", "إعدادات المكون")}</h2>'),
    ('<p>اختر مكوناً من الواجهة</p>', '<p>{t("admin.builder.select_widget", "اختر مكوناً من الواجهة")}</p>'),
    ('<span>انقر على أي مكون لتعديل خصائصه ومظهره</span>', '<span>{t("admin.builder.select_widget_hint", "انقر على أي مكون لتعديل خصائصه ومظهره")}</span>')
]

for old, new in replacements:
    if old not in content:
        print(f"Warning: Could not find '{old}'")
    content = content.replace(old, new)

with codecs.open(filepath, 'w', 'utf-8') as f:
    f.write(content)
print("Done. Translated AdminStoreBuilder.jsx.")
