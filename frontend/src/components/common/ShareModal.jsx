import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../store/authStore";
import styles from "./ShareModal.module.css";

export default function ShareModal({ isOpen, onClose, product, url }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState("");

  useEffect(() => {
    if (!product) return;
    
    // Generate URL: Use provided URL or current window URL, and append ref if user is affiliate
    let base = url || window.location.href;
    if (user?.is_affiliate && user?.id) {
       const sep = base.includes("?") ? "&" : "?";
       base = `${base}${sep}ref=${user.id}`;
    }
    setShareUrl(base);
  }, [product, url, user]);

  if (!isOpen || !product) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error("Failed to copy", e);
    }
  };

  const shareText = `${t("product.share_text") || "اكتشف هذا المنتج الرائع:"} ${product.name}`;

  const openPopup = (href) => {
    window.open(href, "shareWindow", "height=450, width=550, top=100, left=100, toolbar=0, location=0, menubar=0, directories=0, scrollbars=0");
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose} aria-label={t("common.close")}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="18 6 6 18"/><polyline points="6 6 18 18"/>
          </svg>
        </button>

        <h3 className={styles.title}>{t("product.share_product") || "مشاركة المنتج"}</h3>

        <div className={styles.productInfo}>
          <img 
             src={product.image || product.images?.[0] || "/placeholder.png"} 
             alt={product.name} 
             className={styles.productImage} 
          />
          <div>
            <div className={styles.productName}>{product.name}</div>
            <div className={styles.productPrice}>
              {product.price?.toFixed(0)} {t("common.currency")}
            </div>
          </div>
        </div>

        <div className={styles.grid}>
          <button className={styles.shareBtn} onClick={() => openPopup(`https://wa.me/?text=${encodeURIComponent(shareText + " " + shareUrl)}`)}>
            <div className={`${styles.iconWrapper} ${styles.iconWhatsapp}`}>
              {/* WhatsApp SVG path */}
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
            </div>
            <span className={styles.shareLabel}>WhatsApp</span>
          </button>

          <button className={styles.shareBtn} onClick={() => openPopup(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`)}>
            <div className={`${styles.iconWrapper} ${styles.iconTwitter}`}>
              {/* X/Twitter SVG path */}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </div>
            <span className={styles.shareLabel}>X</span>
          </button>

          <button className={styles.shareBtn} onClick={() => openPopup(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`)}>
            <div className={`${styles.iconWrapper} ${styles.iconFacebook}`}>
              {/* Facebook SVG path */}
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            </div>
            <span className={styles.shareLabel}>Facebook</span>
          </button>

          <button className={styles.shareBtn} onClick={() => openPopup(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`)}>
            <div className={`${styles.iconWrapper} ${styles.iconTelegram}`}>
              {/* Telegram SVG path */}
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M12 24c6.627 0 12-5.373 12-12S18.627 0 12 0 0 5.373 0 12s5.373 12 12 12zm5.894-15.04l-2.028 9.544c-.15.68-.553.847-1.12.528l-3.097-2.284-1.496 1.44c-.166.166-.305.305-.625.305l.222-3.14 5.717-5.163c.249-.222-.054-.345-.386-.123L7.994 14.5l-3.045_.952c-.662.207-.674-.662.138-.98l11.88-4.577c.55-.205 1.037.126.85.952z"/></svg>
            </div>
            <span className={styles.shareLabel}>Telegram</span>
          </button>
        </div>

        <div className={styles.copyArea}>
          <input type="text" value={shareUrl} readOnly className={styles.copyInput} />
          <button 
             className={`${styles.copyBtn} ${copied ? styles.copyBtnCopied : ""}`} 
             onClick={handleCopy}
          >
            {copied ? (t("common.copied") || "تم النسخ ✓") : (t("common.copy") || "نسخ")}
          </button>
        </div>
      </div>
    </div>
  );
}
