import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ProductCard from '../product/ProductCard';
import { listProducts } from '../../services/productService';

export function SliderWidget({ config }) {
  const { t } = useTranslation();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);
        // Build query based on config
        const params = {};
        if (config.categoryId) params.category = config.categoryId;
        if (config.limit) params.limit = config.limit;
        
        const data = await listProducts(params);
        setProducts(data.items || data); // ensure standard format
      } catch (e) {
        console.error("Failed loading slider products:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, [config.categoryId, config.limit]);

  return (
    <section 
      style={{
        padding: '3rem 5%',
        background: config.bg_color || 'transparent',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
        <div>
           <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 0.5rem' }}>
             {config.title || t('landing.featured_products', "عروضنا المميزة")}
           </h2>
           {config.subtitle && <p style={{ color: 'var(--text-muted)', margin: 0 }}>{config.subtitle}</p>}
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
           {[1, 2, 3, 4].map(i => (
             <div key={i} style={{ height: '400px', background: 'var(--surface-alt)', borderRadius: '16px', animation: 'pulse 1.5s infinite ease-in-out' }} />
           ))}
        </div>
      ) : products.length > 0 ? (
        <div 
          style={{ 
            display: 'flex', 
            gap: '1.5rem', 
            overflowX: 'auto', 
            paddingBottom: '1rem',
            scrollSnapType: 'x mandatory',
            scrollbarWidth: 'none', /* Firefox */
          }}
          className="hide-scrollbar"
        >
          {products.map(p => (
            <div key={p.id} style={{ minWidth: '300px', scrollSnapAlign: 'start' }}>
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--surface)', borderRadius: '16px' }}>
          <p style={{ color: 'var(--text-muted)' }}>{t('common.no_products', 'لا توجد منتجات حالياً.')}</p>
        </div>
      )}
    </section>
  );
}
