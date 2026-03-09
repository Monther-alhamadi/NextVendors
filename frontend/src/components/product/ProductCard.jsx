import React from "react";
import PropTypes from "prop-types";
import CustomButton from "../common/CustomButton";
import { Link } from "react-router-dom";
import OptimizedImage from "../OptimizedImage";
import { CartIcon } from "../common/Icons";
import styles from "./ProductCard.module.css";
import Badge from "../common/Badge";
import { useTranslation } from "react-i18next";
import useCompareStore from "../../store/compareStore";
import { useToast } from "../common/ToastProvider";

export default function ProductCard({ product, onAddToCart }) {
  const { t } = useTranslation();
  const toast = useToast();
  const { items: compareItems, toggleItem: toggleCompare } = useCompareStore();
  const isCompared = compareItems.some((i) => i.id === product?.id);

  if (!product) return null;

  const category = product.category || t("common.general") || "General";
  const name = product.name || product.title || t("common.unnamed_product") || "Unnamed Product";
  const price = typeof product.price === "number" ? product.price : parseFloat(product.price) || 0;
  const oldPrice = product.old_price || product.original_price || null;
  const discount = oldPrice && oldPrice > price ? Math.round(((oldPrice - price) / oldPrice) * 100) : null;
  const vendorName = product.supplier_name || product.store_name || null;
  const rating = product.rating || 0;

  // Image URL
  let imageUrl = "/placeholder.png";
  if (Array.isArray(product.images) && product.images.length > 0) {
    const firstImg = product.images[0];
    imageUrl = typeof firstImg === "string" ? firstImg : (firstImg?.url || "/placeholder.png");
  } else if (product.image_url) {
    imageUrl = product.image_url;
  }

  // Stars helper
  const fullStars = Math.floor(rating);
  const starsStr = "★".repeat(fullStars) + "☆".repeat(5 - fullStars);

  return (
    <div className={styles.productCard}>
      <div className={styles.badges}>
        {discount && <Badge variant="sale">-{discount}%</Badge>}
        {(product.is_new || (Array.isArray(product.tags) && product.tags.includes("new"))) && (
          <Badge variant="new">{t("product.new")}</Badge>
        )}
      </div>

      <Link
        to={`/products/${product.id || "#"}`}
        className={styles.imageWrapper}
        aria-label={`${t("common.view_details") || "View"} ${name}`}
      >
        <OptimizedImage className={styles.image} src={imageUrl} alt={name} />
        
        {/* Compare Button */}
        <button 
          className={styles.compareBtn}
          onClick={(e) => {
            e.preventDefault();
            const res = toggleCompare(product);
            if (res.error) {
              toast.push({ message: res.error, duration: 2500 });
            } else {
              toast.push({ 
                message: res.added ? (t("compare.added") || "تمت إضافته للمقارنة") : (t("compare.removed") || "تمت إزالته من المقارنة"), 
                duration: 2000 
              });
            }
          }}
          aria-label="Compare"
          title={t("compare.title") || "مقارنة"}
        >
          <span style={{ opacity: isCompared ? 1 : 0.6 }}>⚖️</span>
        </button>

        <div className={styles.quickAddOverlay}>
          <CustomButton
            variant="primary"
            size="sm"
            onClick={(e) => {
              e.preventDefault();
              if (onAddToCart) onAddToCart(product);
            }}
          >
            {t("product.add_to_cart") || "Add to Cart"}
          </CustomButton>
        </div>
      </Link>

      <div className={styles.productBody}>
        <div className={styles.category}>{category}</div>

        <Link to={`/products/${product.id || "#"}`} style={{ textDecoration: "none", color: "inherit" }}>
          <h3 className={styles.productTitle}>{name}</h3>
        </Link>

        {/* Vendor name */}
        {vendorName && (
          <div className={styles.vendorName}>
            <span className={styles.vendorDot} />
            {vendorName}
          </div>
        )}

        {/* Rating */}
        {rating > 0 && (
          <div className={styles.ratingRow}>
            <span className={styles.stars}>{starsStr}</span>
            {product.review_count > 0 && (
              <span className={styles.ratingCount}>({product.review_count})</span>
            )}
          </div>
        )}

        <div className={styles.metaRow}>
          <div className={styles.priceGroup}>
            <div className={styles.price}>
              {price.toFixed(0)} <span className={styles.currency}>{t("common.currency") || "SAR"}</span>
            </div>
            {oldPrice && oldPrice > price && (
              <span className={styles.priceOld}>
                {oldPrice.toFixed(0)} {t("common.currency")}
              </span>
            )}
          </div>

          {discount && <span className={styles.discountBadge}>-{discount}%</span>}
        </div>
      </div>
    </div>
  );
}

ProductCard.propTypes = {
  product: PropTypes.object.isRequired,
  onAddToCart: PropTypes.func,
};
