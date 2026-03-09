import React from "react";
import { useAuth } from "../store/authStore.jsx";
import { Link } from "react-router-dom";
import CustomButton from "../components/common/CustomButton";
import { useTranslation } from "react-i18next";
import styles from "./Profile.module.css";

export default function Profile() {
  const { user, logout } = useAuth();
  const { t } = useTranslation();

  if (!user) {
    return (
      <div className={styles.loginRequired}>
        <div className={styles.loginCard}>
          <h2>{t("profile.login_required")}</h2>
          <p>{t("profile.login_desc")}</p>
          <Link to="/login">
            <CustomButton variant="primary">{t("nav.login")}</CustomButton>
          </Link>
        </div>
      </div>
    );
  }

  const userInitial = user?.username?.charAt(0)?.toUpperCase() || "?";

  const actions = [
    { key: "orders", link: "/orders", icon: "📦", label: t("nav.orders"), desc: t("profile.orders_desc") },
    { key: "addresses", link: "/profile/addresses", icon: "📍", label: t("profile.addresses"), desc: t("profile.addresses_desc") },
    { key: "wishlist", link: "/wishlist", icon: "❤️", label: t("nav.wishlist"), desc: t("profile.wishlist_desc") },
    { key: "settings", link: "/profile/settings", icon: "⚙️", label: t("profile.settings"), desc: t("profile.settings_desc") },
    { key: "messages", link: "/messages", icon: "💬", label: t("nav.messages"), desc: t("profile.messages_desc") || t("nav.messages") },
    { key: "support", link: "/support", icon: "🎧", label: t("footer.support") || "الدعم", desc: t("profile.support_desc") || "تواصل معنا" },
  ];

  return (
    <div className={styles.page}>
      {/* ── Header ── */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.headerTitle}>{t("profile.welcome")}، {user?.username || "Guest"}</h1>
          <p className={styles.headerSub}>{t("profile.welcome_sub")}</p>
        </div>
        <button onClick={logout} className={styles.logoutBtn}>
          {t("nav.logout")}
        </button>
      </div>

      {/* ── User Card ── */}
      <div className={styles.userCard}>
        <span className={styles.avatar}>{userInitial}</span>
        <div className={styles.userInfo}>
          <div className={styles.userName}>{user?.username}</div>
          <div className={styles.userEmail}>{user?.email}</div>
          <span className={styles.roleBadge}>
            {user?.role === "admin" ? `⚡ ${t("profile.admin")}` : `👤 ${t("profile.member")}`}
          </span>
        </div>
      </div>

      {/* ── Quick Access ── */}
      <h2 className={styles.sectionTitle}>{t("profile.quick_access") || "وصول سريع"}</h2>

      <div className={styles.grid}>
        {actions.map((action) => (
          <Link to={action.link} key={action.key} className={styles.dashCard}>
            <span className={styles.dashIcon}>{action.icon}</span>
            <div className={styles.dashContent}>
              <h3>{action.label}</h3>
              <p>{action.desc}</p>
            </div>
            <span className={styles.dashArrow}>←</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
