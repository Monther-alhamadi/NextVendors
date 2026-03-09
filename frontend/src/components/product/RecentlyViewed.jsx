import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import useRecentStore from "../../store/recentStore";
import styles from "./RecentlyViewed.module.css";

export default function RecentlyViewed({ currentProductId }) {
  const { items, clear } = useRecentStore();
  const { t } = useTranslation();

  // Filter out the current product from the list to avoid showing what they are currently looking at
  const filteredItems = items.filter((p) => String(p.id) !== String(currentProductId));

  if (filteredItems.length === 0) return null;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>
          <span className={styles.titleIcon}>👀</span>
          {t("product.recently_viewed") || "شوهد مؤخراً"}
        </h3>
        <button className={styles.clearBtn} onClick={clear}>
          {t("common.clear") || "مسح السجل"}
        </button>
      </div>

      <div className={styles.scrollTrack}>
        {filteredItems.map((p) => (
          <Link to={`/products/${p.id}`} key={p.id} className={styles.card}>
            <div className={styles.imageArea}>
              <img 
                src={p.image || "/placeholder.png"} 
                alt={p.name} 
                className={styles.image} 
                loading="lazy" 
              />
            </div>
            <div className={styles.content}>
              <div className={styles.name}>{p.name}</div>
              {p.vendor_name && <div className={styles.vendor}>{p.vendor_name}</div>}
              <div className={styles.price}>
                {p.price?.toFixed(0)} {t("common.currency")}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
