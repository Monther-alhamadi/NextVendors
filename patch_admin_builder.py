import codecs

filepath = r"c:\Users\hp\Desktop\projet2\ecommerce-store\frontend\src\pages\AdminStoreBuilder.jsx"

with codecs.open(filepath, 'r', 'utf-8') as f:
    content = f.read()


content = content.replace(
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
)

content = content.replace(
'''مكون
              </span>''',
'''{t("admin.builder.widget_word", "مكون")}
              </span>'''
)

with codecs.open(filepath, 'w', 'utf-8') as f:
    f.write(content)
print("Done filling remaining 2 pieces in AdminStoreBuilder.jsx")
