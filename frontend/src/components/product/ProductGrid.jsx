import React from "react";
import ProductCard from "./ProductCard";
import styles from "./ProductGrid.module.css";
import ComponentErrorBoundary from "../common/ComponentErrorBoundary";

export default function ProductGrid({ products = [], onAddToCart }) {
  // Defensive: Filter out products that are null or missing critical fields to prevent crash
  const validProducts = Array.isArray(products) 
    ? products.filter(p => p && p.id && (p.name || p.title)) 
    : [];

  if (!validProducts.length) return <div className={styles.empty}>لا توجد منتجات متاحة حالياً</div>;

  return (
    <div className={styles.grid}>
      {validProducts.map((p) => (
        <ComponentErrorBoundary key={p.id} fallback={<div className={styles.cardError}>⚠️ خطأ في عرض المنتج</div>}>
          <ProductCard product={p} onAddToCart={onAddToCart} />
        </ComponentErrorBoundary>
      ))}
    </div>
  );
}
