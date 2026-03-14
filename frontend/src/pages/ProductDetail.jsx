import React, { useEffect, useState, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getProduct } from "../services/productService";
import ProductReviews from "./ProductReviews";
import OptimizedImage from "../components/OptimizedImage";
import PageContainer from "../components/PageContainer";
import cartStore from "../store/cartStore";
import { useToast } from "../components/common/ToastProvider";
import { useAuth } from "../store/authStore";
import { startChat } from "../services/messagingService";
import ChatWindow from "../components/chat/ChatWindow";
import useCompareStore from "../store/compareStore";
import useRecentStore from "../store/recentStore";
import ShareModal from "../components/common/ShareModal";
import RecentlyViewed from "../components/product/RecentlyViewed";
import { getLocalizedField } from "../utils/localization";
import { formatPrice } from "../utils/format";
import s from "./ProductDetail.module.css";

export default function ProductDetail() {
  const { id } = useParams();
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [activeTab, setActiveTab] = useState("desc");
  const [chatOpen, setChatOpen] = useState(false);
  const [convId, setConvId] = useState(null);
  const [shareOpen, setShareOpen] = useState(false);

  const { items: compareItems, toggleItem: toggleCompare } = useCompareStore();
  const addViewedProduct = useRecentStore((s) => s.addViewedProduct);
  const isCompared = product && compareItems.some((i) => i.id === product.id);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setActiveImage(0);
    setQty(1);
    (async () => {
      try {
        const data = await getProduct(id);
        if (mounted) setProduct(data);
      } catch {
        if (mounted) setProduct(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [id]);

  useEffect(() => {
    if (product) {
      addViewedProduct(product);
    }
  }, [product, addViewedProduct]);

  // ── Images ──
  const images = product
    ? (product.images || [])
        .map((img) => (typeof img === "string" ? img : img?.url || "/placeholder.png"))
        .filter(Boolean)
    : [];
  if (product && images.length === 0) images.push("/placeholder.png");

  // ── Gallery navigation ──
  const prevImage = useCallback(() => {
    setActiveImage((i) => (i === 0 ? images.length - 1 : i - 1));
  }, [images.length]);

  const nextImage = useCallback(() => {
    setActiveImage((i) => (i === images.length - 1 ? 0 : i + 1));
  }, [images.length]);

  // ── Add to cart & Buy Now ──
  function addToCart() {
    cartStore.addItem(product, qty);
    toast.push({ message: t("product.added_to_cart", "تمت إضافة المنتج إلى السلة"), duration: 3000 });
  }

  function buyNow() {
    cartStore.addItem(product, qty);
    navigate("/checkout");
  }

  function handleCompare() {
    const res = toggleCompare(product);
    if (res.error) {
      toast.push({ message: res.error, duration: 2500 });
    } else {
      toast.push({ 
        message: res.added ? t("compare.added", "تمت إضافته للمقارنة") : t("compare.removed", "تمت إزالته من المقارنة"), 
        duration: 2000 
      });
    }
  }

  // ── Chat with vendor ──
  async function handleStartChat() {
    if (!user) {
      toast.push({ message: t("nav.login_required", "يجب تسجيل الدخول أولاً"), type: "error" });
      navigate("/login");
      return;
    }
    try {
      const conv = await startChat(product.supplier_id);
      setConvId(conv.id);
      setChatOpen(true);
    } catch {
      toast.push({ message: t("common.error", "حدث خطأ ما"), type: "error" });
    }
  }

  // ── Hybrid Commerce (WhatsApp) ──
  async function handleWhatsAppOrder(info) {
    if (!info.whatsapp_number) {
        toast.push({ message: t("vendor.no_whatsapp", "لا يتوفر رقم واتساب لهذا البائع"), type: "error" });
        return;
    }
    if (!user) {
        toast.push({ message: t("nav.login_required", "يجب تسجيل الدخول لإتمام الطلب"), type: "error" });
        navigate("/login");
        return;
    }

    toast.push({ message: t("vendor.reserving_stock", "جاري حجز المخزون وتحويلك..."), duration: 2500 });
    
    try {
        const { createHybridOrder } = await import("../services/orderService");
        const orderRes = await createHybridOrder({
            product_id: product.id,
            supplier_id: info.supplier_id,
            quantity: qty,
            price: price
        });

        // Redirect to WhatsApp
        const msg = t('product.whatsapp_msg', 'مرحباً، أود إتمام شراء المنتج: {{name}} (الكمية: {{qty}}). رقم الطلب المرجعي: #{{orderId}}', { 
          name: getLocalizedField(product, "name", i18n.language), 
          qty, 
          orderId: orderRes.order_id 
        });
        const url = `https://wa.me/${info.whatsapp_number.replace(/\D/g, "")}?text=${encodeURIComponent(msg)}`;
        window.open(url, "_blank");
    } catch (e) {
        console.error("Hybrid order error", e);
        toast.push({ message: e.response?.data?.detail || t("common.error"), type: "error" });
    }
  }

  // ── Render helpers ──
  function renderStars(rating) {
    const full = Math.floor(rating || 0);
    const empty = 5 - full;
    return "★".repeat(full) + "☆".repeat(empty);
  }

  // ── Loading state ──
  if (loading) {
    return (
      <div className={s.loadingPage}>
        <div className={s.spinner} />
        <span>{t("common.loading", "جارٍ التحميل...")}</span>
      </div>
    );
  }

  // ── Error state ──
  if (!product) {
    return (
      <div className={s.errorPage}>
        <div className={s.errorIcon}>⚠️</div>
        <span>{t("common.error", "عذراً، لم يتم العثور على المنتج")}</span>
        <Link to="/products" className={s.backLink}>
          ← {t("products.browse_title", "تصفح كافة المنتجات")}
        </Link>
      </div>
    );
  }

  const price = typeof product.price === "number" ? product.price : parseFloat(product.price) || 0;
  const oldPrice = product.old_price || product.original_price || null;
  const discount = oldPrice && oldPrice > price ? Math.round(((oldPrice - price) / oldPrice) * 100) : null;
  const vendorName = product.supplier_name || product.store_name || null;
  const stockQty = product.inventory ?? 0;
  const directOrderInfo = (product?.supplier_products || []).find(sp => sp.allow_direct_orders);

  return (
    <div className={s.page}>
      <PageContainer>
        {/* ── Breadcrumb ── */}
        <nav className={s.breadcrumb} aria-label="breadcrumb">
          <Link to="/">{t("nav.home", "الرئيسية")}</Link>
          <span className={s.breadcrumbSep}>/</span>
          <Link to="/products">{t("nav.products", "المنتجات")}</Link>
          <span className={s.breadcrumbSep}>/</span>
          <span className={s.breadcrumbCurrent}>{getLocalizedField(product, "name", i18n.language)}</span>
        </nav>

        {/* ── Main grid ── */}
        <div className={s.grid}>
          {/* ══ Gallery ══ */}
          <div className={s.gallery}>
            <div className={s.mainImage}>
              <div className={s.galleryBadges}>
                {product.sale && <span className={s.badgeSale}>{t("product.sale", "خصم")}</span>}
                {(product.is_new || (Array.isArray(product.tags) && product.tags.includes("new"))) && (
                  <span className={s.badgeNew}>{t("product.new", "جديد")}</span>
                )}
              </div>

              <OptimizedImage
                src={images[activeImage]}
                alt={getLocalizedField(product, "name", i18n.language)}
              />

              {images.length > 1 && (
                <span className={s.imageCounter}>
                  {activeImage + 1} / {images.length}
                </span>
              )}

              {images.length > 1 && (
                <>
                  <button className={s.galleryNavPrev} onClick={prevImage} aria-label="Previous image">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M15 18l-6-6 6-6" /></svg>
                  </button>
                  <button className={s.galleryNavNext} onClick={nextImage} aria-label="Next image">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6" /></svg>
                  </button>
                </>
              )}
            </div>

            {images.length > 1 && (
              <div className={s.thumbStrip}>
                {images.map((src, i) => (
                  <button
                    key={i}
                    className={activeImage === i ? s.thumbActive : s.thumb}
                    onClick={() => setActiveImage(i)}
                    aria-label={`View image ${i + 1}`}
                  >
                    <OptimizedImage src={src} alt="" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ══ Info section ══ */}
          <div className={s.info}>
            {product.category && (
              <Link to={`/products?category=${encodeURIComponent(product.category)}`} className={s.category}>
                {getLocalizedField(product, "category", i18n.language)}
              </Link>
            )}

            <h1 className={s.title}>{getLocalizedField(product, "name", i18n.language)}</h1>
            
            {(product.rating || product.reviews_count >= 0) && (
              <div className={s.rating}>
                <span className={s.stars}>{renderStars(product.rating)}</span>
                <span className={s.ratingCount}>({product.reviews_count || 0})</span>
              </div>
            )}

            <div className={s.priceGroup}>
              <span className={s.price}>{formatPrice(price)}</span>
              {discount && <span className={s.oldPrice}>{formatPrice(oldPrice)}</span>}
              {discount && <span className={s.discount}>-{discount}%</span>}
            </div>

            {vendorName && (
              <div className={s.vendor}>
                {t("product.sold_by", "بواسطة:")}{" "}
                <Link to={`/vendor/${product.supplier_id}`} className={s.vendorLink}>
                  {vendorName}
                </Link>
              </div>
            )}

            <div className={s.qtySelector}>
              <label htmlFor="qty">{t("product.quantity", "الكمية")}:</label>
              <input
                id="qty"
                type="number"
                min="1"
                max={stockQty > 0 ? stockQty : 1}
                value={qty}
                onChange={(e) => setQty(Math.max(1, Math.min(stockQty || 1, parseInt(e.target.value) || 1)))}
                className={s.qtyInput}
              />
            </div>

            <div className={s.stockStatus}>
                <span className={stockQty > 0 ? s.inStock : s.outOfStock}>
                  {stockQty > 0
                      ? stockQty <= 5
                          ? `${t("product.only", "متبقي فقط")} ${stockQty} ${t("product.left", "قطع")}`
                          : t("product.in_stock", "متوفر في المخزون")
                      : t("product.out_of_stock", "نفذت الكمية")}
                </span>
              </div>

              <div className={s.ctaGroup}>
                <button
                  className={s.btnAddCart}
                  onClick={addToCart}
                  disabled={stockQty <= 0}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
                    <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
                  </svg>
                  {stockQty > 0 ? t("product.add_to_cart", "إضافة للسلة") : t("product.out_of_stock", "نفذت الكمية")}
                </button>

                {stockQty > 0 && (
                  <button className={s.btnBuyNow} onClick={buyNow}>
                    ⚡ {t("product.buy_now", "شراء الآن")}
                  </button>
                )}

                {directOrderInfo && stockQty > 0 && (
                  <button 
                    className={s.btnBuyWhatsApp} 
                    onClick={() => handleWhatsAppOrder(directOrderInfo)}
                  >
                    💬 {t("product.buy_whatsapp", "اتفاق وشراء عبر واتساب")}
                  </button>
                )}

                <button className={s.btnContact} onClick={handleStartChat}>
                  💬 {t("vendor.contact_vendor", "تواصل مع البائع")}
                </button>

                <button 
                  className={`${s.btnCompare} ${isCompared ? s.btnCompareActive : ""}`} 
                  onClick={handleCompare}
                >
                  🔄 {isCompared ? t("compare.remove", "إزالة من المقارنة") : t("compare.add", "إضافة للمقارنة")}
                </button>

                <button className={s.btnShare} onClick={() => setShareOpen(true)}>
                  🔗 {t("common.share", "مشاركة المنتج")}
                </button>
              </div>

              <div className={s.trustStrip}>
                <div className={s.trustItem}>
                  <span className={s.trustIcon}>🛡️</span>
                  {t("trust.authentic", "منتج أصلي 100%")}
                </div>
                <div className={s.trustItem}>
                  <span className={s.trustIcon}>↩️</span>
                  {t("trust.returns", "إرجاع سهل ومجاني")}
                </div>
                <div className={s.trustItem}>
                  <span className={s.trustIcon}>🚚</span>
                  {t("trust.fast_shipping", "شحن سريع وآمن")}
                </div>
              </div>
          </div>
        </div>

        {/* ── Tabbed section ── */}
        <div className={s.tabSection}>
          <div className={s.tabHeader}>
            <button
              className={activeTab === "desc" ? s.tabActive : s.tab}
              onClick={() => setActiveTab("desc")}
            >
              {t("product.description", "الوصف")}
            </button>
            <button
              className={activeTab === "reviews" ? s.tabActive : s.tab}
              onClick={() => setActiveTab("reviews")}
            >
              {t("product.reviews", "التقييمات")}
            </button>
          </div>

          <div className={s.tabContent} key={activeTab}>
            {activeTab === "desc" && (
              <>
                <h3 className={s.descTitle}>{t("product.description", "وصف المنتج")}</h3>
                <p className={s.descText}>{getLocalizedField(product, "description", i18n.language)}</p>

                <div className={s.specsGrid}>
                  <div className={s.specCard}>
                    <div className={s.specLabel}>SKU</div>
                    <div className={s.specValueMono}>{String(product.id || "").padStart(6, "0")}</div>
                  </div>
                  {product.category && (
                    <div className={s.specCard}>
                      <div className={s.specLabel}>{t("filter.category", "التصنيف")}</div>
                      <div className={s.specValue}>{getLocalizedField(product, "category", i18n.language)}</div>
                    </div>
                  )}
                  {Array.isArray(product.tags) && product.tags.length > 0 && (
                    <div className={s.specCard} style={{ gridColumn: "span 2" }}>
                      <div className={s.specLabel}>Tags</div>
                      <div className={s.tagList}>
                        {product.tags.map((tag) => (
                          <span key={tag} className={s.tag}>{tag}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {activeTab === "reviews" && (
              <ProductReviews productId={id} />
            )}
          </div>
        </div>

        {/* ── Recently Viewed ── */}
        <RecentlyViewed currentProductId={product.id} />

      </PageContainer>

      {/* Share Modal */}
      <ShareModal 
        isOpen={shareOpen} 
        onClose={() => setShareOpen(false)} 
        product={product} 
      />

      {/* Chat window */}
      {chatOpen && convId && (
        <ChatWindow
          conversationId={convId}
          vendorName={vendorName || t("nav.vendor", "البائع")}
          onClose={() => setChatOpen(false)}
        />
      )}
    </div>
  );
}
