import React, { useState } from 'react';
import api from '../services/api';
import { useToast } from '../components/common/ToastProvider';
import s from './VendorDropshipping.module.css';

export default function VendorDropshipping() {
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
      } else {
        setProducts([]);
        if (!data.data.list) setError("لم يتم العثور على منتجات مطابقة.");
      }
    } catch (err) {
      console.error(err);
      setError("حدث خطأ أثناء محاولة الاتصال بمزود الجملة. يرجى المحاولة لاحقاً.");
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
      // Send the request to import to backend
      await api.post(`/dropshipping/import/${product.pid}?suggested_retail_price=${suggestedPrice}`);
      
      setImportedIds(prev => ({ ...prev, [product.pid]: true }));
      toast.push({ message: "تمت إضافة المنتج إلى متجرك بنجاح!", type: "success" });
    } catch (err) {
      console.error(err);
      toast.push({ message: "حدث خطأ أثناء استيراد المنتج.", type: "error" });
    } finally {
      setImportingIds(prev => ({ ...prev, [product.pid]: false }));
    }
  };

  return (
    <div className={s.page}>
      
      {/* Educational Onboarding Hero */}
      <div className={s.onboardingHero}>
        <span className={s.heroIcon}>🌍</span>
        <h1 className={s.heroTitle}>استيراد المنتجات (الدروب شيبينج) بدون رأس مال</h1>
        <p className={s.heroText}>
          مرحباً بك في أسواق الجملة العالمية! ابحث عن أي منتج تريده (ساعات، إلكترونيات، ملابس)، وسنقوم نحن 
          بحقن <span className={s.highlight}>صوره وتفاصيله بضغطة زر إلى متجرك.</span> لن تحتاج لدفع ثمنه إلا بعد أن يأتيك مشترٍ ويدفع لك أولاً!
        </p>
      </div>

      {/* Main Search Interface */}
      <form className={s.searchContainer} onSubmit={handleSearch}>
        <input 
          type="text" 
          className={s.searchInput}
          placeholder="ابحث بالإنجليزية، مثلاً: Smart Watch أو Wireless Earbuds..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          required
        />
        <button type="submit" className={s.searchBtn} disabled={loading}>
          {loading ? <div className={s.spinner} /> : "بحث واستكشاف"}
        </button>
      </form>

      {/* Feedback States */}
      {error && <div className={s.errorState}>{error}</div>}
      {products.length === 0 && !loading && !error && (
        <div className={s.emptyState}>
          أدخل اسم المنتج الذي ترغب ببيعه للبدء بالتصفح...
        </div>
      )}

      {/* Product Grid */}
      <div className={s.grid}>
        {products.map(product => {
          const cost = parseFloat(product.sellPrice) || 0;
          const retail = cost * 1.3; // 30% Markup
          const profit = retail - cost;

          const isImporting = importingIds[product.pid];
          const isImported = importedIds[product.pid];

          return (
            <div key={product.pid} className={s.card}>
              <div className={s.imageWrap}>
                {product.productImage ? (
                  <img src={product.productImage} alt={product.productNameEn} className={s.image} />
                ) : (
                  <div className={s.image}>بدون صورة</div>
                )}
              </div>
              
              <div className={s.cardBody}>
                <h3 className={s.productName} title={product.productNameEn}>
                  {product.productNameEn || product.productName}
                </h3>
                
                <div className={s.finances}>
                  <div className={s.financeRow}>
                    <span className={s.label}>التكلفة من المورد:</span>
                    <span className={s.costValue}>${cost.toFixed(2)}</span>
                  </div>
                  <div className={s.financeRow}>
                    <span className={s.label}>سعر البيع المقترح:</span>
                    <span className={s.retailValue}>${retail.toFixed(2)}</span>
                  </div>
                  <div className={s.financeRow}>
                    <span className={s.profitLabel}>ربحك المتوقع:</span>
                    <span className={s.profitValue}>+${profit.toFixed(2)}</span>
                  </div>
                </div>

                <button 
                  className={`${s.importBtn} ${isImported ? s.importBtnSuccess : ''}`}
                  onClick={() => handleImport(product)}
                  disabled={isImporting || isImported}
                >
                  {isImporting ? <div className={s.spinner} style={{width: 16, height: 16, borderWidth: 2}} /> : 
                   isImported ? "✅ تمت الإضافة لمتجرك" : "🚀 أضف إلى متجري"}
                </button>
                <p className={s.tooltip}>لن تدفع شيئاً الآن</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
