import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import orderService from "../services/orderService";
import { useTranslation } from "react-i18next";
import styles from "./Orders.module.css";

const STATUS_MAP = {
  pending: "statusPending",
  processing: "statusProcessing",
  shipped: "statusShipped",
  completed: "statusCompleted",
  cancelled: "statusCancelled",
};

const FILTER_TABS = [
  { key: "all", labelKey: "orders.filter_all" },
  { key: "pending", labelKey: "orders.filter_pending" },
  { key: "processing", labelKey: "orders.filter_processing" },
  { key: "completed", labelKey: "orders.filter_completed" },
  { key: "cancelled", labelKey: "orders.filter_cancelled" },
];

function translateStatus(status, t) {
  const key = `orders.status_${status?.toLowerCase()}`;
  return t(key, status);
}

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");
  const { t, i18n } = useTranslation();

  useEffect(() => {
    (async () => {
      try {
        const data = await orderService.listOrders();
        setOrders(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filteredOrders = activeFilter === "all"
    ? orders
    : orders.filter((o) => o.status?.toLowerCase() === activeFilter);

  const getCount = (key) =>
    key === "all" ? orders.length : orders.filter((o) => o.status?.toLowerCase() === key).length;

  /* ── Loading skeletons ── */
  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <h1>{t("orders.title")}</h1>
          </div>
        </div>
        <div className={styles.list}>
          {[1, 2, 3].map((i) => <div key={i} className={styles.skeleton} />)}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* ── Header ── */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1>{t("orders.title")}</h1>
          <p className={styles.headerSub}>
            {orders.length > 0
              ? `${orders.length} ${t("orders.total_orders") || "طلب"}`
              : t("orders.empty_title")}
          </p>
        </div>
      </div>

      {/* ── Filter Tabs ── */}
      {orders.length > 0 && (
        <div className={styles.filterTabs}>
          {FILTER_TABS.map(({ key, labelKey }) => (
            <button
              key={key}
              className={`${styles.filterTab} ${activeFilter === key ? styles.filterTabActive : ""}`}
              onClick={() => setActiveFilter(key)}
            >
              {t(labelKey, key.charAt(0).toUpperCase() + key.slice(1))}
              <span className={styles.filterCount}>({getCount(key)})</span>
            </button>
          ))}
        </div>
      )}

      {/* ── Empty State ── */}
      {filteredOrders.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>📦</div>
          <h3 className={styles.emptyTitle}>{t("orders.empty_title")}</h3>
          <p className={styles.emptyDesc}>{t("orders.empty_desc")}</p>
          <Link to="/products" className={styles.viewBtn}>
            {t("home.hero.shop_new") || "تسوق الآن"}
          </Link>
        </div>
      ) : (
        /* ── Orders List ── */
        <div className={styles.list}>
          {filteredOrders.map((o) => {
            const statusClass = STATUS_MAP[o.status?.toLowerCase()] || "statusPending";
            return (
              <div key={o.id} className={styles.card}>
                {/* Card top bar */}
                <div className={styles.cardTop}>
                  <div>
                    <span className={styles.orderId}>#{o.id}</span>
                    <span className={styles.orderDate}>
                      {" — "}
                      {new Date(o.created_at || Date.now()).toLocaleDateString(
                        i18n.language === "ar" ? "ar-EG" : "en-US",
                        { year: "numeric", month: "short", day: "numeric" }
                      )}
                    </span>
                  </div>
                  <span className={`${styles.statusBadge} ${styles[statusClass]}`}>
                    <span className={styles.statusDot} />
                    {translateStatus(o.status, t)}
                  </span>
                </div>

                {/* Card body */}
                <div className={styles.cardBody}>
                  {/* Items thumbnails */}
                  <div className={styles.itemsPreview}>
                    {(o.items || []).slice(0, 3).map((item, i) => (
                      <img
                        key={i}
                        src={item.image || "/placeholder.png"}
                        alt={item.product_name || ""}
                        className={styles.itemThumb}
                        loading="lazy"
                      />
                    ))}
                    {(o.items?.length || 0) > 3 && (
                      <span className={styles.moreItems}>+{o.items.length - 3}</span>
                    )}
                  </div>

                  {/* Details */}
                  <div className={styles.detailsRow}>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>{t("orders.items_count")}</span>
                      <span className={styles.detailValue}>{o.items?.length || 0}</span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>{t("orders.total")}</span>
                      <span className={styles.detailPrice}>
                        {o.total_amount?.toFixed(0)} {t("common.currency")}
                      </span>
                    </div>
                  </div>

                  {/* Action */}
                  <div className={styles.cardActions}>
                    <Link to={`/support?dispute_order=${o.id}`} className={styles.reportBtn} style={{ color: 'var(--danger)', fontWeight: '600', textDecoration: 'none', marginRight: 'auto' }}>
                      {t("orders.report_issue") || "الإبلاغ عن مشكلة"}
                    </Link>
                    <Link to={`/orders/${o.id}`} className={styles.viewBtn}>
                      {t("common.view_details")} →
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
