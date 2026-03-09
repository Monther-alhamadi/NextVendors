/**
 * MobileBottomNav — Premium fixed navigation bar for phones (<768px)
 * Uses CSS Module + design tokens
 */
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import cartStore from "../../store/cartStore";
import styles from "./MobileBottomNav.module.css";

/* ─── SVG Icons ─────────────────────────────────────── */
const HomeIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);
const GridIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
    <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
  </svg>
);
const CartIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
    <path d="M1 1h4l2.68 13.39a2 2 0 001.99 1.61h9.72a2 2 0 001.96-1.61L23 6H6"/>
  </svg>
);
const UserIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);
const SearchIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
  </svg>
);

/* ─── Nav Items ────────────────────────────────────── */
const NAV_ITEMS = [
  { to: "/",         icon: HomeIcon,   labelKey: "nav.home" },
  { to: "/products", icon: GridIcon,   labelKey: "nav.products" },
  { to: "/products", icon: SearchIcon, labelKey: "nav.search",  isSearch: true },
  { to: "/cart",     icon: CartIcon,   labelKey: "nav.cart",    isCart: true },
  { to: "/profile",  icon: UserIcon,   labelKey: "nav.profile" },
];

export default function MobileBottomNav() {
  const { t } = useTranslation();
  const location = useLocation();
  const [cartCount, setCartCount] = React.useState(cartStore.items.length);

  React.useEffect(() => {
    return cartStore.subscribe(() => setCartCount(cartStore.items.length));
  }, []);

  return (
    <nav className={styles.bottomNav} aria-label={t("nav.quick_nav") || "تنقل سريع"}>
      {NAV_ITEMS.map(({ to, icon: Icon, labelKey, isCart }) => {
        const isActive = location.pathname === to && !(isCart && location.pathname !== "/cart");
        return (
          <Link
            key={labelKey}
            to={to}
            className={`${styles.navItem} ${isActive ? styles.navItemActive : ""}`}
            aria-label={t(labelKey)}
          >
            <span className={styles.navIcon}>
              <Icon />
              {isCart && cartCount > 0 && (
                <span className={styles.cartBadge}>
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              )}
            </span>
            <span className={styles.navLabel}>{t(labelKey)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
