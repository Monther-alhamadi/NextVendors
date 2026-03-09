import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import cartStore from "../store/cartStore";
import orderService from "../services/orderService";
import api from "../services/api";
import { useAuth } from "../store/authStore.jsx";
import { useToast } from "../components/common/ToastProvider";
import PageContainer from "../components/PageContainer";
import Input from "../components/common/Input";
import { useTranslation } from "react-i18next";
import { useConfig } from "../context/ConfigContext";
import s from "./Checkout.module.css";

export default function Checkout() {
  const { config } = useConfig();
  const [shipping, setShipping] = useState({
    fullName: "",
    phone: "",
    city: "",
    address: "",
    countryCode: "SA",
  });
  const [items, setItems] = useState(cartStore.items);
  const [loading, setLoading] = useState(false);
  const { accessToken } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const { t } = useTranslation();

  const [paymentMethod, setPaymentMethod] = useState("card");
  const [cardInfo, setCardInfo] = useState({ number: "", expiry: "", cvc: "" });
  const [preview, setPreview] = useState(null);
  const [couponCode, setCouponCode] = useState("");
  const [summaryOpen, setSummaryOpen] = useState(true);

  useEffect(() => {
    const unsub = cartStore.subscribe(() => setItems([...cartStore.items]));
    return () => unsub();
  }, []);

  // ── Preview calculation ──
  const fetchPreview = async () => {
    if (items.length === 0) return;
    const getCookie = (name) => {
      const v = document.cookie.match("(?:^|;)\\s*" + name + "=([^;]+)");
      return v ? v[1] : null;
    };
    const affiliateId = getCookie("affiliate_id");
    try {
      const resp = await api.post("/orders/calculate-preview", {
        items: items.map((it) => ({ product_id: it.product.id, quantity: it.quantity })),
        shipping_address: { city: shipping.city, country_code: shipping.countryCode },
        coupon_code: couponCode || null,
        affiliate_id: affiliateId ? parseInt(affiliateId) : null,
      });
      setPreview(resp.data);
    } catch (err) {
      console.error("Preview fetch failed", err);
    }
  };

  useEffect(() => { fetchPreview(); }, [shipping.city, shipping.countryCode, couponCode, items]);

  // ── Payment ──
  async function pay(amountCents) {
    const { data } = await api.post("/payments/create-intent", {
      amount: amountCents,
      currency: (preview?.currency || config.currency).toLowerCase(),
    });
    return await api.post("/payments/confirm", { payment_id: data.payment_id });
  }

  // ── Submit ──
  async function submit(e) {
    e.preventDefault();
    if (!accessToken) { navigate("/login"); return; }
    setLoading(true);
    try {
      const fullAddress = `${shipping.city} - ${shipping.address} (Recipient: ${shipping.fullName}, Phone: ${shipping.phone})`;
      if (paymentMethod === "card") {
        const totalCents = Math.round((preview?.total_amount || total) * 100);
        await pay(totalCents);
        toast.push({ message: t("checkout.payment_authorized"), type: "success" });
      }
      const getCookie = (name) => {
        const v = document.cookie.match("(?:^|;)\\s*" + name + "=([^;]+)");
        return v ? v[1] : null;
      };
      const affiliateId = getCookie("affiliate_id");

      const order = await orderService.createOrder({
        items: items.map((it) => ({ product_id: it.product.id, quantity: it.quantity })),
        shipping_address: { address: fullAddress, city: shipping.city, country_code: shipping.countryCode },
        coupon_code: couponCode || null,
        affiliate_id: affiliateId ? parseInt(affiliateId) : null,
      });

      document.cookie = "affiliate_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie = "affiliate_code=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      cartStore.clearCart();
      navigate(`/orders/${order.id}`);
    } catch (err) {
      console.error(err);
      toast.push({ message: t("common.error") + ": " + (err.response?.data?.detail || err.message), duration: 6000 });
    } finally {
      setLoading(false);
    }
  }

  const total = items.reduce((acc, it) => acc + it.product.price * it.quantity, 0);
  const totalQty = items.reduce((acc, it) => acc + it.quantity, 0);

  // Determine which step is visually active
  const shippingFilled = shipping.fullName && shipping.phone && shipping.city && shipping.address;
  const currentStep = shippingFilled ? 2 : 1;

  return (
    <div className={s.page}>
      <PageContainer>
        {/* ── Header ── */}
        <div className={s.header}>
          <h1 className={s.headerTitle}>{t("checkout.title")}</h1>
          <p className={s.headerSub}>{t("checkout.subtitle") || "Complete your purchase securely"}</p>
        </div>

        {/* ── Step indicator ── */}
        <div className={s.steps}>
          <div className={s.step}>
            <span className={currentStep > 1 ? s.stepCircleDone : s.stepCircleActive}>
              {currentStep > 1 ? "✓" : "1"}
            </span>
            <span className={currentStep >= 1 ? s.stepLabelActive : s.stepLabel}>
              {t("checkout.shipping_address")}
            </span>
          </div>
          <div className={currentStep > 1 ? s.stepLineDone : s.stepLine} />
          <div className={s.step}>
            <span className={currentStep >= 2 ? s.stepCircleActive : s.stepCircle}>2</span>
            <span className={currentStep >= 2 ? s.stepLabelActive : s.stepLabel}>
              {t("checkout.payment_method")}
            </span>
          </div>
          <div className={s.stepLine} />
          <div className={s.step}>
            <span className={s.stepCircle}>3</span>
            <span className={s.stepLabel}>{t("checkout.place_order")}</span>
          </div>
        </div>

        {/* ── Form ── */}
        <form onSubmit={submit} className={s.formGrid}>
          <div className={s.formCol}>
            {/* ══ Shipping section ══ */}
            <div className={s.sectionCard}>
              <div className={s.sectionHeader}>
                <span className={s.sectionNum}>1</span>
                <h2 className={s.sectionTitle}>{t("checkout.shipping_address")}</h2>
              </div>

              <div className={s.fieldGrid2}>
                <Input
                  label={t("checkout.full_name")}
                  required
                  value={shipping.fullName}
                  onChange={(e) => setShipping({ ...shipping, fullName: e.target.value })}
                />
                <Input
                  label={t("checkout.phone")}
                  required
                  type="tel"
                  value={shipping.phone}
                  onChange={(e) => setShipping({ ...shipping, phone: e.target.value })}
                />
              </div>

              <div className={s.fieldGrid2}>
                <Input
                  label={t("checkout.city")}
                  required
                  value={shipping.city}
                  onChange={(e) => setShipping({ ...shipping, city: e.target.value })}
                />
                <div className={s.selectWrap}>
                  <label className={s.selectLabel}>{t("admin.country", "Country")}</label>
                  <select
                    className={s.select}
                    value={shipping.countryCode}
                    onChange={(e) => setShipping({ ...shipping, countryCode: e.target.value })}
                  >
                    <option value="SA">Saudi Arabia (KSA)</option>
                    <option value="AE">United Arab Emirates (UAE)</option>
                    <option value="KW">Kuwait</option>
                    <option value="QA">Qatar</option>
                  </select>
                </div>
              </div>

              <Input
                label={t("checkout.address_details")}
                required
                multiline
                rows={3}
                value={shipping.address}
                onChange={(e) => setShipping({ ...shipping, address: e.target.value })}
              />
            </div>

            {/* ══ Payment section ══ */}
            <div className={s.sectionCard}>
              <div className={s.sectionHeader}>
                <span className={s.sectionNum}>2</span>
                <h2 className={s.sectionTitle}>{t("checkout.payment_method")}</h2>
              </div>

              <div className={s.paymentGrid}>
                <label className={paymentMethod === "cod" ? s.paymentCardActive : s.paymentCard}>
                  <input
                    type="radio"
                    name="payment"
                    className={s.paymentRadio}
                    checked={paymentMethod === "cod"}
                    onChange={() => setPaymentMethod("cod")}
                  />
                  <span className={s.paymentIcon}>💵</span>
                  <span className={s.paymentLabel}>{t("checkout.cod", "الدفع عند الاستلام")}</span>
                </label>
                <label className={paymentMethod === "kuraimi" ? s.paymentCardActive : s.paymentCard}>
                  <input
                    type="radio"
                    name="payment"
                    className={s.paymentRadio}
                    checked={paymentMethod === "kuraimi"}
                    onChange={() => setPaymentMethod("kuraimi")}
                  />
                  <span className={s.paymentIcon}>🏦</span>
                  <span className={s.paymentLabel}>{t("checkout.kuraimi", "الكريمي / النجم")}</span>
                </label>
                <label className={paymentMethod === "card" ? s.paymentCardActive : s.paymentCard}>
                  <input
                    type="radio"
                    name="payment"
                    className={s.paymentRadio}
                    checked={paymentMethod === "card"}
                    onChange={() => setPaymentMethod("card")}
                  />
                  <span className={s.paymentIcon}>💳</span>
                  <span className={s.paymentLabel}>{t("checkout.credit_card", "البطاقات الدولية")}</span>
                </label>
              </div>

              {/* Payment Warnings based on user selection */}
              {paymentMethod === "kuraimi" && (
                <div style={{ marginTop: 20, padding: 16, backgroundColor: "#fff3cd", color: "#856404", borderRadius: 12, border: "1px solid #ffeeba" }}>
                  <p style={{ margin: 0, fontWeight: 600, lineHeight: 1.6, fontSize: '0.9rem' }}>
                    ⚠️ نعتذر للعملاء الكرام، هذه الخدمة غير متاحة حالياً نظراً للتعقيدات الإدارية من طرف البنك.
                  </p>
                  <p style={{ margin: '8px 0 0', lineHeight: 1.6, fontSize: '0.85rem' }}>
                    يرجى اختيار <strong>"الدفع عند الاستلام"</strong> لإتمام طلبك، أو تواصل مع البائع مباشرة عبر
                    <strong> واتساب </strong> 💬 لترتيب طريقة الدفع المناسبة بعد تأكيد الطلب.
                  </p>
                </div>
              )}

              {paymentMethod === "card" && (
                <div style={{ marginTop: 20, padding: 16, backgroundColor: "#e8f4fd", color: "#004085", borderRadius: 12, border: "1px solid #b8daff" }}>
                  <p style={{ margin: 0, fontWeight: 600, lineHeight: 1.6, fontSize: '0.9rem' }}>
                    🔒 نظام الدفع الإلكتروني بالبطاقات قيد التطوير حالياً للعمل بأعلى معايير الأمان العالمية.
                  </p>
                  <p style={{ margin: '8px 0 0', lineHeight: 1.6, fontSize: '0.85rem' }}>
                    يرجى اختيار <strong>"الدفع عند الاستلام"</strong> مؤقتاً، أو تواصل مباشرة مع التاجر عبر
                    <strong> واتساب </strong> 💬 بعد إتمام الطلب لترتيب وسيلة الدفع.
                  </p>
                </div>
              )}

              {/* General WhatsApp guidance */}
              <div style={{ marginTop: 16, padding: 14, backgroundColor: 'rgba(37, 211, 102, 0.08)', borderRadius: 12, border: '1px solid rgba(37, 211, 102, 0.2)', display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: '1.5rem' }}>💬</span>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  بعد إتمام الطلب، يمكنك التواصل مباشرة مع البائع عبر <strong style={{ color: '#25D366' }}>واتساب</strong> لترتيب التوصيل والدفع. ستجد رقم البائع في صفحة تفاصيل الطلب.
                </p>
              </div>
            </div>
          </div>

          {/* ══ Order summary sidebar ══ */}
          <div className={s.summaryCard}>
            <button
              type="button"
              className={`${s.summaryToggle} ${summaryOpen ? s.summaryToggleOpen : ""}`}
              onClick={() => setSummaryOpen((o) => !o)}
            >
              {t("cart.summary")} ({totalQty})
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>

            {summaryOpen && (
              <>
                {/* Coupon */}
                <div className={s.couponBox}>
                  <label className={s.couponLabel}>{t("cart.coupon_code", "Coupon Code")}</label>
                  <input
                    type="text"
                    className={s.couponInput}
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="E.g. SUMMER20"
                  />
                </div>

                {/* Breakdown */}
                <div className={s.summaryRow}>
                  <span className={s.summaryRowLabel}>{t("cart.subtotal")}</span>
                  <span className={s.summaryRowValue}>
                    {(preview?.subtotal || total).toFixed(2)} {t("common.currency")}
                  </span>
                </div>
                <div className={s.summaryRow}>
                  <span className={s.summaryRowLabel}>{t("checkout.shipping", "Shipping")}</span>
                  <span className={(preview?.shipping_cost || 0) === 0 ? s.summaryRowFree : s.summaryRowValue}>
                    {(preview?.shipping_cost || 0) === 0
                      ? t("checkout.free") || "Free"
                      : `${(preview?.shipping_cost || 0).toFixed(2)} ${t("common.currency")}`}
                  </span>
                </div>
                <div className={s.summaryRow}>
                  <span className={s.summaryRowLabel}>{t("checkout.tax", "Tax")} (15%)</span>
                  <span className={s.summaryRowValue}>
                    {(preview?.tax_total || 0).toFixed(2)} {t("common.currency")}
                  </span>
                </div>

                {/* Affiliate discount */}
                {preview?.affiliate_discount > 0 && (
                  <div className={s.affiliateDiscount}>
                    <span>✨ {t("checkout.affiliate_discount", "Partner Discount")}</span>
                    <span>-{preview.affiliate_discount.toFixed(2)} {t("common.currency")}</span>
                  </div>
                )}

                {/* Coupon discount */}
                {preview?.coupon_discount > 0 && (
                  <div className={s.couponDiscount}>
                    <span>🎟️ {t("cart.discount")}</span>
                    <span>-{preview.coupon_discount.toFixed(2)} {t("common.currency")}</span>
                  </div>
                )}

                <div className={s.divider} />

                <div className={s.totalRow}>
                  <span className={s.totalLabel}>{t("cart.total")}</span>
                  <span className={s.totalValue}>
                    {(preview?.total_amount || total).toFixed(2)} {t("common.currency")}
                  </span>
                </div>
              </>
            )}

            <button
              type="submit"
              className={s.submitBtn}
              disabled={items.length === 0 || loading || paymentMethod !== "cod"}
              style={{ opacity: paymentMethod !== "cod" ? 0.5 : 1, cursor: paymentMethod !== "cod" ? "not-allowed" : "pointer" }}
            >
              {loading ? (
                <span className={s.btnSpinner} />
              ) : (
                t("checkout.place_order", "تأكيد الطلب")
              )}
            </button>

            <div className={s.secureNote}>🔒 {t("cart.secure")}</div>
          </div>
        </form>
      </PageContainer>
    </div>
  );
}
