import React, { useEffect, useState, useRef, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import cartStore from "../../store/cartStore";
import { useAuth } from "../../store/authStore.jsx";
import ThemeToggle from "./ThemeToggle";
import styles from "./Header.module.css";
import { SearchIcon } from "./Icons";
import SearchSuggestions from "./SearchSuggestions";
import { debounce } from "../../utils/debounce";
import { useTranslation } from "react-i18next";
import NotificationHub from "./NotificationHub";
import { trackVisit } from "../../services/affiliateService";
import { getUnreadCount } from "../../services/messagingService";

/* ─── SVG Icons ──────────────────────────────────────────── */
const CartIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
    <path d="M1 1h4l2.68 13.39a2 2 0 001.99 1.61h9.72a2 2 0 001.96-1.61L23 6H6"/>
  </svg>
);
const UserIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);
const MenuIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12h18M3 6h18M3 18h18"/>
  </svg>
);
const CloseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6L6 18M6 6l12 12"/>
  </svg>
);
const HeartIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
  </svg>
);
const PackageIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
  </svg>
);
const SettingsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06A1.65 1.65 0 009 4.6a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
  </svg>
);
const LogoutIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);
const StoreIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);

/* ─── Mobile drawer nav items ───────────────────────────── */
const MOBILE_NAV = [
  { to: "/", icon: "🏠", labelKey: "nav.home" },
  { to: "/products", icon: "🛍️", labelKey: "nav.products" },
  { to: "/cart", icon: "🛒", labelKey: "nav.cart", isCart: true },
  { to: "/wishlist", icon: "❤️", labelKey: "nav.wishlist" },
  { to: "/orders", icon: "📦", labelKey: "nav.orders", auth: true },
  { to: "/about", icon: "ℹ️", labelKey: "footer.about" },
  { to: "/contact", icon: "📞", labelKey: "footer.contact" },
];

