import codecs

filepath = r"c:\Users\hp\Desktop\projet2\ecommerce-store\frontend\src\components\cms\CategoryShowcase.jsx"

with codecs.open(filepath, 'r', 'utf-8') as f:
    content = f.read()

content = content.replace(
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
];""")

content = content.replace(
"""const PAGE_OPTIONS = [
  { value: "home", label: "الصفحة الرئيسية" },
  { value: "products", label: "صفحة المنتجات" },
  { value: "all", label: "جميع الصفحات" },
];""",
"""const getPageOptions = (t) => [
  { value: "home", label: t("admin.showcase.page_home", "الصفحة الرئيسية") },
  { value: "products", label: t("admin.showcase.page_products", "صفحة المنتجات") },
  { value: "all", label: t("common.all_pages", "جميع الصفحات") },
];""")

content = content.replace(
"""const DEVICE_OPTIONS = [
  { value: "all", label: "الكل" },
  { value: "desktop", label: "سطح المكتب" },
  { value: "mobile", label: "الجوال" },
];""",
"""const getDeviceOptions = (t) => [
  { value: "all", label: t("common.all", "الكل") },
  { value: "desktop", label: t("common.desktop", "سطح المكتب") },
  { value: "mobile", label: t("common.mobile", "الجوال") },
];""")

content = content.replace(
'<h2>{editingWidget ? "تعديل الودجت" : "إضافة ودجت جديد"}</h2>',
'<h2>{editingWidget ? t("admin.showcase.edit_widget", "تعديل الودجت") : t("admin.showcase.new_widget", "إضافة ودجت جديد")}</h2>'
)

with codecs.open(filepath, 'w', 'utf-8') as f:
    f.write(content)
print("Done patching CategoryShowcase.jsx")
