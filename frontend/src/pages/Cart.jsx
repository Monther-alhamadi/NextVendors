import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import cartStore from "../store/cartStore";
import OptimizedImage from "../components/OptimizedImage";
import { TrashIcon } from "../components/common/Icons";
import PageContainer from "../components/PageContainer";
import { useTranslation } from "react-i18next";
import s from "./Cart.module.css";

const FREE_SHIPPING_THRESHOLD = 100;

export default function Cart() {
  const [items, setItems] = useState(cartStore.items);
  const { t } = useTranslation();

  useEffect(() => {
    const unsub = cartStore.subscribe(() => setItems([...cartStore.items]));
    return () => unsub();
  }, []);

  const subtotal = items.reduce((acc, it) => acc + it.product.price * it.quantity, 0);
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : 9.99;
  const total = subtotal + shipping;
  const totalQty = items.reduce((acc, it) => acc + it.quantity, 0);
  const shippingProgress = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);

  return (
    <div className={s.page}>
      <PageContainer>
        {/* ── Header ── */}
        <div className={s.header}>
          <h1 className={s.headerTitle}>{t("cart.title")}</h1>
          <p className={s.headerCount}>
            {totalQty} {t("common.items_count")}
          </p>
        </div>

        {items.length === 0 ? (
          /* ── Empty state ── */
          <div className={s.emptyState}>
            <div className={s.emptyIcon}>🛒</div>
            <h2 className={s.emptyTitle}>{t("cart.empty")}</h2>
            <p className={s.emptyDesc}>{t("cart.empty_desc")}</p>
            <Link to="/products" className={s.emptyBtn}>
              {t("cart.browse_products")}
            </Link>
          </div>
        ) : (
          /* ── Cart grid ── */
          <div className={s.grid}>
            {/* Items list */}
            <div className={s.itemsList}>
              {items.map((it) => {
                const firstImg = it.product.images?.[0];
                const imgSrc = typeof firstImg === "string" ? firstImg : (firstImg?.url || "/placeholder.png");
                return (
                  <div key={it.product.id} className={s.itemCard}>
                    <div className={s.itemImage}>
                      <OptimizedImage src={imgSrc} alt={it.product.name} />
                    </div>
                    <div className={s.itemBody}>
                      <h4 className={s.itemName}>{it.product.name}</h4>
                      <span className={s.itemPrice}>
                        {it.product.price.toLocaleString()} {t("common.currency")}
                      </span>
                      <div className={s.itemActions}>
                        {/* Quantity stepper */}
                        <div className={s.stepper}>
                          <button
                            className={s.stepperBtn}
                            onClick={() => cartStore.updateQuantity(it.product.id, Math.max(1, it.quantity - 1))}
                            disabled={it.quantity <= 1}
                            aria-label="Decrease"
                          >
                            −
                          </button>
                          <span className={s.stepperValue}>{it.quantity}</span>
                          <button
                            className={s.stepperBtn}
                            onClick={() => cartStore.updateQuantity(it.product.id, it.quantity + 1)}
                            aria-label="Increase"
                          >
                            +
                          </button>
                        </div>
                        {/* Remove */}
                        <button className={s.removeBtn} onClick={() => cartStore.removeItem(it.product.id)}>
                          <TrashIcon />
                          {t("common.delete")}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── Summary card ── */}
            <div className={s.summaryCard}>
              <h3 className={s.summaryTitle}>{t("cart.summary")}</h3>

              {/* Free shipping progress */}
              <div className={s.shippingProgress}>
                {subtotal >= FREE_SHIPPING_THRESHOLD ? (
                  <div className={s.shippingFree}>🎉 {t("cart.free_shipping_unlocked") || "Free shipping unlocked!"}</div>
                ) : (
                  <>
                    <div className={s.shippingLabel}>
                      🚚 {t("cart.free_shipping_msg") || `Add ${(FREE_SHIPPING_THRESHOLD - subtotal).toFixed(0)} ${t("common.currency")} for free shipping`}
                    </div>
                    <div className={s.progressBar}>
                      <div className={s.progressFill} style={{ width: `${shippingProgress}%` }} />
                    </div>
                  </>
                )}
              </div>

              {/* Rows */}
              <div className={s.summaryRow}>
                <span className={s.summaryRowLabel}>{t("product.quantity")}</span>
                <span className={s.summaryRowValue}>{totalQty}</span>
              </div>
              <div className={s.summaryRow}>
                <span className={s.summaryRowLabel}>{t("checkout.subtotal") || t("cart.total")}</span>
                <span className={s.summaryRowValue}>
                  {subtotal.toLocaleString()} {t("common.currency")}
                </span>
              </div>
              <div className={s.summaryRow}>
                <span className={s.summaryRowLabel}>{t("checkout.shipping") || "Shipping"}</span>
                <span className={shipping === 0 ? s.summaryRowFree : s.summaryRowValue}>
                  {shipping === 0
                    ? t("checkout.free") || "Free"
                    : `${shipping.toLocaleString()} ${t("common.currency")}`}
                </span>
              </div>

              <div className={s.divider} />

              <div className={s.totalRow}>
                <span className={s.totalLabel}>{t("cart.total")}</span>
                <span className={s.totalValue}>
                  {total.toLocaleString()} {t("common.currency")}
                </span>
              </div>

              <Link to="/checkout" className={s.checkoutBtn}>
                🔒 {t("cart.checkout")}
              </Link>

              <div className={s.secureNote}>
                <span>{t("cart.secure")}</span>
              </div>
            </div>
          </div>
        )}
      </PageContainer>
    </div>
  );
}
