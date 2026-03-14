import codecs

filepath = r"c:\Users\hp\Desktop\projet2\ecommerce-store\frontend\src\components\cms\DynamicBanners.jsx"

with codecs.open(filepath, 'r', 'utf-8') as f:
    content = f.read()

content = content.replace(
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
)

content = content.replace(
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
)

content = content.replace(
'''<h2>{editingBanner ? "تعديل البانر" : "إنشاء بانر جديد"}</h2>''',
'''<h2>{editingBanner ? t("admin.banners.edit_banner", "تعديل البانر") : t("admin.banners.create_new", "إنشاء بانر جديد")}</h2>'''
)

with codecs.open(filepath, 'w', 'utf-8') as f:
    f.write(content)
print("Done patching DynamicBanners.jsx")
