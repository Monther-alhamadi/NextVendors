import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import ProductGrid from "../components/product/ProductGrid";
import CustomButton from "../components/common/CustomButton";
import { listProducts, listFeaturedProducts, getCategories } from "../services/productService";
import { useToast } from "../components/common/ToastProvider";
import { useTranslation, Trans } from "react-i18next";
import governanceService from "../services/governanceService";
import { getPage } from "../services/cmsService";
import DynamicWidget from "../components/DynamicWidget";
import WidgetRenderer from "../components/cms/WidgetRenderer";

/* ─── Flash-sale countdown hook ───────────────────────────────────── */
function useCountdown(targetMs) {
  const [remaining, setRemaining] = useState(() => Math.max(0, targetMs - Date.now()));

  useEffect(() => {
    const id = setInterval(() => {
      setRemaining(r => Math.max(0, r - 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [targetMs]);

  const h = String(Math.floor(remaining / 3_600_000)).padStart(2, "0");
  const m = String(Math.floor((remaining % 3_600_000) / 60_000)).padStart(2, "0");
  const s = String(Math.floor((remaining % 60_000) / 1_000)).padStart(2, "0");
  return { h, m, s };
}

/* ─── Skeleton card ────────────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div className="card" style={{ overflow: "hidden" }}>
      <div className="skeleton skeleton-img" style={{ height: "200px" }} />
      <div style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <div className="skeleton skeleton-text" style={{ width: "80%" }} />
        <div className="skeleton skeleton-text" style={{ width: "50%" }} />
        <div className="skeleton skeleton-text" style={{ width: "35%", height: "1.4em" }} />
      </div>
    </div>
  );
}

/* ─── Categories loaded from API ─────────────────────────────────────── */
const CATEGORIES = [
  { value: "", icon: "🛍️", label: "الكل" },
  { value: "electronics", icon: "📱", label: "إلكترونيات" },
  { value: "clothing", icon: "👕", label: "ملابس" },
  { value: "home", icon: "🏡", label: "منزل" },
  { value: "beauty", icon: "✨", label: "جمال" },
  { value: "sports", icon: "⚽", label: "رياضة" },
  { value: "books", icon: "📚", label: "كتب" },
  { value: "food", icon: "🍔", label: "طعام" },
  { value: "toys", icon: "🧸", label: "ألعاب" },
];

/* ─── Features ──────────────────────────────────────────────────────── */
const FEATURES = [
  { icon: "🚀", titleKey: "home.features.delivery",     descKey: "home.features.delivery_desc",     default: "توصيل سريع خلال 24 ساعة",        defaultDesc: "نوصل طلبك إلى باب منزلك بأسرع وقت ممكن" },
  { icon: "💎", titleKey: "home.features.quality",      descKey: "home.features.quality_desc",      default: "جودة لا تُضاهى",                 defaultDesc: "كل منتج يمر بفحص دقيق لضمان أعلى معايير الجودة" },
  { icon: "🛡️", titleKey: "home.features.payment",    descKey: "home.features.payment_desc",      default: "دفع آمن ومحمي 100%",               defaultDesc: "بياناتك محمية بأحدث تقنيات التشفير والأمان" },
  { icon: "🔄", titleKey: "home.features.returns",     descKey: "home.features.returns_desc",      default: "إرجاع مجاني خلال 30 يوم",          defaultDesc: "غير راضٍ؟ أعد المنتج مجاناً دون أي أسئلة" },
];

/* ─── Testimonials ──────────────────────────────────────────────────── */
const TESTIMONIALS = [
  { text: "التجربة رائعة! المنتجات أصلية والتوصيل كان أسرع من المتوقع بكثير.", author: "أحمد محمد", role: "عميل منذ 2023", stars: 5, avatar: "أ" },
  { text: "تصاميم جذابة ومنتجات بجودة استثنائية. أنصح به بشدة لكل من يبحث عن الفخامة.", author: "يسرى علي", role: "عميلة مميزة", stars: 5, avatar: "ي" },
  { text: "خدمة عملاء محترفة وسرعة في الرد. تجربة تسوق لا مثيل لها في المنطقة.", author: "خالد عبدالله", role: "عميل دائم", stars: 5, avatar: "خ" },
];

/* ════════════════════════════════════════════════════════════════════════
   LANDING PAGE
   ════════════════════════════════════════════════════════════════════════ */
export default function Landing() {
  const [cmsPage, setCmsPage] = useState(null); // The dynamic page config
  const [featured, setFeatured] = useState([]);
  const [legacyWidgets, setLegacyWidgets] = useState([]);
  const [vendorAds, setVendorAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("");
  const [email, setEmail] = useState("");
  const toast = useToast();
  const { t } = useTranslation();

  // Flash sale ends in ~9 hours from now
  const saleEnd = Date.now() + 9 * 3_600_000;
  const countdown = useCountdown(saleEnd);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);

        // Attempt to load the new CMS configuration for 'home'
        try {
           const pageData = await getPage('home');
           if (pageData && pageData.widgets && pageData.widgets.length > 0) {
              setCmsPage(pageData);
           }
        } catch (cmsErr) {
           console.log("No dynamic CMS configured for 'home', falling back to defaults.");
        }

        // Load necessary data for fallback components
        const [prodData, widgetData, adsData] = await Promise.all([
          listProducts("", 8),
          governanceService.getActiveWidgets().catch(() => []),
          governanceService.getPublicVendorAds().catch(() => [])
        ]);
        setFeatured(Array.isArray(prodData) ? prodData : (prodData?.products || []));
        setLegacyWidgets(Array.isArray(widgetData) ? widgetData : []);
        setVendorAds(Array.isArray(adsData) ? adsData : []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSubscribe = useCallback((e) => {
    e.preventDefault();
    if (!email) return;
    toast.push({ message: t("home.newsletter.success") || "تم الاشتراك بنجاح! 🎉", duration: 3500 });
    setEmail("");
  }, [email, t, toast]);

  // CMS page data is loaded but we always use the premium fallback layout
  // for the landing page. The CMS admin builder is useful for managing
  // widget configurations that could be used for custom vendor storefronts.
  
  return (
    <div>
      {/* ─── PREMIUM HERO ──────────────────────────────────────────────── */}
           <section className="hero-section" aria-label="قسم الترحيب">
        <div className="hero-aurora" aria-hidden="true" />
        <div className="hero-grid" aria-hidden="true" />

        <div className="container">
          <div className="hero-content">
            <div className="hero-badge">
              <span>⚡</span>
              <span>{t("home.hero.badge") || "منصة التسوق الأكثر ثقة"}</span>
            </div>

            <h1 className="hero-title">
              <Trans i18nKey="home.hero.title">
                اكتشف <span className="gradient-text">الفخامة</span>
                {" "}في كل تفصيل
              </Trans>
            </h1>

            <p className="hero-subtitle">
              {t("home.hero.subtitle") || "وجهتك الأولى للمنتجات الحصرية والمميزة. تسوق أحدث الصيحات العالمية بجودة لا تُضاهى وتوصيل يصل إليك في أسرع وقت."}
            </p>

            <div className="hero-actions">
              <Link to="/products?category=new">
                <button className="btn btn-primary btn-lg" style={{ borderRadius: "999px" }}>
                  <span>🛍️</span>
                  {t("home.hero.shop_new") || "تسوق الجديد"}
                </button>
              </Link>
              <Link to="/products">
                <button
                  className="btn btn-lg"
                  style={{
                    borderRadius: "999px",
                    background: "rgba(255,255,255,0.12)",
                    color: "white",
                    border: "1.5px solid rgba(255,255,255,0.3)",
                    backdropFilter: "blur(8px)",
                  }}
                >
                  {t("home.hero.browse_collection") || "تصفح المجموعة"}
                </button>
              </Link>
            </div>

            {/* Trust indicators */}
            <div style={{
              marginTop: "3rem",
              display: "flex",
              gap: "2rem",
              justifyContent: "center",
              flexWrap: "wrap",
              color: "rgba(255,255,255,0.55)",
              fontSize: "var(--text-sm)",
            }}>
              {["🏆 +50,000 عميل راضٍ", "⭐ تقييم 4.9/5", "🚚 توصيل مجاني فوق 200 ر.س"].map(item => (
                <span key={item} style={{ display: "flex", alignItems: "center", gap: "4px" }}>{item}</span>
              ))}
            </div>
          </div>
        </div>
       </section>

      {/* ─── FLASH SALE TICKER ─────────────────────────────────── */}
      <div className="container" style={{ paddingTop: "2rem" }}>
        <div className="flash-sale-banner">
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            <span style={{ fontSize: "var(--text-2xs)", opacity: 0.9, textTransform: "uppercase", letterSpacing: "0.08em" }}>🔥 عرض محدود</span>
            <span style={{ fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: "var(--text-xl)" }}>
              {t("home.flash_sale.title") || "تخفيضات الفلاش — حتى 70% خصم"}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <span style={{ opacity: 0.7, fontSize: "var(--text-sm)" }}>ينتهي خلال:</span>
            <div className="flash-sale-timer">
              {[{ l: "س", v: countdown.h }, { l: "د", v: countdown.m }, { l: "ث", v: countdown.s }].map(({ l, v }) => (
                <div key={l} className="timer-unit">
                  <span className="num">{v}</span>
                  <span className="label">{l}</span>
                </div>
              ))}
            </div>
          </div>

          <Link to="/products?sale=true">
            <button className="btn btn-sm" style={{
              background: "rgba(0,0,0,0.25)",
              color: "white",
              border: "1.5px solid rgba(255,255,255,0.4)",
              borderRadius: "999px",
              backdropFilter: "blur(6px)",
            }}>
              تسوق الآن →
            </button>
          </Link>
        </div>
      </div>

      {/* ─── GLOBAL VENDOR ADS ─────────────────────────────────── */}
      {vendorAds && vendorAds.length > 0 && (
        <section style={{ padding: "2rem 0 1rem" }}>
          <div className="container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {vendorAds.map(ad => (
              <a key={ad.id} href={ad.target_url} target="_blank" rel="noreferrer" style={{ display: 'block', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.08)', transition: 'transform 0.2s', background: '#f8fafc', position: 'relative' }}>
                 <div style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(0,0,0,0.5)', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', backdropFilter: 'blur(2px)' }}>إعلان ممول</div>
                 <img src={ad.image_url} alt="Vendor Advertisement" style={{ width: '100%', height: '200px', objectFit: 'cover', display: 'block' }} onError={(e) => { e.target.style.display='none'; }} />
              </a>
            ))}
          </div>
        </section>
      )}

      {/* ─── LEGACY DYNAMIC WIDGETS (CMS-controlled banners) ──────────── */}
      {legacyWidgets.length > 0 && (
        <section style={{ padding: "0 0 1rem" }}>
          <div className="container">
            {legacyWidgets.map(w => (
              <DynamicWidget key={w.id} widget={w} />
            ))}
          </div>
        </section>
      )}

      {/* ─── CATEGORIES SCROLL ─────────────────────────────────── */}
      <section className="container" style={{ paddingTop: "2rem", paddingBottom: "0.5rem" }}>
        <div className="section-header" style={{ marginBottom: "1.25rem" }}>
          <div>
            <div className="section-eyebrow">{t("home.categories.eyebrow") || "اكتشف"}</div>
            <h2 className="section-title">{t("home.categories.title") || "تسوق حسب الفئة"}</h2>
          </div>
        </div>

        <div className="categories-scroll">
          {CATEGORIES.map(cat => (
            <Link
              key={cat.value}
              to={cat.value ? `/products?category=${cat.value}` : "/products"}
              className={`category-chip ${activeCategory === cat.value ? "active" : ""}`}
              onClick={() => setActiveCategory(cat.value)}
            >
              <div className="cat-icon">{cat.icon}</div>
              <span style={{ fontSize: "var(--text-xs)", fontWeight: 600 }}>{cat.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ─── FEATURED PRODUCTS ─────────────────────────────────── */}
      <section className="container section-pad">
        <div className="section-header">
          <div>
            <div className="section-eyebrow">{t("home.trending.eyebrow") || "رائج الآن"}</div>
            <h2 className="section-title">{t("home.trending.title") || "أبرز المنتجات"}</h2>
            <p className="section-subtitle">{t("home.trending.subtitle") || "اختيارات مميزة لك بأفضل الأسعار"}</p>
          </div>
          <Link to="/products" style={{
            color: "var(--primary)",
            fontWeight: 700,
            fontSize: "var(--text-sm)",
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            whiteSpace: "nowrap",
          }}>
            {t("home.trending.view_all") || "عرض الكل"} →
          </Link>
        </div>

        {loading ? (
          <div className="product-grid">
            {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : (
          <ProductGrid products={featured} />
        )}
      </section>

      {/* ─── FEATURES STRIP ────────────────────────────────────── */}
      <section style={{ background: "var(--bg-card)", borderTop: "1px solid var(--border-light)", borderBottom: "1px solid var(--border-light)" }}>
        <div className="container" style={{ paddingBlock: "3rem" }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "2rem",
          }}>
            {FEATURES.map(f => (
              <div key={f.icon} style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                <div style={{
                  width: 52, height: 52, flexShrink: 0,
                  background: "var(--primary-subtle)",
                  borderRadius: "var(--radius-lg)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "1.5rem",
                }}>
                  {f.icon}
                </div>
                <div>
                  <h4 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: "var(--text-base)", color: "var(--text-primary)", marginBottom: "4px" }}>
                    {t(f.titleKey) || f.default}
                  </h4>
                  <p style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)", lineHeight: 1.5 }}>
                    {t(f.descKey) || f.defaultDesc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ──────────────────────────────────────── */}
      <section style={{ background: "var(--bg-surface)" }} className="section-pad">
        <div className="container">
          <div className="section-header">
            <div>
              <div className="section-eyebrow">{t("home.testimonials.eyebrow") || "آراء عملائنا"}</div>
              <h2 className="section-title">{t("home.testimonials.title") || "يثقون بنا"}</h2>
            </div>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "1.5rem",
          }}>
            {TESTIMONIALS.map((item, idx) => (
              <div
                key={idx}
                className="card"
                style={{ padding: "1.75rem", display: "flex", flexDirection: "column", gap: "1rem" }}
              >
                {/* Stars */}
                <div style={{ color: "#fbbf24", letterSpacing: "2px", fontSize: "1rem" }}>
                  {"★".repeat(item.stars)}
                </div>
                {/* Quote */}
                <p style={{
                  fontStyle: "italic",
                  color: "var(--text-secondary)",
                  lineHeight: 1.7,
                  fontSize: "var(--text-base)",
                  flex: 1,
                }}>
                  "{item.text}"
                </p>
                {/* Author */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: "50%",
                    background: "linear-gradient(135deg, var(--primary), var(--secondary))",
                    color: "white",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: "var(--font-heading)", fontWeight: 800,
                    fontSize: "var(--text-lg)",
                  }}>
                    {item.avatar}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "var(--text-sm)", color: "var(--text-primary)" }}>{item.author}</div>
                    <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>{item.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── NEWSLETTER (Always shown at bottom) ───────────────── */}
      <section style={{
        background: "linear-gradient(135deg, #0a0d2e 0%, #150d4a 50%, #0f1030 100%)",
        position: "relative",
        overflow: "hidden",
      }} className="section-pad">
        {/* Background decoration */}
        <div aria-hidden style={{
          position: "absolute",
          top: "-50%", right: "-20%",
          width: "600px", height: "600px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)",
          filter: "blur(60px)",
        }} />

        <div className="container" style={{ position: "relative", zIndex: 1 }}>
          <div style={{ maxWidth: "560px", margin: "0 auto", textAlign: "center" }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              background: "rgba(99,102,241,0.15)",
              border: "1px solid rgba(99,102,241,0.35)",
              borderRadius: "999px",
              padding: "8px 20px",
              color: "var(--clr-indigo-200, #c7d2fe)",
              fontSize: "var(--text-sm)", fontWeight: 600,
              marginBottom: "1.5rem",
            }}>
              📬 {t("home.newsletter.eyebrow") || "النشرة الإخبارية"}
            </div>

            <h2 style={{
              fontFamily: "var(--font-heading)",
              fontSize: "clamp(1.5rem, 4vw, 2.5rem)",
              fontWeight: 900,
              color: "white",
              letterSpacing: "-0.03em",
              lineHeight: 1.2,
              marginBottom: "1rem",
            }}>
              {t("home.newsletter.title") || "احصل على أفضل العروض أولاً"}
            </h2>

            <p style={{
              color: "rgba(255,255,255,0.65)",
              fontSize: "var(--text-base)",
              lineHeight: 1.7,
              marginBottom: "2rem",
            }}>
              {t("home.newsletter.desc") || "اشترك ليصلك إشعار فوري بكل العروض الحصرية والمنتجات الجديدة قبل الجميع."}
            </p>

            <form
              onSubmit={handleSubscribe}
              style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", justifyContent: "center" }}
            >
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder={t("home.newsletter.placeholder") || "بريدك الإلكتروني ..."}
                required
                style={{
                  flex: "1 1 240px",
                  padding: "0.875rem 1.5rem",
                  borderRadius: "999px",
                  background: "rgba(255,255,255,0.10)",
                  backdropFilter: "blur(8px)",
                  color: "white",
                  fontSize: "var(--text-base)",
                  outline: "none",
                  border: "1px solid rgba(255,255,255,0.2)",
                }}
              />
              <button
                type="submit"
                className="btn btn-primary"
                style={{ borderRadius: "999px", whiteSpace: "nowrap" }}
              >
                {t("home.newsletter.subscribe") || "اشترك مجاناً"}
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
