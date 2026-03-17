import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Search, Plus, Edit2, Trash2, Tag, Archive, Lock } from "lucide-react";
import s from "./VendorProducts.module.css";
import { getMyProducts } from "../services/supplierService";
import { getMyCapabilities } from "../services/vendorService";
import { useToast } from "../components/common/ToastProvider";
import Skeleton from "../components/common/Skeleton";

export default function VendorProducts() {
  const { t } = useTranslation();
  const toast = useToast();
  const navigate = useNavigate();
  
  const [products, setProducts] = useState([]);
  const [capabilities, setCapabilities] = useState(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    try {
      setLoading(true);
      const [data, caps] = await Promise.all([
        getMyProducts(),
        getMyCapabilities().catch(() => null)
      ]);
      setProducts(data || []);
      if(caps) setCapabilities(caps);
    } catch (e) {
      console.error(e);
      toast.push({ message: t('common.error_loading_data'), type: "error" });
    } finally {
      setLoading(false);
    }
  }

  // Derived state
  const displayedProducts = products.filter(p => {
    const matchesSearch = p.name?.toLowerCase().includes(search.toLowerCase()) || 
                          p.sku_vendor?.toLowerCase().includes(search.toLowerCase());
    
    let matchesFilter = true;
    if (filter === "active") matchesFilter = p.status === "published";
    if (filter === "draft") matchesFilter = p.status === "draft";
    if (filter === "out_of_stock") matchesFilter = p.inventory <= 0;

    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: products.length,
    active: products.filter(p => p.status === "published" && p.inventory > 0).length,
    drafts: products.filter(p => p.status === "draft").length,
    outOfStock: products.filter(p => p.inventory <= 0).length,
  };

  const isLimitReached = capabilities && capabilities.max_products <= products.length;

  return (
    <div className={s.page}>
      {/* Header */}
      <div className={s.header}>
        <div>
          <h1 className={s.title}>{t('vendor.my_products', 'منتجاتي')}</h1>
          <p className={s.subtitle}>{t('vendor.products_subtitle', 'إدارة الكتالوج الخاص بك والمخزون والتسعير.')}</p>
        </div>
        {isLimitReached ? (
           <button 
             className={s.addBtn} 
             style={{ backgroundColor: 'var(--bg-body)', color: 'var(--text-muted)', border: '1px solid var(--border-light)', cursor: 'not-allowed' }}
             onClick={() => {
                toast.push({ message: t('vendor.product_limit_reached', 'تم الوصول للحد الأقصى للمنتجات. قم بالترقية لإضافة المزيد!'), type: 'warning' });
                navigate('/vendor/plans');
             }}
           >
             <Lock size={18} />
             {t('vendor.add_new', 'إضافة منتج')}
           </button>
        ) : (
          <Link to="/vendor/products/add" className={s.addBtn}>
            <Plus size={18} />
            {t('vendor.add_new', 'إضافة منتج')}
          </Link>
        )}
      </div>

      {/* Stats Cards */}
      <div className={s.statsGrid}>
        <div className={s.statCard}>
          <div className={s.statIconWrap} style={{ color: "var(--clr-indigo-600)", background: "var(--clr-indigo-50)" }}>
            <Tag size={20} />
          </div>
          <div>
            <div className={s.statLabel}>{t('vendor.stat_total', 'إجمالي المنتجات')}</div>
            <div className={s.statValue}>{stats.total}</div>
          </div>
        </div>
        <div className={s.statCard}>
          <div className={s.statIconWrap} style={{ color: "var(--clr-green-600)", background: "var(--clr-green-50)" }}>
             <Tag size={20} />
          </div>
          <div>
            <div className={s.statLabel}>{t('vendor.stat_active', 'نشط ومتوفر')}</div>
            <div className={s.statValue}>{stats.active}</div>
          </div>
        </div>
        <div className={s.statCard}>
          <div className={s.statIconWrap} style={{ color: "var(--text-muted)", background: "var(--bg-page)" }}>
             <Archive size={20} />
          </div>
          <div>
            <div className={s.statLabel}>{t('vendor.stat_drafts', 'مسودات')}</div>
            <div className={s.statValue}>{stats.drafts}</div>
          </div>
        </div>
        <div className={s.statCard}>
          <div className={s.statIconWrap} style={{ color: "var(--clr-red-600)", background: "var(--clr-red-50)" }}>
             <Archive size={20} />
          </div>
          <div>
            <div className={s.statLabel}>{t('vendor.stat_out_of_stock', 'نفذت الكمية')}</div>
            <div className={s.statValue}>{stats.outOfStock}</div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className={s.toolbar}>
        <div className={s.filters}>
          <button className={`${s.filterBtn} ${filter === 'all' ? s.active : ''}`} onClick={() => setFilter('all')}>{t('common.all', 'الكل')}</button>
          <button className={`${s.filterBtn} ${filter === 'active' ? s.active : ''}`} onClick={() => setFilter('active')}>{t('vendor.filter_active', 'نشط')}</button>
          <button className={`${s.filterBtn} ${filter === 'draft' ? s.active : ''}`} onClick={() => setFilter('draft')}>{t('vendor.filter_drafts', 'مسودات')}</button>
          <button className={`${s.filterBtn} ${filter === 'out_of_stock' ? s.active : ''}`} onClick={() => setFilter('out_of_stock')}>{t('vendor.filter_out_of_stock', 'نفذت الكمية')}</button>
        </div>
        <div className={s.searchBox}>
          <Search size={16} className={s.searchIcon} />
          <input 
            type="text" 
            placeholder={t('nav.search_placeholder', 'بحث عن منتج...')} 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={s.searchInput}
          />
        </div>
      </div>

      {/* Table */}
      <div className={s.tableWrap}>
        <table className={s.table}>
          <thead>
            <tr>
              <th>{t('vendor.col_product', 'المنتج')}</th>
              <th>SKU</th>
              <th>{t('vendor.col_status', 'الحالة')}</th>
              <th>{t('vendor.col_price', 'السعر')}</th>
              <th>{t('vendor.col_inventory', 'المخزون')}</th>
              <th className={s.actionsCol}>{t('vendor.col_actions', 'إجراءات')}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
               [1,2,3,4,5].map(i => (
                 <tr key={i}>
                   <td>
                     <div className={s.productCol}>
                       <Skeleton width="48px" height="48px" borderRadius="8px" />
                       <div>
                         <Skeleton width="120px" height="16px" style={{marginBottom: 4}} />
                         <Skeleton width="80px" height="12px" />
                       </div>
                     </div>
                   </td>
                   <td><Skeleton width="60px" height="16px" /></td>
                   <td><Skeleton width="70px" height="24px" borderRadius="999px" /></td>
                   <td><Skeleton width="50px" height="16px" /></td>
                   <td><Skeleton width="40px" height="24px" borderRadius="12px" /></td>
                   <td><Skeleton width="32px" height="32px" borderRadius="8px" /></td>
                 </tr>
               ))
            ) : displayedProducts.length === 0 ? (
               <tr>
                 <td colSpan="6" className={s.emptyRow}>
                    <div className={s.emptyState}>
                      <span className={s.emptyIcon}>📦</span>
                      <h3>{t('vendor.no_products', 'لا توجد منتجات')}</h3>
                      <p>{t('vendor.no_products_desc', 'لم نتمكن من العثور على أي منتجات تطابق بحثك أو الفلتر المستخدم.')}</p>
                      <Link to="/vendor/products/add" className={s.addBtnEmpty}>
                        {t('vendor.add_new', 'إضافة منتج جديد')}
                      </Link>
                    </div>
                 </td>
               </tr>
            ) : (
                displayedProducts.map((p, i) => (
                  <tr key={p.product_id || i} className={s.tableRow} style={{ animationDelay: `${i * 0.05}s` }}>
                    <td>
                      <div className={s.productCol}>
                        <div className={s.imgBox}>
                           {p.image ? <img src={p.image} alt={p.name} /> : "🖼️"}
                        </div>
                        <div className={s.productMeta}>
                          <span className={s.productName}>{p.name}</span>
                          <span className={s.productCategory}>{p.category}</span>
                        </div>
                      </div>
                    </td>
                    <td className={s.skuTxt}>{p.sku_vendor || '-'}</td>
                    <td>
                      <span className={`${s.badge} ${p.status === 'draft' ? s.draft : s.published}`}>
                         {p.status === 'draft' ? t('vendor.status_draft', 'مسودة') : t('vendor.status_active', 'نشط')}
                      </span>
                    </td>
                    <td className={s.priceTxt}>{p.cost_price?.toFixed(2)} {t('common.currency', 'ر.س')}</td>
                    <td>
                      <span className={`${s.stockBadge} ${p.inventory > 0 ? s.inStock : s.outOfStock}`}>
                        {p.inventory}
                      </span>
                    </td>
                    <td>
                      <div className={s.actions}>
                        <button className={s.actionBtn} aria-label={t('common.edit', 'تعديل')} title={t('common.edit', 'تعديل')}>
                          <Edit2 size={16} />
                        </button>
                        <button className={`${s.actionBtn} ${s.danger}`} aria-label={t('common.delete', 'حذف')} title={t('common.delete', 'حذف')}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
