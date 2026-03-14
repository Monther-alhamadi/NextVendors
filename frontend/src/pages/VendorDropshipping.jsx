import React, { useState } from 'react';
import { useTranslation } from "react-i18next";
import api from '../services/api';
import { useToast } from '../components/common/ToastProvider';
import { Search, Package, Check, ArrowRight } from 'lucide-react';
import s from './VendorDropshipping.module.css';

export default function VendorDropshipping() {
  const { t } = useTranslation();
  const [keyword, setKeyword] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [importingIds, setImportingIds] = useState({});
  const [importedIds, setImportedIds] = useState({});
  const toast = useToast();

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!keyword.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/dropshipping/search', { params: { keyword } });
      if (data.success && data.data && data.data.list) {
        setProducts(data.data.list);
        if (data.data.list.length === 0) {
          setError(t("vendor.ds_no_matching_products", "لم يتم العثور على منتجات مطابقة."));
        }
      } else {
        setProducts([]);
        setError(t("vendor.ds_no_matching_products", "لم يتم العثور على منتجات مطابقة."));
      }
    } catch (err) {
      console.error(err);
      setError(t('vendor.ds_err_connect_supplier', 'حدث خطأ أثناء محاولة الاتصال بمزود الجملة. يرجى المحاولة لاحقاً.'));
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (product) => {
    // Determine suggested retail price (cost + 30% margin)
    const costPrice = parseFloat(product.sellPrice);
    const suggestedPrice = (costPrice * 1.3).toFixed(2);

    setImportingIds(prev => ({ ...prev, [product.pid]: true }));
    try {
      await api.post(`/dropshipping/import/${product.pid}`, null, { 
        params: { suggested_retail_price: suggestedPrice } 
      });
      
      setImportedIds(prev => ({ ...prev, [product.pid]: true }));
      toast.push({ 
        message: t('vendor.ds_import_success', 'تم استيراد المنتج بنجاح إلى متجرك!'), 
        type: 'success' 
      });
    } catch (err) {
      console.error(err);
      toast.push({ 
        message: err.response?.data?.detail || t('common.error', 'فشل استيراد المنتج'), 
        type: 'error' 
      });
    } finally {
      setImportingIds(prev => ({ ...prev, [product.pid]: false }));
    }
  };

  return (
    <div className={s.container}>
      <header className={s.header}>
        <div className={s.headerTitle}>
          <Package className={s.titleIcon} size={24} />
          <h1 className={s.title}>{t('vendor.dropshipping_title', 'البحث واستيراد منتجات الدروب شيبنج')}</h1>
        </div>
        <p className={s.subtitle}>{t('vendor.dropshipping_subtitle', 'ابحث عن آلاف المنتجات من الموردين العالميين وأضفها لمتجرك بضغطة زر.')}</p>
      </header>

      <form onSubmit={handleSearch} className={s.searchSection}>
        <div className={s.searchBox}>
          <Search className={s.searchIcon} size={20} />
          <input 
            type="text" 
            placeholder={t('vendor.ds_search_placeholder', 'ابحث عن منتجات (مثلاً: ساعات، حقائب...)')} 
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className={s.input}
          />
        </div>
        <button type="submit" className={s.btnPrimary} disabled={loading}>
          {loading ? t('common.searching', 'جاري البحث...') : t('common.search', 'بحث')}
        </button>
      </form>

      {error && <div className={s.errorMessage}>{error}</div>}

      <div className={s.resultsGrid}>
        {products.map((product) => {
          const isImporting = importingIds[product.pid];
          const isImported = importedIds[product.pid];
          
          return (
            <div key={product.pid} className={s.productCard}>
              <div className={s.productImage}>
                <img src={product.productImg} alt={product.productName} />
              </div>
              <div className={s.productInfo}>
                <h3 className={s.productName}>{product.productName}</h3>
                <div className={s.priceRow}>
                  <div className={s.priceItem}>
                    <span className={s.priceLabel}>{t('vendor.ds_cost', 'تكلفة الاستيراد:')}</span>
                    <span className={s.productPrice}>{product.sellPrice || '0'} {t('common.currency', 'ر.س')}</span>
                  </div>
                  <ArrowRight size={14} className={s.priceArrow} />
                  <div className={s.priceItem}>
                    <span className={s.priceLabel}>{t('vendor.ds_suggested', 'سعر البيع المقترح:')}</span>
                    <span className={s.suggestedPrice}>{(parseFloat(product.sellPrice) * 1.3).toFixed(2)} {t('common.currency', 'ر.س')}</span>
                  </div>
                </div>
                
                <div className={s.actionWrapper}>
                  <button 
                    className={`${s.importBtn} ${isImported ? s.importBtnSuccess : ''}`}
                    onClick={() => handleImport(product)}
                    disabled={isImporting || isImported}
                  >
                    {isImporting ? <div className={s.spinner} /> : 
                     isImported ? <><Check size={16} /> {t("vendor.ds_added_to_store", "تمت الإضافة لمتجرك")}</> : 
                     t("vendor.ds_add_to_store", "أضف إلى متجري")}
                  </button>
                  <p className={s.tooltip}>{t('vendor.ds_wont_pay_now', 'لن تدفع شيئاً الآن')}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
