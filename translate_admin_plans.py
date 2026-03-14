import codecs

filepath = r"c:\Users\hp\Desktop\projet2\ecommerce-store\frontend\src\pages\AdminPlans.jsx"

with codecs.open(filepath, 'r', 'utf-8') as f:
    content = f.read()

replacements = [
    # PLAN_FEATURES
    (
"""const PLAN_FEATURES = [
  { key: "auto_approve_products",         icon: "✅", label: "الموافقة التلقائية على المنتجات", desc: "المنتجات تُنشر مباشرة دون مراجعة" },
  { key: "can_customize_store",           icon: "🎨", label: "تخصيص المتجر",                  desc: "تعديل الألوان والتصميم والشعار" },
  { key: "can_access_advanced_analytics", icon: "📊", label: "تحليلات متقدمة",                desc: "إحصائيات مفصلة ورسوم بيانية" },
  { key: "can_use_priority_support",      icon: "⚡", label: "دعم فني أولوي",                 desc: "أولوية في الرد والدعم الفني" },
  { key: "allow_whatsapp_checkout",       icon: "💬", label: "الدفع عبر واتساب",              desc: "إتمام الطلب عبر محادثة واتساب" },
  { key: "is_active",                    icon: "🟢", label: "الخطة فعّالة",                   desc: "إظهار الخطة للتجار الجدد" },
];""",
"""const getPlanFeatures = (t) => [
  { key: "auto_approve_products",         icon: "✅", label: t("admin.plans.feat_auto_approve", "الموافقة التلقائية على المنتجات"), desc: t("admin.plans.desc_auto_approve", "المنتجات تُنشر مباشرة دون مراجعة") },
  { key: "can_customize_store",           icon: "🎨", label: t("admin.plans.feat_customize", "تخصيص المتجر"),                  desc: t("admin.plans.desc_customize", "تعديل الألوان والتصميم والشعار") },
  { key: "can_access_advanced_analytics", icon: "📊", label: t("admin.plans.feat_analytics", "تحليلات متقدمة"),                desc: t("admin.plans.desc_analytics", "إحصائيات مفصلة ورسوم بيانية") },
  { key: "can_use_priority_support",      icon: "⚡", label: t("admin.plans.feat_support", "دعم فني أولوي"),                 desc: t("admin.plans.desc_support", "أولوية في الرد والدعم الفني") },
  { key: "allow_whatsapp_checkout",       icon: "💬", label: t("admin.plans.feat_whatsapp", "الدفع عبر واتساب"),              desc: t("admin.plans.desc_whatsapp", "إتمام الطلب عبر محادثة واتساب") },
  { key: "is_active",                    icon: "🟢", label: t("admin.plans.feat_active", "الخطة فعّالة"),                   desc: t("admin.plans.desc_active", "إظهار الخطة للتجار الجدد") },
];"""
    ),
    
    (
        "const { t } = useTranslation();",
        "const { t } = useTranslation();\n  const PLAN_FEATURES = getPlanFeatures(t);"
    ),

    # Toasts and Alerts
    ('"تم تحديث الخطة بنجاح"', 't("admin.plans.update_success", "تم تحديث الخطة بنجاح")'),
    ('"تم إنشاء الخطة بنجاح"', 't("admin.plans.create_success", "تم إنشاء الخطة بنجاح")'),
    ('("هل أنت متأكد من حذف هذه الخطة؟")', '(t("admin.plans.delete_confirm", "هل أنت متأكد من حذف هذه الخطة؟"))'),
    ('"تم حذف الخطة"', 't("admin.plans.delete_success", "تم حذف الخطة")'),
    ('"فشل حذف الخطة"', 't("admin.plans.delete_failed", "فشل حذف الخطة")'),
    ('"فشل تحديث الميزة"', 't("admin.plans.toggle_failed", "فشل تحديث الميزة")'),

    # Header and Main elements
    ('<h1 className={s.title}>إدارة خطط التجار</h1>', '<h1 className={s.title}>{t("admin.plans.title", "إدارة خطط التجار")}</h1>'),
    ('<p className={s.subtitle}>تحكم في الخطط والمميزات والأسعار والحدود لكل مستوى اشتراك</p>', '<p className={s.subtitle}>{t("admin.plans.subtitle", "تحكم في الخطط والمميزات والأسعار والحدود لكل مستوى اشتراك")}</p>'),
    ('إنشاء خطة جديدة', '{t("admin.plans.create_new", "إنشاء خطة جديدة")}'),

    # Empty states
    ('<div className={s.emptyText}>لا توجد خطط حالياً</div>', '<div className={s.emptyText}>{t("admin.plans.empty", "لا توجد خطط حالياً")}</div>'),
    ('<div className={s.emptyHint}>أنشئ خطة اشتراك للبدء في إدارة مميزات التجار</div>', '<div className={s.emptyHint}>{t("admin.plans.empty_hint", "أنشئ خطة اشتراك للبدء في إدارة مميزات التجار")}</div>'),

    # Cards
    ('? \'فعّالة\' : \'معطّلة\'', '? t("common.active_f", "فعّالة") : t("common.inactive_f", "معطّلة")'),
    ('<span className={s.priceLabel}>شهرياً</span>', '<span className={s.priceLabel}>{t("admin.plans.monthly", "شهرياً")}</span>'),
    ('<span className={s.priceUnit}>ر.س</span>', '<span className={s.priceUnit}>{t("common.currency", "ر.س")}</span>'),
    ('<span className={s.priceLabel}>سنوياً</span>', '<span className={s.priceLabel}>{t("admin.plans.yearly", "سنوياً")}</span>'),
    ('<span className={s.priceLabel}>العمولة</span>', '<span className={s.priceLabel}>{t("admin.plans.commission", "العمولة")}</span>'),
    ('<span className={s.limitLabel}>أقصى منتجات</span>', '<span className={s.limitLabel}>{t("admin.plans.max_products", "أقصى منتجات")}</span>'),
    ('<span className={s.limitLabel}>أقصى كوبونات</span>', '<span className={s.limitLabel}>{t("admin.plans.max_coupons", "أقصى كوبونات")}</span>'),
    ('<div className={s.featuresTitle}>المميزات والخدمات</div>', '<div className={s.featuresTitle}>{t("admin.plans.features", "المميزات والخدمات")}</div>'),
    ('تعديل الخطة', '{t("admin.plans.edit_plan", "تعديل الخطة")}'),

    # Modal forms
    (   '{editingPlan ? `تعديل خطة: ${editingPlan.name}` : \'إنشاء خطة جديدة\'}', 
        '{editingPlan ? `${t("admin.plans.edit_plan_prefix", "تعديل خطة:")} ${editingPlan.name}` : t("admin.plans.create_new", "إنشاء خطة جديدة")}' ),

    ('<label className={s.formLabel}>اسم الخطة</label>', '<label className={s.formLabel}>{t("admin.plans.plan_name", "اسم الخطة")}</label>'),
    ('placeholder="مثال: أساسية، احترافية، مؤسسية"', 'placeholder={t("admin.plans.name_ph", "مثال: أساسية، احترافية، مؤسسية")}'),
    ('<label className={s.formLabel}>الوصف</label>', '<label className={s.formLabel}>{t("admin.plans.desc", "الوصف")}</label>'),
    ('placeholder="وصف مختصر للخطة ومميزاتها"', 'placeholder={t("admin.plans.desc_ph", "وصف مختصر للخطة ومميزاتها")}'),
    ('<label className={s.formLabel}>السعر الشهري (ر.س)</label>', '<label className={s.formLabel}>{t("admin.plans.monthly_price_lbl", "السعر الشهري (ر.س)")}</label>'),
    ('<label className={s.formLabel}>السعر السنوي (ر.س)</label>', '<label className={s.formLabel}>{t("admin.plans.yearly_price_lbl", "السعر السنوي (ر.س)")}</label>'),
    ('<label className={s.formLabel}>نسبة العمولة (0.10 = 10%)</label>', '<label className={s.formLabel}>{t("admin.plans.commission_lbl", "نسبة العمولة (0.10 = 10%)")}</label>'),
    ('<label className={s.formLabel}>الحد الأقصى للمنتجات</label>', '<label className={s.formLabel}>{t("admin.plans.max_products", "الحد الأقصى للمنتجات")}</label>'),
    ('<label className={s.formLabel}>الحد الأقصى للكوبونات</label>', '<label className={s.formLabel}>{t("admin.plans.max_coupons", "الحد الأقصى للكوبونات")}</label>'),
    ('<div className={s.formSectionTitle}>المميزات والخدمات</div>', '<div className={s.formSectionTitle}>{t("admin.plans.features", "المميزات والخدمات")}</div>'),
    ('إلغاء</button>', '{t("common.cancel", "إلغاء")}</button>'),
    ("{editingPlan ? 'تحديث الخطة' : 'إنشاء الخطة'}", "{editingPlan ? t('admin.plans.update_plan', 'تحديث الخطة') : t('admin.plans.create_plan', 'إنشاء الخطة')}"),

]

for old, new in replacements:
    if old not in content:
        print(f"Warning: Could not find '{old}'")
    content = content.replace(old, new)

with codecs.open(filepath, 'w', 'utf-8') as f:
    f.write(content)
print("Done translating AdminPlans.jsx.")
