import React, { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { getProduct } from "../services/productService";
import ProductReviews from "./ProductReviews";
import OptimizedImage from "../components/OptimizedImage";
import PageContainer from "../components/PageContainer";
import cartStore from "../store/cartStore";
import { useToast } from "../components/common/ToastProvider";
import { useTranslation } from "react-i18next";
import { useAuth } from "../store/authStore";
import { startChat } from "../services/messagingService";
import ChatWindow from "../components/chat/ChatWindow";
import useCompareStore from "../store/compareStore";
import useRecentStore from "../store/recentStore";
import ShareModal from "../components/common/ShareModal";
import RecentlyViewed from "../components/product/RecentlyViewed";
import s from "./ProductDetail.module.css";
import { useNavigate } from "react-router-dom";

export default function ProductDetail() {
  const { id } = useParams();
  const { t } = useTranslation();
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
    toast.push({ message: t("product.added_to_cart"), duration: 3000 });
  }

  function buyNow() {
    cartStore.addItem(product, qty);
    navigate("/checkout");
  }

  function handleCompare() {
    const res = toggleCompare(product);
    if (res.error) toast.push({ message: res.error, duration: 2500 });
    else toast.push({ message: res.added ? (t("compare.added") || "تمت إضافته للمقارنة") : (t("compare.removed") || "تمت إزالته من المقارنة"), duration: 2000 });
  }

  // ── Chat with vendor ──
  async function handleStartChat() {
    if (!user) {
      toast.push({ message: t("nav.login"), type: "error" });
      return;
    }
    try {
      const conv = await startChat(product.supplier_id);
      setConvId(conv.id);
      setChatOpen(true);
    } catch {
      toast.push({ message: t("common.error"), type: "error" });
    }
  }

  // ── Hybrid Commerce (WhatsApp) ──
  async function handleWhatsAppOrder(info) {
    if (!info.whatsapp_number) {
        toast.push({ message: t("vendor.no_whatsapp") || "لا يتوفر رقم واتساب لهذا البائع", type: "error" });
        return;
    }
    if (!user) {
        toast.push({ message: t("nav.login_required") || "يجب تسجيل الدخول لإتمام الطلب", type: "error" });
        navigate("/login");
        return;
    }

    // Call API to create hybrid order (PENDING_AGREEMENT)
    toast.push({ message: t("vendor.reserving_stock") || "جاري حجز المخزون وتحويلك...", duration: 2500 });
    
    try {
        const { createHybridOrder } = await import("../services/orderService");
        const orderRes = await createHybridOrder({
            product_id: product.id,
            supplier_id: info.supplier_id,
            quantity: qty,
            price: price
        });

        // Redirect to WhatsApp
        const msg = `مرحباً، أود إتمام شراء المنتج: ${product.name} (الكمية: ${qty}). رقم الطلب المرجعي: #${orderRes.order_id}`;
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
        <span>{t("common.loading")}</span>
      </div>
    );
  }

  // ── Error state ──
  if (!product) {
    return (
      <div className={s.errorPage}>
        <div className={s.errorIcon}>⚠️</div>
        <span>{t("common.error")}</span>
        <Link to="/products" style={{ color: "var(--primary)", fontWeight: 600, fontSize: "var(--text-sm)" }}>
          ← {t("products.browse_title")}
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
          <Link to="/">{t("nav.home")}</Link>
          <span className={s.breadcrumbSep}>/</span>
          <Link to="/products">{t("nav.products")}</Link>
          <span className={s.breadcrumbSep}>/</span>
          <span className={s.breadcrumbCurrent}>{product.name}</span>
        </nav>

        {/* ── Main grid ── */}
        <div className={s.grid}>
          {/* ══ Gallery ══ */}
          <div className={s.gallery}>
            <div className={s.mainImage}>
              {/* Badges */}
              <div className={s.galleryBadges}>
                {product.sale && <span className={s.badgeSale}>{t("product.sale")}</span>}
                {(product.is_new || (Array.isArray(product.tags) && product.tags.includes("new"))) && (
                  <span className={s.badgeNew}>{t("product.new")}</span>
                )}
              </div>

              <OptimizedImage
                src={images[activeImage]}
                alt={product.name}
              />

              {/* Image counter */}
              {images.length > 1 && (
                <span className={s.imageCounter}>
                  {activeImage + 1} / {images.length}
                </span>
              )}

              {/* Nav arrows */}
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

            {/* Thumbnails */}
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
            {/* Category */}
            {product.category && (
              <Link to={`/products?category=${encodeURIComponent(product.category)}`} className={s.category}>
                {product.category}
              </Link>
            )}

            {/* Title & Actions Row */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
              <h1 className={s.title}>{product.name}</h1>
              <div className={s.actionIconBtns}>
                <button 
                  className={s.btnIcon} 
                  onClick={handleCompare} 
                  aria-label="Compare"
                  title={t("compare.title") || "مقارنة"}
                >
                  <span style={{ opacity: isCompared ? 1 : 0.6 }}>⚖️</span>
                </button>
                <button 
                  className={s.btnIcon} 
                  onClick={() => setShareOpen(true)}
                  aria-label="Share"
                  title={t("product.share_product") || "مشاركة"}
                >
                  📤
                </button>
              </div>
            </div>

            {/* Vendor badge */}
            {vendorName && (
              <span className={s.vendorBadge}>
                <span className={s.vendorDot} />
                {vendorName}
              </span>
            )}

            {/* Rating */}
            {product.rating > 0 && (
              <div className={s.ratingRow}>
                <span className={s.stars}>{renderStars(product.rating)}</span>
                <span className={s.ratingCount}>
                  ({product.review_count || 0} {t("product.reviews")})
                </span>
              </div>
            )}

            {/* Price */}
            <div className={s.priceBlock}>
              <span className={s.price}>
                {price.toFixed(0)}
                <span className={s.currency}>{t("common.currency")}</span>
              </span>
              {oldPrice && oldPrice > price && (
                <span className={s.oldPrice}>
                  {oldPrice.toFixed(0)} {t("common.currency")}
                </span>
              )}
              {discount && <span className={s.discountBadge}>-{discount}%</span>}
            </div>

            {/* ── Action card ── */}
            <div className={s.actionCard}>
              {/* Quantity + Stock */}
              <div className={s.stepperRow}>
                <span className={s.stepperLabel}>{t("product.quantity")}</span>
                <div className={s.stepper}>
                  <button
                    className={s.stepperBtn}
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    disabled={qty <= 1}
                    aria-label="Decrease"
                  >
                    −
                  </button>
                  <span className={s.stepperValue}>{qty}</span>
                  <button
                    className={s.stepperBtn}
                    onClick={() => setQty((q) => Math.min(stockQty || 99, q + 1))}
                    disabled={qty >= (stockQty || 99)}
                    aria-label="Increase"
                  >
                    +
                  </button>
                </div>

                {/* Stock status */}
                <span
                  className={
                    stockQty === 0
                      ? s.stockOut
                      : stockQty < 10
                        ? s.stockLow
                        : s.stockIn
                  }
                >
                  <span className={stockQty > 0 ? s.stockDotPulse : s.stockDot} />
                  {stockQty === 0
                    ? t("product.out_of_stock")
                    : stockQty < 10
                      ? `${t("product.only")} ${stockQty} ${t("product.left")}`
                      : t("product.in_stock")}
                </span>
              </div>

              {/* CTA buttons */}
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
                  {stockQty > 0 ? t("product.add_to_cart") : t("product.out_of_stock")}
                </button>

                {stockQty > 0 && (
                  <button className={s.btnBuyNow} onClick={buyNow}>
                    ⚡ {t("product.buy_now") || "شراء الآن"}
                  </button>
                )}

                {directOrderInfo && stockQty > 0 && (
                  <button 
                    className={s.btnBuyWhatsApp} 
                    onClick={() => handleWhatsAppOrder(directOrderInfo)}
                    style={{ background: '#25D366', color: 'white', border: 'none', padding: '0.85rem', width: '100%', borderRadius: 'var(--radius-lg)', fontWeight: '800', marginTop: '0.5rem', cursor: 'pointer', display: 'flex', justifyContent: 'center', gap: '8px' }}
                  >
                    💬 {t("product.buy_whatsapp") || "اتفاق وشراء عبر واتساب"}
                  </button>
                )}

                <button className={s.btnContact} onClick={handleStartChat} style={{marginTop: '0.5rem'}}>
                  💬 {t("vendor.contact_vendor")}
                </button>
              </div>
            </div>

            {/* Trust strip */}
            <div className={s.trustStrip}>
              <div className={s.trustItem}>
                <span className={s.trustIcon}>🛡️</span>
                {t("trust.authentic")}
              </div>
              <div className={s.trustItem}>
                <span className={s.trustIcon}>↩️</span>
                {t("trust.returns")}
              </div>
              <div className={s.trustItem}>
                <span className={s.trustIcon}>🚚</span>
                {t("trust.fast_shipping")}
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
              {t("product.description")}
            </button>
            <button
              className={activeTab === "reviews" ? s.tabActive : s.tab}
              onClick={() => setActiveTab("reviews")}
            >
              {t("product.reviews")}
            </button>
          </div>

          <div className={s.tabContent} key={activeTab}>
            {activeTab === "desc" && (
              <>
                <h3 className={s.descTitle}>{t("product.description")}</h3>
                <p className={s.descText}>{product.description}</p>

                {/* Specs grid — only real data */}
                <div className={s.specsGrid}>
                  <div className={s.specCard}>
                    <div className={s.specLabel}>SKU</div>
                    <div className={s.specValueMono}>{String(product.id || "").padStart(6, "0")}</div>
                  </div>
                  {product.category && (
                    <div className={s.specCard}>
                      <div className={s.specLabel}>{t("filter.category")}</div>
                      <div className={s.specValue}>{product.category}</div>
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
          vendorName={vendorName || t("nav.vendor")}
          onClose={() => setChatOpen(false)}
        />
      )}
    </div>
  );
}