export default function Header() {
  const [count, setCount] = useState(cartStore.items.length);
  const { accessToken, logout, user } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadMsg, setUnreadMsg] = useState(0);
  const { t, i18n } = useTranslation();
  const menuRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const isRtl = i18n.language === "ar";

  /* ── Cart count ── */
  useEffect(() => {
    const unsub = cartStore.subscribe(() => setCount(cartStore.items.length));
    if (accessToken) {
      loadUnread();
      const interval = setInterval(loadUnread, 30000);
      return () => { unsub(); clearInterval(interval); };
    }
    return () => unsub();
  }, [accessToken]);

  async function loadUnread() {
    try { const data = await getUnreadCount(); setUnreadMsg(data.count); } catch (e) {}
  }

  /* ── RTL ── */
  useEffect(() => {
    const root = document.documentElement || document.body;
    if (isRtl) { root.setAttribute("dir", "rtl"); root.classList.add("rtl"); }
    else { root.setAttribute("dir", "ltr"); root.classList.remove("rtl"); }
  }, [isRtl]);

  const toggleLang = () => i18n.changeLanguage(i18n.language === "ar" ? "en" : "ar");

  /* ── Search ── */
  const [q, setQ] = useState(() => {
    try { return new URLSearchParams(location.search).get("q") || ""; } catch { return ""; }
  });

  const debouncedNav = useRef(
    debounce((value) => {
      const params = new URLSearchParams(location.search);
      if (value) params.set("q", value); else params.delete("q");
      navigate({ pathname: "/", search: params.toString() });
    }, 300)
  ).current;

  function onSearchChange(e) { const val = e.target.value; setQ(val); debouncedNav(val); }

  /* ── Affiliate tracking ── */
  useEffect(() => {
    const ref = new URLSearchParams(location.search).get("ref");
    if (ref) trackVisit(ref);
  }, [location.search]);

  /* ── Close menu on outside click ── */
  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false);
    }
    if (showMenu) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showMenu]);

  /* ── Close mobile drawer on route change ── */
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const userInitial = user?.username?.charAt(0)?.toUpperCase() || "?";

  return (
    <nav className={styles.nav}>
      <div className={styles.container}>
        {/* ── Mobile toggle ── */}
        <button
          className={styles.mobileToggle}
          aria-controls="mobile-nav"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((s) => !s)}
        >
          <span className="sr-only">{t("common.open_menu")}</span>
          {mobileOpen ? <CloseIcon /> : <MenuIcon />}
        </button>

        {/* ── Brand / Logo ── */}
        <Link to="/" className={styles.brand}>
          <span className={styles.logoIcon}>
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="8" fill="var(--primary)"/>
              <path d="M8 12l8-5 8 5v10a1 1 0 01-1 1H9a1 1 0 01-1-1V12z" stroke="white" strokeWidth="2" fill="none"/>
              <path d="M13 23v-6h6v6" stroke="var(--accent)" strokeWidth="2" fill="none"/>
            </svg>
          </span>
          <span className={styles.brandText}>
            <span className={styles.brandName}>{t("app.name") || "المتجر"}</span>
            <span className={styles.brandTag}>{t("home.store_tag", "STORE")}</span>
          </span>
        </Link>

        {/* ── Search bar (desktop) ── */}
        <div className={styles.searchRow}>
          <span className={styles.searchIconWrapper}><SearchIcon /></span>
          <input
            id="site-search"
            className="search-input"
            placeholder={t("nav.search_placeholder")}
            aria-label={t("nav.search_placeholder")}
            aria-controls="site-search-listbox"
            aria-expanded={q && q.length >= 2 ? "true" : "false"}
            value={q}
            onChange={onSearchChange}
          />
          <div className={styles.suggestionsContainer}>
            <SearchSuggestions q={q} inputId="site-search" />
          </div>
        </div>

        {/* ── Actions ── */}
        <div className={styles.actions}>
          {/* Language toggle */}
          <button onClick={toggleLang} className={styles.langBtn} aria-label={t("common.switch_language")}>
            {i18n.language === "ar" ? "EN" : "عربي"}
          </button>

          {/* Desktop nav links */}
          <Link to="/" className={styles.navLink}>{t("nav.home")}</Link>
          <Link to="/products" className={styles.navLink}>{t("nav.products")}</Link>

          {user?.role === "admin" && (
            <Link to="/admin" className={`${styles.navLink} ${styles.accentLink}`}>{t("nav.dashboard")}</Link>
          )}
          {user?.is_vendor && (
            <Link to="/supplier" className={`${styles.navLink} ${styles.accentLink}`}>{t("nav.vendor_dashboard")}</Link>
          )}

          {/* Messages */}
          {accessToken && (
            <Link to="/messages" className={styles.iconBtn} title={t("nav.messages")}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
              </svg>
              {unreadMsg > 0 && <span className={styles.iconBadge}>{unreadMsg > 9 ? "9+" : unreadMsg}</span>}
            </Link>
          )}

          {/* Notifications */}
          {accessToken && <NotificationHub />}

          {/* Wishlist icon (desktop) */}
          <Link to="/wishlist" className={`${styles.iconBtn} ${styles.desktopOnly}`} aria-label={t("nav.wishlist")}>
            <HeartIcon />
          </Link>

          {/* Cart icon */}
          <Link to="/cart" className={styles.cartBtn} aria-label={t("nav.cart")}>
            <CartIcon />
            {count > 0 && (
              <span className={styles.cartBadge}>{count > 9 ? "9+" : count}</span>
            )}
          </Link>

          {/* Profile / Auth */}
          {accessToken ? (
            <div className={styles.profileWrapper} ref={menuRef}>
              <button
                className={styles.avatarBtn}
                onClick={() => setShowMenu((s) => !s)}
                aria-label={t("nav.profile")}
                aria-expanded={showMenu}
                aria-haspopup="menu"
              >
                <span className={styles.avatarCircle}>{userInitial}</span>
              </button>

              {showMenu && (
                <div className={styles.menuPopover}>
                  {/* User info header */}
                  <div className={styles.menuUserInfo}>
                    <span className={styles.menuAvatar}>{userInitial}</span>
                    <div>
                      <div className={styles.menuUserName}>{user?.username}</div>
                      <div className={styles.menuUserRole}>
                        {user?.role === "admin" ? t("profile.admin") : t("profile.member")}
                      </div>
                    </div>
                  </div>

                  <div className={styles.menuDivider} />

                  <div className={styles.menuInner}>
                    <Link to="/profile" className={styles.menuItem}>
                      <UserIcon /> {t("nav.profile")}
                    </Link>
                    <Link to="/orders" className={styles.menuItem}>
                      <PackageIcon /> {t("nav.orders")}
                    </Link>
                    <Link to="/wishlist" className={styles.menuItem}>
                      <HeartIcon /> {t("nav.wishlist")}
                    </Link>
                    {user?.role === "admin" ? (
                      <Link to="/admin" className={styles.menuItem}>
                        <SettingsIcon /> {t("nav.dashboard")}
                      </Link>
                    ) : user?.is_vendor ? (
                      <Link to="/supplier" className={styles.menuItem}>
                        <StoreIcon /> {t("nav.vendor_dashboard")}
                      </Link>
                    ) : (
                      <Link to="/become-vendor" className={styles.menuItem}>
                        <StoreIcon /> {t("nav.become_seller")}
                      </Link>
                    )}
                  </div>

                  <div className={styles.menuDivider} />

                  <button
                    type="button"
                    onClick={() => { logout(); navigate("/login"); }}
                    className={styles.menuLogout}
                  >
                    <LogoutIcon /> {t("nav.logout")}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className={styles.loginBtn}>
              <UserIcon />
              <span>{t("nav.login")}</span>
            </Link>
          )}

          <ThemeToggle />
        </div>

        {/* ── Mobile Drawer ── */}
        {mobileOpen && (
          <>
            <div className={styles.mobileOverlay} onClick={() => setMobileOpen(false)} />
            <div id="mobile-nav" className={styles.mobileNav} aria-hidden={!mobileOpen}>

              {/* User card */}
              {accessToken && user && (
                <div className={styles.mobileUserCard}>
                  <span className={styles.mobileUserAvatar}>{userInitial}</span>
                  <div>
                    <div className={styles.mobileUserName}>{user.username}</div>
                    <div className={styles.mobileUserRole}>
                      {user.role === "admin" ? t("profile.admin") : t("profile.member")}
                    </div>
                  </div>
                </div>
              )}

              {/* Search (mobile) */}
              <div className={styles.mobileSearch}>
                <SearchIcon />
                <input
                  placeholder={t("nav.search_placeholder")}
                  value={q}
                  onChange={onSearchChange}
                  className={styles.mobileSearchInput}
                />
              </div>

              {/* Nav links */}
              <div className={styles.mobileNavContent}>
                {MOBILE_NAV.map(({ to, icon, labelKey, isCart, auth }) => {
                  if (auth && !accessToken) return null;
                  return (
                    <Link
                      key={labelKey}
                      to={to}
                      className={`${styles.mobileNavItem} ${location.pathname === to ? styles.mobileNavActive : ""}`}
                      onClick={() => setMobileOpen(false)}
                    >
                      <span className={styles.mobileNavIcon}>{icon}</span>
                      <span>{t(labelKey)}</span>
                      {isCart && count > 0 && <span className={styles.mobileNavBadge}>{count}</span>}
                    </Link>
                  );
                })}
              </div>

              {/* Vendor / Admin links */}
              {user?.role === "admin" && (
                <Link to="/admin" className={styles.mobileSpecialLink} onClick={() => setMobileOpen(false)}>
                  ⚙️ {t("nav.dashboard")}
                </Link>
              )}
              {user?.is_vendor && (
                <Link to="/supplier" className={styles.mobileSpecialLink} onClick={() => setMobileOpen(false)}>
                  🏪 {t("nav.vendor_dashboard")}
                </Link>
              )}

              {/* Auth buttons */}
              <div className={styles.mobileFooter}>
                {!accessToken ? (
                  <>
                    <Link to="/login" className={styles.mobileLoginBtn} onClick={() => setMobileOpen(false)}>
                      {t("nav.login")}
                    </Link>
                    <Link to="/register" className={styles.mobileRegisterBtn} onClick={() => setMobileOpen(false)}>
                      {t("nav.register")}
                    </Link>
                  </>
                ) : (
                  <button
                    onClick={() => { logout(); navigate("/login"); setMobileOpen(false); }}
                    className={styles.mobileLogoutBtn}
                  >
                    <LogoutIcon /> {t("nav.logout")}
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </nav>
  );
}
