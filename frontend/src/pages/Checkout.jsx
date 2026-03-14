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
      const fullAddress = `${shipping.city} - ${shipping.address} ${t("checkout.recipient_info", { name: shipping.fullName, phone: shipping.phone })}`;
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
      console.error("Order submit failed", err);
      toast.push({ message: t("common.error"), type: "error" });
    } finally {
      setLoading(false);
    }
  }

  const total = items.reduce((acc, it) => acc + it.product.price * it.quantity, 0);
  const totalQty = items.reduce((acc, it) => acc + it.quantity, 0);

  return (
    <div className={s.page}>
      <PageContainer>
        <div className={s.header}>
          <h1 className={s.title}>{t("checkout.title")}</h1>
          <p className={s.subtitle}>{t("checkout.subtitle")}</p>
        </div>

        <form onSubmit={submit} className={s.container}>
          {/* ── Left Column: Shipping & Payment ── */}
          <div className={s.leftCol}>
            {/* Shipping section */}
            <div className={s.section}>
              <h2 className={s.sectionTitle}>
                <span>📍</span> {t("checkout.shipping_address")}
              </h2>
              <div className={s.grid}>
                <Input
                  label={t("checkout.full_name")}
                  value={shipping.fullName}
                  onChange={(v) => setShipping({ ...shipping, fullName: v })}
                  required
                />
                <Input
                  label={t("checkout.phone")}
                  value={shipping.phone}
                  onChange={(v) => setShipping({ ...shipping, phone: v })}
                  required
                />
                <Input
                  label={t("checkout.city")}
                  value={shipping.city}
                  onChange={(v) => setShipping({ ...shipping, city: v })}
                  required
                />
                <Input
                  label={t("checkout.address_details")}
                  value={shipping.address}
                  onChange={(v) => setShipping({ ...shipping, address: v })}
                  required
                />
              </div>
            </div>

            {/* Payment Method */}
            <div className={s.section}>
              <h2 className={s.sectionTitle}>
                <span>💳</span> {t("checkout.payment_method")}
              </h2>
              <div className={s.paymentMethods}>
                <button
                  type="button"
                  className={`${s.paymentOption} ${paymentMethod === "card" ? s.activePayment : ""}`}
                  onClick={() => setPaymentMethod("card")}
                >
                  <div className={s.paymentOptionLabel}>
                    {t("checkout.credit_card")}
                  </div>
                </button>
                <button
                  type="button"
                  className={`${s.paymentOption} ${paymentMethod === "cod" ? s.activePayment : ""}`}
                  onClick={() => setPaymentMethod("cod")}
                >
                  <div className={s.paymentOptionLabel}>
                    {t("checkout.cod")}
                  </div>
                </button>
              </div>

              {paymentMethod === "card" && (
                <div className={s.cardForm}>
                  <Input label={t("checkout.card_number")} placeholder="0000 0000 0000 0000" />
                  <div className={s.cardGrid}>
                    <Input label={t("checkout.expiry")} placeholder="MM/YY" />
                    <Input label={t("checkout.cvc")} placeholder="123" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Right Column: Summary ── */}
          <div className={s.rightCol}>
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
                  <label className={s.couponLabel}>{t("cart.coupon_code")}</label>
                  <input
                    type="text"
                    className={s.couponInput}
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder={t("cart.coupon_placeholder")}
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
                  <span className={s.summaryRowLabel}>{t("checkout.shipping")}</span>
                  <span className={(preview?.shipping_cost || 0) === 0 ? s.summaryRowFree : s.summaryRowValue}>
                    {(preview?.shipping_cost || 0) === 0
                      ? t("checkout.free")
                      : `${(preview?.shipping_cost || 0).toFixed(2)} ${t("common.currency")}`}
                  </span>
                </div>
                <div className={s.summaryRow}>
                  <span className={s.summaryRowLabel}>{t("checkout.tax_with_percent")}</span>
                  <span className={s.summaryRowValue}>
                    {(preview?.tax_total || 0).toFixed(2)} {t("common.currency")}
                  </span>
                </div>

                {/* Affiliate discount */}
                {preview?.affiliate_discount > 0 && (
                  <div className={s.affiliateDiscount}>
                    <span>✨ {t("checkout.affiliate_discount")}</span>
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
                t("checkout.place_order")
              )}
            </button>

            <div className={s.secureNote}>🔒 {t("cart.secure")}</div>
          </div>
        </form>
      </PageContainer>
    </div>
  );
}
