import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Heart, ExternalLink, BadgeCheck } from "lucide-react";
import styles from "./StoreCard.module.css";

const StoreCard = ({ store }) => {
  const { t } = useTranslation("vendor");
  const themeColor = store.theme_color || "#6366f1";

  return (
    <div className={styles.card}>
      {/* Background Banner */}
      <div
        className={styles.banner}
        style={{
          background: store.background_image_url
            ? `url(${store.background_image_url}) center/cover`
            : `linear-gradient(135deg, ${themeColor}, ${themeColor}dd)`,
        }}
      >
        <div className={styles.bannerOverlay}></div>
      </div>

      {/* Logo */}
      <div className={styles.logoWrap}>
        {store.logo_url ? (
          <img src={store.logo_url} alt={store.name} className={styles.logo} />
        ) : (
          <div className={styles.logoPlaceholder} style={{ background: themeColor }}>
            {store.name?.charAt(0)?.toUpperCase()}
          </div>
        )}
      </div>

      {/* Content */}
      <div className={styles.content}>
        <div className={styles.nameRow}>
          <h3 className={styles.name}>{store.name}</h3>
          {store.is_verified && (
            <BadgeCheck size={18} className={styles.verifiedBadge} />
          )}
        </div>

        {store.description && (
          <p className={styles.description}>
            {store.description.length > 80
              ? store.description.substring(0, 80) + "..."
              : store.description}
          </p>
        )}

        {/* Stats */}
        <div className={styles.stats}>
          <div className={styles.statItem}>
            <Heart size={14} />
            <span>{store.followers_count || 0}</span>
          </div>
        </div>

        {/* Action */}
        <Link to={`/store/${store.code || store.id}`} className={styles.visitBtn}>
          <ExternalLink size={14} />
          {t("visit_store")}
        </Link>
      </div>
    </div>
  );
};

export default StoreCard;
