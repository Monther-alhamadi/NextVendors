import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import styles from "./Footer.module.css";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  function handleSubscribe(e) {
    e.preventDefault();
    if (!email) return;
    setSubscribed(true);
    setEmail("");
    setTimeout(() => setSubscribed(false), 4000);
  }

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        {/* ── Newsletter ────────────────────────── */}
        <div className={styles.newsletter}>
          <div className={styles.nlText}>
            <h3>📬 {t("footer.newsletter_title")}</h3>
            <p>{t("footer.newsletter_desc")}</p>
          </div>
          <form onSubmit={handleSubscribe} className={styles.nlForm}>
            <input
              type="email"
              placeholder={t("footer.email_placeholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.nlInput}
              required
            />
            <button type="submit" className={styles.nlBtn}>
              {subscribed ? t("footer.subscribed") : t("footer.subscribe")}
            </button>
          </form>
        </div>

        {/* ── Grid ──────────────────────────────── */}
        <div className={styles.grid}>
          {/* Col 1: Brand */}
          <div className={styles.colBrand}>
            <div className={styles.brandMark}>
              <span className={styles.brandIcon}>
                <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
                  <path d="M8 12l8-5 8 5v10a1 1 0 01-1 1H9a1 1 0 01-1-1V12z" stroke="white" strokeWidth="2.5" fill="none"/>
                  <path d="M13 23v-6h6v6" stroke="var(--accent)" strokeWidth="2" fill="none"/>
                </svg>
              </span>
              <span className={styles.brandLabel}>{t("app.name")}</span>
            </div>
            <p className={styles.brandDesc}>
              {t("home.hero.subtitle")}
            </p>
            <div className={styles.socialRow}>
              <a href="#" className={styles.socialLink} aria-label="Twitter">𝕏</a>
              <a href="#" className={styles.socialLink} aria-label="Instagram">📷</a>
              <a href="#" className={styles.socialLink} aria-label="WhatsApp">💬</a>
              <a href="#" className={styles.socialLink} aria-label="TikTok">🎵</a>
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div>
            <h4 className={styles.colTitle}>{t("footer.quick_links")}</h4>
            <ul className={styles.colLinks}>
              <li><Link to="/">{t("nav.home")}</Link></li>
              <li><Link to="/products">{t("nav.products")}</Link></li>
              <li><Link to="/about">{t("footer.about")}</Link></li>
              <li><Link to="/contact">{t("footer.contact")}</Link></li>
            </ul>
          </div>

          {/* Col 3: Categories */}
          <div>
            <h4 className={styles.colTitle}>{t("nav.products")}</h4>
            <ul className={styles.colLinks}>
              <li><Link to="/products?category=electronics">{t("categories.electronics")}</Link></li>
              <li><Link to="/products?category=clothing">{t("categories.fashion")}</Link></li>
              <li><Link to="/products?category=home">{t("categories.home")}</Link></li>
              <li><Link to="/products?category=beauty">{t("categories.beauty")}</Link></li>
            </ul>
          </div>

          {/* Col 4: Support */}
          <div>
            <h4 className={styles.colTitle}>{t("footer.support")}</h4>
            <ul className={styles.colLinks}>
              <li><Link to="/support">{t("footer.help_center")}</Link></li>
              <li><Link to="/privacy">{t("footer.privacy")}</Link></li>
              <li><Link to="/terms">{t("footer.terms")}</Link></li>
              <li><Link to="/become-vendor">{t("nav.become_seller")}</Link></li>
            </ul>
          </div>

          {/* Col 5: Payment Methods */}
          <div>
            <h4 className={styles.colTitle}>{t("footer.payment_methods")}</h4>
            <div className={styles.paymentGrid}>
              <span className={styles.payBadge}>VISA</span>
              <span className={styles.payBadge}>MasterCard</span>
              <span className={styles.payBadge}>Mada</span>
              <span className={styles.payBadge}>Apple Pay</span>
              <span className={styles.payBadge}>STC Pay</span>
              <span className={styles.payBadge}>COD 💵</span>
            </div>
          </div>
        </div>

        {/* ── Bottom Bar ────────────────────────── */}
        <div className={styles.bottom}>
          <span className={styles.copyright}>
            © {currentYear} {t("app.name")}. {t("footer.rights")}
          </span>
          <div className={styles.bottomLinks}>
            <Link to="/privacy">{t("footer.privacy")}</Link>
            <Link to="/terms">{t("footer.terms")}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
