import codecs

filepath = r"c:\Users\hp\Desktop\projet2\ecommerce-store\frontend\src\pages\AdminPlans.jsx"

with codecs.open(filepath, 'r', 'utf-8') as f:
    content = f.read()

content = content.replace(
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
)

content = content.replace(
'''{editingPlan ? `تعديل خطة: ${editingPlan.name}` : 'إنشاء خطة جديدة'}''',
'''{editingPlan ? `${t("admin.plans.edit_plan_prefix", "تعديل خطة:")} ${editingPlan.name}` : t("admin.plans.create_new", "إنشاء خطة جديدة")}'''
)

with codecs.open(filepath, 'w', 'utf-8') as f:
    f.write(content)
print("Done patching AdminPlans.jsx")
