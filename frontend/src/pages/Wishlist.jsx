import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import cartStore from "../store/cartStore";
import { useToast } from "../components/common/ToastProvider";
import api from "../services/api";
import { useTranslation } from "react-i18next";
import { getLocalizedField } from "../utils/localization";
import styles from "./Wishlist.module.css";

function readWishlist() {
  try { const raw = localStorage.getItem("wishlist"); return raw ? JSON.parse(raw) : []; }
  catch { return []; }
}
function writeWishlist(items) { localStorage.setItem("wishlist", JSON.stringify(items)); }

async function fetchWishlistFromApi() {
  try { const res = await api.get("/wishlist"); if (res?.data) return res.data; }
  catch { /* fallback to local */ }
  return null;
}
async function saveWishlistToApi(items) {
  try { await api.post("/wishlist", { items }); return true; } catch { return false; }
}

export default function Wishlist() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const { t, i18n } = useTranslation();

  useEffect(() => {
    (async () => {
      const remote = await fetchWishlistFromApi();
      if (Array.isArray(remote)) { setItems(remote); }
      else { setItems(readWishlist()); }
      setLoading(false);
    })();
  }, []);

  function remove(id) {
    const next = items.filter((i) => i.id !== id);
    setItems(next);
    writeWishlist(next);
    saveWishlistToApi(next).catch(() => {});
  }

  function moveToCart(p) {
    cartStore.addItem(p, 1);
    remove(p.id);
    toast.push({ message: `${getLocalizedField(p, "name", i18n.language)} ${t("wishlist.moved_to_cart")}`, duration: 2500 });
  }

  function moveAllToCart() {
    items.forEach((p) => cartStore.addItem(p, 1));
    toast.push({ message: t("wishlist.all_moved") || "تم نقل الكل للسلة", duration: 2500 });
    writeWishlist([]);
    setItems([]);
    saveWishlistToApi([]).catch(() => {});
  }

  async function clearAll() {
    writeWishlist([]);
    setItems([]);
    try { await api.delete("/wishlist"); } catch {}
  }

  /* ── Empty state ── */
  if (!loading && (!items || items.length === 0)) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <div className={styles.headerLeft}><h1>❤️ {t("wishlist.title")}</h1></div>
        </div>
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>💝</div>
          <h3 className={styles.emptyTitle}>{t("wishlist.empty")}</h3>
          <p className={styles.emptyDesc}>{t("wishlist.empty_desc") || "أضف منتجاتك المفضلة هنا"}</p>
          <Link to="/products" className={styles.browseBtn}>
            🛍️ {t("wishlist.browse")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1>❤️ {t("wishlist.title")}</h1>
          <p className={styles.headerSub}>{items.length} {t("wishlist.items_count") || "منتج"}</p>
        </div>
        <div className={styles.headerActions}>
          <button onClick={moveAllToCart} className={styles.moveAllBtn}>
            🛒 {t("wishlist.move_all") || "أضف الكل للسلة"}
          </button>
          <button onClick={clearAll} className={styles.clearBtn}>
            {t("wishlist.clear")}
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className={styles.grid}>
        {items.map((p) => (
          <div key={p.id} className={styles.itemCard}>
            <button className={styles.removeBtn} onClick={() => remove(p.id)} aria-label={t("common.delete")}>
              ✕
            </button>
            <Link to={`/products/${p.id}`}>
              <img
                src={p.image || p.images?.[0] || "/placeholder.png"}
                alt={getLocalizedField(p, "name", i18n.language) || ""}
                className={styles.itemImage}
                loading="lazy"
              />
            </Link>
            <div className={styles.itemBody}>
              <div className={styles.itemName}>{getLocalizedField(p, "name", i18n.language)}</div>
              <div className={styles.itemRow}>
                <span className={styles.itemPrice}>{p.price?.toFixed(0)} {t("common.currency")}</span>
              </div>
              <button className={styles.addToCartBtn} onClick={() => moveToCart(p)}>
                🛒 {t("product.add_to_cart")}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
