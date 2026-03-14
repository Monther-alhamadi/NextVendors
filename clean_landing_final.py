import codecs

filepath = r"c:\Users\hp\Desktop\projet2\ecommerce-store\frontend\src\pages\Landing.jsx"

with codecs.open(filepath, 'r', 'utf-8') as f:
    content = f.read()

# Fix categories
content = content.replace(
'''const getCategoriesList = (t) => [
  { value: "", icon: "🛍️", label: "الكل" },
  { value: "electronics", icon: "📱", label: "إلكترونيات" },
  { value: "clothing", icon: "👕", label: "ملابس" },
  { value: "home", icon: "🏡", label: "منزل" },
  { value: "beauty", icon: "✨", label: "جمال" },
  { value: "sports", icon: "⚽", label: "رياضة" },
  { value: "books", icon: "📚", label: "كتب" },
  { value: "food", icon: "🍔", label: "طعام" },
  { value: "toys", icon: "🧸", label: "ألعاب" },
];''',
'''const getCategoriesList = (t) => [
  { value: "", icon: "🛍️", label: t("common.all", "الكل") },
  { value: "electronics", icon: "📱", label: t("home.categories.electronics", "إلكترونيات") },
  { value: "clothing", icon: "👕", label: t("home.categories.clothing", "ملابس") },
  { value: "home", icon: "🏡", label: t("home.categories.home", "منزل") },
  { value: "beauty", icon: "✨", label: t("home.categories.beauty", "جمال") },
  { value: "sports", icon: "⚽", label: t("home.categories.sports", "رياضة") },
  { value: "books", icon: "📚", label: t("home.categories.books", "كتب") },
  { value: "food", icon: "🍔", label: t("home.categories.food", "طعام") },
  { value: "toys", icon: "🧸", label: t("home.categories.toys", "ألعاب") },
];'''
)

# Fix features
content = content.replace(
'''const FEATURES = [
  { icon: "🚀", titleKey: "home.features.delivery",     descKey: "home.features.delivery_desc",     default: "توصيل سريع خلال 24 ساعة",        defaultDesc: "نوصل طلبك إلى باب منزلك بأسرع وقت ممكن" },
  { icon: "💎", titleKey: "home.features.quality",      descKey: "home.features.quality_desc",      default: "جودة لا تُضاهى",                 defaultDesc: "كل منتج يمر بفحص دقيق لضمان أعلى معايير الجودة" },
  { icon: "🛡️", titleKey: "home.features.payment",    descKey: "home.features.payment_desc",      default: "دفع آمن ومحمي 100%",               defaultDesc: "بياناتك محمية بأحدث تقنيات التشفير والأمان" },
  { icon: "🔄", titleKey: "home.features.returns",     descKey: "home.features.returns_desc",      default: "إرجاع مجاني خلال 30 يوم",          defaultDesc: "غير راضٍ؟ أعد المنتج مجاناً دون أي أسئلة" },
];''',
'''const getFeaturesList = (t) => [
  { icon: "🚀", titleKey: "home.features.delivery",     descKey: "home.features.delivery_desc",     default: t("home.features.delivery", "توصيل سريع خلال 24 ساعة"),        defaultDesc: t("home.features.delivery_desc", "نوصل طلبك إلى باب منزلك بأسرع وقت ممكن") },
  { icon: "💎", titleKey: "home.features.quality",      descKey: "home.features.quality_desc",      default: t("home.features.quality", "جودة لا تُضاهى"),                 defaultDesc: t("home.features.quality_desc", "كل منتج يمر بفحص دقيق لضمان أعلى معايير الجودة") },
  { icon: "🛡️", titleKey: "home.features.payment",    descKey: "home.features.payment_desc",      default: t("home.features.payment", "دفع آمن ومحمي 100%"),               defaultDesc: t("home.features.payment_desc", "بياناتك محمية بأحدث تقنيات التشفير والأمان") },
  { icon: "🔄", titleKey: "home.features.returns",     descKey: "home.features.returns_desc",      default: t("home.features.returns", "إرجاع مجاني خلال 30 يوم"),          defaultDesc: t("home.features.returns_desc", "غير راضٍ؟ أعد المنتج مجاناً دون أي أسئلة") },
];'''
)

content = content.replace('FEATURES.map(', 'getFeaturesList(t).map(')

# Fix testimonials
content = content.replace(
'''const getTestimonials = (t) => [
  { text: "التجربة رائعة! المنتجات أصلية والتوصيل كان أسرع من المتوقع بكثير.", author: "أحمد محمد", role: "عميل منذ 2023", stars: 5, avatar: "أ" },
  { text: "تصاميم جذابة ومنتجات بجودة استثنائية. أنصح به بشدة لكل من يبحث عن الفخامة.", author: "يسرى علي", role: "عميلة مميزة", stars: 5, avatar: "ي" },
  { text: "خدمة عملاء محترفة وسرعة في الرد. تجربة تسوق لا مثيل لها في المنطقة.", author: "خالد عبدالله", role: "عميل دائم", stars: 5, avatar: "خ" },
];''',
'''const getTestimonials = (t) => [
  { text: t("home.testimonials.t1_text", "التجربة رائعة! المنتجات أصلية والتوصيل كان أسرع من المتوقع بكثير."), author: t("home.testimonials.t1_author", "أحمد محمد"), role: t("home.testimonials.t1_role", "عميل منذ 2023"), stars: 5, avatar: "أ" },
  { text: t("home.testimonials.t2_text", "تصاميم جذابة ومنتجات بجودة استثنائية. أنصح به بشدة لكل من يبحث عن الفخامة."), author: t("home.testimonials.t2_author", "يسرى علي"), role: t("home.testimonials.t2_role", "عميلة مميزة"), stars: 5, avatar: "ي" },
  { text: t("home.testimonials.t3_text", "خدمة عملاء محترفة وسرعة في الرد. تجربة تسوق لا مثيل لها في المنطقة."), author: t("home.testimonials.t3_author", "خالد عبدالله"), role: t("home.testimonials.t3_role", "عميل دائم"), stars: 5, avatar: "خ" },
];'''
)

# Fix aria label
content = content.replace('<section className="hero-section" aria-label="قسم الترحيب">', '<section className="hero-section" aria-label={t("home.hero.aria_label", "قسم الترحيب")}>')

with codecs.open(filepath, 'w', 'utf-8') as f:
    f.write(content)

print("Landing page patched completely.")
