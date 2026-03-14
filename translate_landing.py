import codecs
import re

filepath = r"c:\Users\hp\Desktop\projet2\ecommerce-store\frontend\src\pages\Landing.jsx"

with codecs.open(filepath, 'r', 'utf-8') as f:
    content = f.read()

# 1. Replace CATEGORIES and TESTIMONIALS with getter functions
content = content.replace('const CATEGORIES = [', 'const getCategoriesList = (t) => [')
content = content.replace(
'''  { value: "", icon: "🛍️", label: "الكل" },
  { value: "electronics", icon: "📱", label: "إلكترونيات" },
  { value: "clothing", icon: "👕", label: "ملابس" },
  { value: "home", icon: "🏡", label: "منزل" },
  { value: "beauty", icon: "✨", label: "جمال" },
  { value: "sports", icon: "⚽", label: "رياضة" },
  { value: "books", icon: "📚", label: "كتب" },
  { value: "food", icon: "🍔", label: "طعام" },
  { value: "toys", icon: "🧸", label: "ألعاب" },''',
'''  { value: "", icon: "🛍️", label: t("common.all", "الكل") },
  { value: "electronics", icon: "📱", label: t("home.categories.electronics", "إلكترونيات") },
  { value: "clothing", icon: "👕", label: t("home.categories.clothing", "ملابس") },
  { value: "home", icon: "🏡", label: t("home.categories.home", "منزل") },
  { value: "beauty", icon: "✨", label: t("home.categories.beauty", "جمال") },
  { value: "sports", icon: "⚽", label: t("home.categories.sports", "رياضة") },
  { value: "books", icon: "📚", label: t("home.categories.books", "كتب") },
  { value: "food", icon: "🍔", label: t("home.categories.food", "طعام") },
  { value: "toys", icon: "🧸", label: t("home.categories.toys", "ألعاب") },'''
)

content = content.replace('CATEGORIES.map(', 'getCategoriesList(t).map(')

content = content.replace('const TESTIMONIALS = [', 'const getTestimonials = (t) => [')
content = content.replace(
'''  { text: "التجربة رائعة! المنتجات أصلية والتوصيل كان أسرع من المتوقع بكثير.", author: "أحمد محمد", role: "عميل منذ 2023", stars: 5, avatar: "أ" },
  { text: "تصاميم جذابة ومنتجات بجودة استثنائية. أنصح به بشدة لكل من يبحث عن الفخامة.", author: "يسرى علي", role: "عميلة مميزة", stars: 5, avatar: "ي" },
  { text: "خدمة عملاء محترفة وسرعة في الرد. تجربة تسوق لا مثيل لها في المنطقة.", author: "خالد عبدالله", role: "عميل دائم", stars: 5, avatar: "خ" },''',
'''  { text: t("home.testimonials.t1_text", "التجربة رائعة! المنتجات أصلية والتوصيل كان أسرع من المتوقع بكثير."), author: t("home.testimonials.t1_author", "أحمد محمد"), role: t("home.testimonials.t1_role", "عميل منذ 2023"), stars: 5, avatar: "أ" },
  { text: t("home.testimonials.t2_text", "تصاميم جذابة ومنتجات بجودة استثنائية. أنصح به بشدة لكل من يبحث عن الفخامة."), author: t("home.testimonials.t2_author", "يسرى علي"), role: t("home.testimonials.t2_role", "عميلة مميزة"), stars: 5, avatar: "ي" },
  { text: t("home.testimonials.t3_text", "خدمة عملاء محترفة وسرعة في الرد. تجربة تسوق لا مثيل لها في المنطقة."), author: t("home.testimonials.t3_author", "خالد عبدالله"), role: t("home.testimonials.t3_role", "عميل دائم"), stars: 5, avatar: "خ" },'''
)

content = content.replace('TESTIMONIALS.map(', 'getTestimonials(t).map(')

# Timer array 
content = content.replace(
'''{[{ l: "س", v: countdown.h }, { l: "د", v: countdown.m }, { l: "ث", v: countdown.s }]''',
'''{[{ l: t("home.time.h", "س"), v: countdown.h }, { l: t("home.time.m", "د"), v: countdown.m }, { l: t("home.time.s", "ث"), v: countdown.s }]'''
)

# Trust indicators array
content = content.replace(
'''{["🏆 +50,000 عميل راضٍ", "⭐ تقييم 4.9/5", "🚚 توصيل مجاني فوق 200 ر.س"].map(item => (''',
'''{[t("home.trust.1", "🏆 +50,000 عميل راضٍ"), t("home.trust.2", "⭐ تقييم 4.9/5"), t("home.trust.3", "🚚 توصيل مجاني فوق 200 ر.س")].map(item => ('''
)

