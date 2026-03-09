import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../services/api";
import ReturnRequestModal from "../components/ReturnRequestModal";
import { useTranslation } from "react-i18next";
import styles from "./OrderDetail.module.css";

const STATUS_STEPS = ["pending", "processing", "shipped", "completed"];
const STATUS_ICONS = { pending: "📋", processing: "⚙️", shipped: "🚚", completed: "✅", cancelled: "❌" };
const STATUS_CSS = {
  pending: "statusPending", processing: "statusProcessing",
  shipped: "statusShipped", completed: "statusCompleted", cancelled: "statusCancelled",
};

function translateStatus(status, t) {
  return t(`orders.status_${status?.toLowerCase()}`, status);
}

function getTimelineFill(status) {
  const idx = STATUS_STEPS.indexOf(status?.toLowerCase());
  if (idx < 0) return 0;
  return Math.round((idx / (STATUS_STEPS.length - 1)) * 100);
}

export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [returnItem, setReturnItem] = useState(null);
  const { t, i18n } = useTranslation();

  useEffect(() => {
    (async () => {
      try {
        const resp = await api.get(`/orders/${id}`);
        setOrder(resp.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return <div className={styles.loading}>{t("common.loading")}</div>;
  if (!order) return <div className={styles.loading}>{t("common.error")}</div>;

  const currentStatus = order.status?.toLowerCase();
  const currentIdx = STATUS_STEPS.indexOf(currentStatus);
  const isCancelled = currentStatus === "cancelled";

  return (
    <div className={styles.page}>
      {/* ── Breadcrumb ── */}
      <div className={styles.breadcrumb}>
        <Link to="/">{t("nav.home")}</Link>
        <span className={styles.breadcrumbSep}>›</span>
        <Link to="/orders">{t("orders.title")}</Link>
        <span className={styles.breadcrumbSep}>›</span>
        <span className={styles.breadcrumbCurrent}>#{order.id}</span>
      </div>

      {/* ── Header ── */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1>{t("orders.detail_title")} #{order.id}</h1>
          <p className={styles.headerDate}>
            {t("orders.ordered_at")}{" "}
            {new Date(order.created_at || Date.now()).toLocaleDateString(
              i18n.language === "ar" ? "ar-EG" : "en-US",
              { year: "numeric", month: "long", day: "numeric" }
            )}
          </p>
        </div>
        <Link to="/orders" className={styles.backBtn}>
          ← {t("orders.back_to_orders")}
        </Link>
      </div>

      {/* ── Status Timeline ── */}
      {!isCancelled && (
        <div className={styles.timeline}>
          <div className={styles.timelineLine}>
            <div className={styles.timelineFill} style={{ width: `${getTimelineFill(currentStatus)}%` }} />
          </div>
          {STATUS_STEPS.map((step, i) => {
            const isDone = i < currentIdx;
            const isActive = i === currentIdx;
            return (
              <div key={step} className={styles.timelineStep}>
                <span className={`${styles.timelineDot} ${isDone ? styles.timelineDotDone : ""} ${isActive ? styles.timelineDotActive : ""}`}>
                  {isDone ? "✓" : STATUS_ICONS[step]}
                </span>
                <span className={`${styles.timelineLabel} ${isDone ? styles.timelineLabelDone : ""} ${isActive ? styles.timelineLabelActive : ""}`}>
                  {translateStatus(step, t)}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* If cancelled, show cancelled badge */}
      {isCancelled && (
        <div className={styles.timeline}>
          <div className={styles.timelineStep}>
            <span className={`${styles.timelineDot} ${styles.timelineDotActive}`} style={{ background: "var(--danger)", borderColor: "var(--danger)" }}>
              ❌
            </span>
            <span className={styles.timelineLabel} style={{ color: "var(--danger)" }}>
              {translateStatus("cancelled", t)}
            </span>
          </div>
        </div>
      )}

      {/* ── Content Grid ── */}
      <div className={styles.grid}>
        {/* Main Column */}
        <div>
          {/* Items Card */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              📦 {t("orders.items")} ({order.items?.length || 0})
            </div>
            <div className={styles.itemsList}>
              {order.items?.map((item, i) => (
                <div key={i} className={styles.orderItem}>
                  <img
                    src={item.image || "/placeholder.png"}
                    alt={item.product_name || ""}
                    className={styles.itemImage}
                    loading="lazy"
                  />
                  <div className={styles.itemInfo}>
                    <div className={styles.itemName}>{item.product_name || `${t("nav.products")} #${item.product_id}`}</div>
                    <div className={styles.itemQty}>{t("product.quantity")}: {item.quantity}</div>
                  </div>
                  <div className={styles.itemPrice}>
                    {(item.price || 0).toFixed(0)} {t("common.currency")}
                  </div>
                  {currentStatus === "completed" && (
                    <div className={styles.itemAction}>
                      <button className={styles.returnBtn} onClick={() => setReturnItem(item)}>
                        {t("orders.return") || "إرجاع"}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div>
          {/* Summary Card */}
          <div className={styles.summaryCard}>
            <div className={styles.cardHeader}>📊 {t("cart.summary")}</div>
            <div className={styles.summaryBody}>
              <div className={styles.summaryRow}>
                <span>{t("orders.status")}</span>
                <span className={`${styles.statusBadge} ${styles[STATUS_CSS[currentStatus] || "statusPending"]}`}>
                  <span className={styles.statusDot} />
                  {translateStatus(order.status, t)}
                </span>
              </div>
              {order.shipping_address?.address && (
                <div className={styles.summaryRow}>
                  <span>{t("orders.address")}</span>
                  <span>{order.shipping_address.address}</span>
                </div>
              )}
              <div className={`${styles.summaryRow} ${styles.summaryTotal}`}>
                <span>{t("orders.total")}</span>
                <span>{order.total_amount?.toFixed(0)} {t("common.currency")}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Return Modal */}
      {returnItem && (
        <ReturnRequestModal
          order={order}
          product={{ id: returnItem.product_id, name: returnItem.product_name }}
          onClose={() => setReturnItem(null)}
          onSuccess={() => setReturnItem(null)}
        />
      )}
    </div>
  );
}
