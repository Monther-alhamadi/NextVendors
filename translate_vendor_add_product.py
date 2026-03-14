import codecs

filepath = r"c:\Users\hp\Desktop\projet2\ecommerce-store\frontend\src\pages\VendorAddProduct.jsx"

with codecs.open(filepath, 'r', 'utf-8') as f:
    content = f.read()

replacements = [
    # Toasts and errors
    ("'فشل إضافة المنتج'", "t('vendor.add_product_failed', 'فشل إضافة المنتج')"),
    ('"فشل إضافة المنتج."', 't("vendor.add_product_failed_dot", "فشل إضافة المنتج.")'),

    # Mode selection screen
    ('<p className={s.selectSubtitle}>اختر طريقة إضافة المنتج التي تناسبك لبدء البيع فوراً.</p>', '<p className={s.selectSubtitle}>{t("vendor.add_product_subtitle", "اختر طريقة إضافة المنتج التي تناسبك لبدء البيع فوراً.")}</p>'),
    ('<h2 className={s.cardTitle}>البيع من كتالوج الموردين</h2>', '<h2 className={s.cardTitle}>{t("vendor.sell_from_catalog", "البيع من كتالوج الموردين")}</h2>'),
    ('<p className={s.cardDesc}>دروبشيبينغ لمنتجات جاهزة من موردين معتمدين. (يتطلب باقة احترافية)</p>', '<p className={s.cardDesc}>{t("vendor.dropship_desc", "دروبشيبينغ لمنتجات جاهزة من موردين معتمدين. (يتطلب باقة احترافية)")}</p>'),
    ('<span className={s.cardAction}>تصفح الكتالوج &rarr;</span>', '<span className={s.cardAction}>{t("vendor.browse_catalog", "تصفح الكتالوج")} &rarr;</span>'),
    ('<h2 className={s.cardTitle}>إنشاء منتج خاص بك</h2>', '<h2 className={s.cardTitle}>{t("vendor.create_own_product", "إنشاء منتج خاص بك")}</h2>'),
    ('<p className={s.cardDesc}>ارفاق الصور والتفاصيل الخاصة بك. تحكم كامل في القوائم الخاصة بك.</p>', '<p className={s.cardDesc}>{t("vendor.create_own_desc", "ارفاق الصور والتفاصيل الخاصة بك. تحكم كامل في القوائم الخاصة بك.")}</p>'),
    ('<span className={s.cardAction}>إنشاء قائمة &rarr;</span>', '<span className={s.cardAction}>{t("vendor.create_listing", "إنشاء قائمة")} &rarr;</span>'),

    # Header
    ('<span>العودة للخيارات</span>', '<span>{t("vendor.back_to_options", "العودة للخيارات")}</span>'),
    ("{mode === 'dropship' ? 'بيع منتج دروبشيبينغ' : 'إنشاء منتج خاص'}", "{mode === 'dropship' ? t('vendor.dropship_product', 'بيع منتج دروبشيبينغ') : t('vendor.create_private_product', 'إنشاء منتج خاص')}"),

    # Dropship section
    ('<h3>البحث في الكتالوج</h3>', '<h3>{t("vendor.search_catalog", "البحث في الكتالوج")}</h3>'),
    ('placeholder="ابحث بالاسم، الفئة، أو الرمز الشريطي..."', 'placeholder={t("vendor.search_catalog_ph", "ابحث بالاسم، الفئة، أو الرمز الشريطي...")}'),
    ('السعر الأساسي: 50 ر.س', '{t("vendor.base_price_50", "السعر الأساسي: 50 ر.س")}'),
    ('<span className={s.selectedMeta}>تم اختياره من كتالوج الموردين العالمي</span>', '<span className={s.selectedMeta}>{t("vendor.selected_from_catalog", "تم اختياره من كتالوج الموردين العالمي")}</span>'),
    ('>تغيير</button>', '>{t("common.change", "تغيير")}</button>'),

    # Basic Info Section
    ('<h3>المعلومات الأساسية</h3>', '<h3>{t("vendor.basic_info", "المعلومات الأساسية")}</h3>'),
    ('<label>اسم المنتج <span', '<label>{t("vendor.product_name", "اسم المنتج")} <span'),
    ('<label>التصنيف <span', '<label>{t("vendor.category", "التصنيف")} <span'),
    ('<label>الوصف <span', '<label>{t("vendor.description", "الوصف")} <span'),
    
    # Visuals Section
    ('<h3>الصور والوسائط</h3>', '<h3>{t("vendor.images_media", "الصور والوسائط")}</h3>'),

    # Pricing & Inventory Section
    ('<h3>التسعير والمخزون</h3>', '<h3>{t("vendor.pricing_inventory", "التسعير والمخزون")}</h3>'),
    ('<label>السعر (ر.س) <span', '<label>{t("vendor.price_sar", "السعر (ر.س)")} <span'),
    ('<label>المخزون المتوفر <span', '<label>{t("vendor.available_stock", "المخزون المتوفر")} <span'),
    ('<label>SKU (رمز الصنف)</label>', '<label>{t("vendor.sku_label", "SKU (رمز الصنف)")}</label>'),
    ('<label>تنبيه انخفاض المخزون</label>', '<label>{t("vendor.low_stock_alert", "تنبيه انخفاض المخزون")}</label>'),

    # SEO Section
    ('<h3>تحسين محركات البحث (SEO) <span', '<h3>{t("vendor.seo", "تحسين محركات البحث (SEO)")} <span'),
    ('>متقدم</span>', '>{t("common.advanced", "متقدم")}</span>'),
    ('<label>عنوان ميتا (Meta Title)</label>', '<label>{t("vendor.meta_title", "عنوان ميتا (Meta Title)")}</label>'),
    ('placeholder="عنوان الصفحة لمحركات البحث"', 'placeholder={t("vendor.meta_title_ph", "عنوان الصفحة لمحركات البحث")}'),
    ('<label>الكلمات الدلالية (Tags)</label>', '<label>{t("vendor.meta_tags", "الكلمات الدلالية (Tags)")}</label>'),
    ('placeholder="مفصولة بفواصل e.g. هاتف, ذكي"', 'placeholder={t("vendor.meta_tags_ph", "مفصولة بفواصل e.g. هاتف, ذكي")}'),

    # Footer
    ("{mode === 'dropship' ? 'تأكيد وإدراج' : 'حفظ ونشر'}", "{mode === 'dropship' ? t('vendor.confirm_list', 'تأكيد وإدراج') : t('vendor.save_publish', 'حفظ ونشر')}"),

]

for old, new in replacements:
    if old not in content:
        print(f"Warning: Could not find '{old}'")
    content = content.replace(old, new)

with codecs.open(filepath, 'w', 'utf-8') as f:
    f.write(content)
print("Done translating VendorAddProduct.jsx.")
