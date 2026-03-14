import React from "react";
import { useTranslation } from "react-i18next";
import ProductCard from "./ProductCard";
import styles from "./ProductGrid.module.css";
import ComponentErrorBoundary from "../common/ComponentErrorBoundary";

export default function ProductGrid({ products = [], onAddToCart }) {
  const { t } = useTranslation();
  
  // Defensive: Filter out products that are null or missing critical fields to prevent crash
  const validProducts = Array.isArray(products) 
    ? products.filter(p => p && p.id && (p.name || p.title)) 
    : [];

  if (!validProducts.length) return <div className={styles.empty}>{t('product.no_products_available', 'لا توجد منتجات متاحة حالياً')}</div>;

  return (
    <div className={styles.grid}>
      {validProducts.map((p) => (
        <ComponentErrorBoundary key={p.id} fallback={<div className={styles.cardError}>{t('product.card_render_error', '⚠️ خطأ في عرض المنتج')}</div>}>
          <ProductCard product={p} onAddToCart={onAddToCart} />
        </ComponentErrorBoundary>
      ))}
    </div>
  );
}