# Various direct replacements
replacements = [
    # Fixed `||` fallbacks
    ('t("home.newsletter.success") || "تم الاشتراك بنجاح! 🎉"', 't("home.newsletter.success", "تم الاشتراك بنجاح! 🎉")'),
    ('{t("home.hero.badge") || "منصة التسوق الأكثر ثقة"}', '{t("home.hero.badge", "منصة التسوق الأكثر ثقة")}'),
    ('{t("home.hero.subtitle") || "وجهتك الأولى للمنتجات الحصرية والمميزة. تسوق أحدث الصيحات العالمية بجودة لا تُضاهى وتوصيل يصل إليك في أسرع وقت."}', '{t("home.hero.subtitle", "وجهتك الأولى للمنتجات الحصرية والمميزة. تسوق أحدث الصيحات العالمية بجودة لا تُضاهى وتوصيل يصل إليك في أسرع وقت.")}'),
    ('{t("home.hero.shop_new") || "تسوق الجديد"}', '{t("home.hero.shop_new", "تسوق الجديد")}'),
    ('{t("home.hero.browse_collection") || "تصفح المجموعة"}', '{t("home.hero.browse_collection", "تصفح المجموعة")}'),
    ('{t("home.flash_sale.title") || "تخفيضات الفلاش — حتى 70% خصم"}', '{t("home.flash_sale.title", "تخفيضات الفلاش — حتى 70% خصم")}'),
    ('{t("home.categories.eyebrow") || "اكتشف"}', '{t("home.categories.eyebrow", "اكتشف")}'),
    ('{t("home.categories.title") || "تسوق حسب الفئة"}', '{t("home.categories.title", "تسوق حسب الفئة")}'),
    ('{t("home.trending.eyebrow") || "رائج الآن"}', '{t("home.trending.eyebrow", "رائج الآن")}'),
    ('{t("home.trending.title") || "أبرز المنتجات"}', '{t("home.trending.title", "أبرز المنتجات")}'),
    ('{t("home.trending.subtitle") || "اختيارات مميزة لك بأفضل الأسعار"}', '{t("home.trending.subtitle", "اختيارات مميزة لك بأفضل الأسعار")}'),
    ('{t("home.trending.view_all") || "عرض الكل"}', '{t("home.trending.view_all", "عرض الكل")}'),
    ('{t("home.testimonials.eyebrow") || "آراء عملائنا"}', '{t("home.testimonials.eyebrow", "آراء عملائنا")}'),
    ('{t("home.testimonials.title") || "يثقون بنا"}', '{t("home.testimonials.title", "يثقون بنا")}'),
    ('{t("home.newsletter.eyebrow") || "النشرة الإخبارية"}', '{t("home.newsletter.eyebrow", "النشرة الإخبارية")}'),
    ('{t("home.newsletter.title") || "احصل على أفضل العروض أولاً"}', '{t("home.newsletter.title", "احصل على أفضل العروض أولاً")}'),
    ('{t("home.newsletter.desc") || "اشترك ليصلك إشعار فوري بكل العروض الحصرية والمنتجات الجديدة قبل الجميع."}', '{t("home.newsletter.desc", "اشترك ليصلك إشعار فوري بكل العروض الحصرية والمنتجات الجديدة قبل الجميع.")}'),
    ('{t("home.newsletter.placeholder") || "بريدك الإلكتروني ..."}', '{t("home.newsletter.placeholder", "بريدك الإلكتروني ...")}'),
    ('{t("home.newsletter.subscribe") || "اشترك مجاناً"}', '{t("home.newsletter.subscribe", "اشترك مجاناً")}'),

    # Other hardcoded strings
    ('اكتشف <span className="gradient-text">الفخامة</span>\n                {" "}في كل تفصيل', '{t("home.hero.discover", "اكتشف")} <span className="gradient-text">{t("home.hero.luxury", "الفخامة")}</span>\n                {" "}{t("home.hero.in_every_detail", "في كل تفصيل")}'),
    ("اكتشف <span className=\"gradient-text\">الفخامة</span>", "{t(\"home.hero.discover\", \"اكتشف\")} <span className=\"gradient-text\">{t(\"home.hero.luxury\", \"الفخامة\")}</span>"),
    ('{" "}في كل تفصيل', '{" "}{t("home.hero.in_every_detail", "في كل تفصيل")}'),
    ('<span style={{ fontSize: "var(--text-2xs)", opacity: 0.9, textTransform: "uppercase", letterSpacing: "0.08em" }}>🔥 عرض محدود</span>', '<span style={{ fontSize: "var(--text-2xs)", opacity: 0.9, textTransform: "uppercase", letterSpacing: "0.08em" }}>🔥 {t("home.flash_sale.limited_offer", "عرض محدود")}</span>'),
    ('<span style={{ opacity: 0.7, fontSize: "var(--text-sm)" }}>ينتهي خلال:</span>', '<span style={{ opacity: 0.7, fontSize: "var(--text-sm)" }}>{t("home.flash_sale.ends_in", "ينتهي خلال:")}</span>'),
    ('تسوق الآن →', '{t("home.flash_sale.shop_now", "تسوق الآن")} →'),
    ('>إعلان ممول</div>', '>{t("home.sponsored_ad", "إعلان ممول")}</div>'),

    # FEATURES loop
    ('{t(f.titleKey) || f.default}', '{t(f.titleKey, f.default)}'),
    ('{t(f.descKey) || f.defaultDesc}', '{t(f.descKey, f.defaultDesc)}'),
]

for old, new in replacements:
    if old not in content:
        print(f"Warning: Could not find '{old}'")
    content = content.replace(old, new)

with codecs.open(filepath, 'w', 'utf-8') as f:
    f.write(content)
print("Done translating Landing.jsx.")
