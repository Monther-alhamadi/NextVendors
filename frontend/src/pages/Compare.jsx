import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getLocalizedField } from "../utils/localization";
import useCompareStore from "../store/compareStore";
import cartStore from "../store/cartStore";
import { useToast } from "../components/common/ToastProvider";
import styles from "./Compare.module.css";

export default function Compare() {
  const { items, removeItem, clear } = useCompareStore();
  const { t, i18n } = useTranslation();
  const toast = useToast();

  const handleAddToCart = (product) => {
    cartStore.addItem(product, 1);
    toast.push({ message: t("product.added_to_cart") || "تمت الإضافة للسلة", duration: 2500 });
  };

  if (!items || items.length === 0) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <h1><span style={{ fontSize: "2rem" }}>⚖️</span> {t("compare.title") || "مقارنة المنتجات"}</h1>
        </div>
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>⚖️</div>
          <h2 className={styles.emptyTitle}>{t("compare.empty_title") || "لا توجد منتجات للمقارنة"}</h2>
          <p style={{ color: "var(--text-secondary)" }}>{t("compare.empty_desc") || "أضف بعض المنتجات لمقارنة المواصفات والأسعار"}</p>
          <Link to="/products" className={styles.browseBtn}>
            🛍️ {t("wishlist.browse")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1><span style={{ fontSize: "2rem" }}>⚖️</span> {t("compare.title") || "مقارنة المنتجات"}</h1>
        <p>{items.length} / 4 {t("compare.items_added") || "منتجات مضافة"}</p>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.compareTable}>
          <tbody>
            {/* Header Row: Images & basic info */}
            <tr>
              <th>{t("product.details")}</th>
              {items.map((p) => (
                <th key={p.id} className={styles.productHeader}>
                  <button 
                    className={styles.removeBtn} 
                    onClick={() => removeItem(p.id)}
                    aria-label={t("common.delete")}
                  >
                    ✕
                  </button>
                   <Link to={`/products/${p.id}`} className={styles.imageArea}>
                    <img 
                      src={p.image || p.images?.[0] || "/placeholder.png"} 
                      alt={getLocalizedField(p, "name", i18n.language)} 
                    />
                  </Link>
                  <Link to={`/products/${p.id}`} className={styles.productName}>
                    {getLocalizedField(p, "name", i18n.language)}
                  </Link>
                  <button className={styles.cartBtn} onClick={() => handleAddToCart(p)}>
                    🛒 {t("product.add_to_cart")}
                  </button>
                </th>
              ))}
            </tr>

            {/* Price Row */}
            <tr>
              <td>{t("product.price")}</td>
              {items.map((p) => (
                <td key={p.id} className={styles.priceData}>
                  {p.price?.toFixed(0)} {t("common.currency")}
                </td>
              ))}
            </tr>

            {/* Category Row */}
            <tr>
              <td>{t("product.category") || "القسم"}</td>
              {items.map((p) => (
                <td key={p.id} style={{ textAlign: "center" }}>
                  {getLocalizedField(p, "category_name", i18n.language) || getLocalizedField(p.category, "name", i18n.language) || p.category_id || "-"}
                </td>
              ))}
            </tr>

            {/* Vendor Row */}
            <tr>
              <td>{t("product.vendor") || "البائع"}</td>
              {items.map((p) => (
                <td key={p.id} style={{ textAlign: "center" }}>
                  {p.vendor_name || "-"}
                </td>
              ))}
            </tr>

            {/* Stock Row */}
            <tr>
              <td>{t("product.availability")}</td>
              {items.map((p) => {
                const isOutOfStock = p.inventory_count <= 0;
                return (
                  <td key={p.id} className={`${styles.stockData} ${isOutOfStock ? styles.outStock : styles.inStock}`}>
                    {isOutOfStock ? t("product.out_of_stock") : t("product.in_stock")}
                  </td>
                );
              })}
            </tr>

            {/* Description Row */}
            <tr>
              <td>{t("product.description")}</td>
              {items.map((p) => {
                const desc = getLocalizedField(p, "description", i18n.language);
                return (
                  <td key={p.id} className={styles.descData}>
                    {desc ? (
                       <span>{desc.replace(/<[^>]*>/g, '').substring(0, 150)}{desc.length > 150 ? "..." : ""}</span>
                    ) : "-"}
                  </td>
                );
              })}
            </tr>

          </tbody>
        </table>
      </div>

      <div style={{ textAlign: "center", marginTop: 24 }}>
        <button 
          onClick={clear}
          style={{ background: "transparent", border: "1px dashed var(--border-medium)", padding: "10px 20px", borderRadius: 20, cursor: "pointer", color: "var(--text-secondary)" }}
        >
          {t("compare.clear_all") || "تفريغ قائمة المقارنة"}
        </button>
      </div>
    </div>
  );
}
