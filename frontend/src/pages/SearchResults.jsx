import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { listProducts } from "../services/productService";
import ProductGrid from "../components/product/ProductGrid";
import cartStore from "../store/cartStore";
import { useToast } from "../components/common/ToastProvider";
import { useTranslation } from "react-i18next";

export default function SearchResults() {
  const location = useLocation();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const { t } = useTranslation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get("q") || "";
    const limit = params.get("limit") || 24;

    setLoading(true);
    (async () => {
      try {
        const data = await listProducts(q, limit);
        setProducts(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [location.search]);

  if (loading) return <div className="container">{t('search.loading')}</div>;

  return (
    <div className="container">
      <h1>{t('search.title')}</h1>
      <ProductGrid
        products={products}
        onAddToCart={(p) => {
          cartStore.addItem(p, 1);
          toast.push({ message: t('product.added_to_cart'), duration: 3000 });
        }}
      />
    </div>
  );
}
