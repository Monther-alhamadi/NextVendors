import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as vendorService from '../services/vendorService';
import * as productService from '../services/productService';
import { useToast } from '../components/common/ToastProvider';
import { useTranslation } from 'react-i18next';
import s from './VendorAddProduct.module.css';
import ProductImageManager from '../components/ProductImageManager';
import { Globe, PlusCircle, CheckCircle, Package, DollarSign, Image as ImageIcon, Settings, Save, ArrowLeft, Search } from 'lucide-react';

const VendorAddProduct = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  
  const [mode, setMode] = useState('select'); // 'select', 'create', 'dropship'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMaster, setSelectedMaster] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    stock: '',
    inventory_threshold: 5,
    sku: '', // Vendor SKU
    metaTitle: '', // SEO
    metaTags: '' // SEO
  });
  
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Search Master Products Debounce
  useEffect(() => {
    if (mode === 'dropship' && searchTerm) {
      const delayDebounceFn = setTimeout(async () => {
        // Mock Implementation for dropship search
      }, 500);
      return () => clearTimeout(delayDebounceFn);
    }
  }, [searchTerm, mode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
        if (mode === 'dropship' && selectedMaster) {
             await productService.createVendorListing(selectedMaster.id, {
                 price: parseFloat(formData.price),
                 stock: parseInt(formData.stock),
                 inventory_threshold: parseInt(formData.inventory_threshold),
                 sku: formData.sku
             });
        } else {
              const productData = new FormData();
              productData.append('name', formData.name);
              productData.append('description', formData.description);
              productData.append('price', formData.price);
              productData.append('category', formData.category);
              productData.append('inventory', formData.stock); 
              productData.append('inventory_threshold', formData.inventory_threshold);
              if(formData.sku) productData.append('sku', formData.sku);
              
              if (images && images.length > 0) {
                  images.forEach((file) => {
                    productData.append('images', file);
                  });
              }

              await vendorService.createProduct(productData);
        }
      
      toast.push({ message: t('vendor.product_added_success', "تم إضافة المنتج بنجاح!"), type: 'success' });
      setTimeout(() => navigate('/vendor/products'), 1500);
    } catch (err) {
      console.error("Failed to add product", err);
      setError(err.response?.data?.detail || 'فشل إضافة المنتج');
      toast.push({ message: err.response?.data?.detail || "فشل إضافة المنتج.", type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (mode === 'select') {
      return (
        <div className={s.page}>
          <div className={s.selectModeContainer}>
              <h1 className={s.selectTitle}>{t('vendor.add_new_product', 'إضافة منتج جديد')}</h1>
              <p className={s.selectSubtitle}>اختر طريقة إضافة المنتج التي تناسبك لبدء البيع فوراً.</p>
              
              <div className={s.cardsGrid}>
                  <div className={s.modeCard} onClick={() => setMode('dropship')}>
                      <div className={`${s.cardIconWrap} ${s.blue}`}>
                        <Globe size={40} />
                      </div>
                      <h2 className={s.cardTitle}>البيع من كتالوج الموردين</h2>
                      <p className={s.cardDesc}>دروبشيبينغ لمنتجات جاهزة من موردين معتمدين. (يتطلب باقة احترافية)</p>
                      <span className={s.cardAction}>تصفح الكتالوج &rarr;</span>
                  </div>

                  <div className={s.modeCard} onClick={() => setMode('create')}>
                      <div className={`${s.cardIconWrap} ${s.purple}`}>
                        <PlusCircle size={40} />
                      </div>
                      <h2 className={s.cardTitle}>إنشاء منتج خاص بك</h2>
                      <p className={s.cardDesc}>ارفاق الصور والتفاصيل الخاصة بك. تحكم كامل في القوائم الخاصة بك.</p>
                      <span className={s.cardAction}>إنشاء قائمة &rarr;</span>
                  </div>
              </div>
          </div>
        </div>
      )
  }

  return (
    <div className={s.page}>
        <div className={s.header}>
            <button onClick={() => setMode('select')} className={s.backBtn}>
              <ArrowLeft size={20} />
              <span>العودة للخيارات</span>
            </button>
            <h1 className={s.title}>{mode === 'dropship' ? 'بيع منتج دروبشيبينغ' : 'إنشاء منتج خاص'}</h1>
        </div>

        <div className={s.formWrapper}>
            {error && <div className={s.errorBox}>{error}</div>}

            <form onSubmit={handleSubmit} className={s.form}>
                
                {mode === 'dropship' && (
                    <div className={s.section}>
                        <div className={s.sectionHeader}>
                          <Search size={20} />
                          <h3>البحث في الكتالوج</h3>
                        </div>
                        <input 
                            type="text" 
                            placeholder="ابحث بالاسم، الفئة، أو الرمز الشريطي..."
                            className={s.input}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && !selectedMaster && (
                            <div className={s.searchResults}>
                                <div className={s.searchResultItem} onClick={() => setSelectedMaster({id: 1, name: "Global Widget X", category: "Electronics"})}>
                                     <div className={s.resultName}>Global Widget X</div>
                                     <div className={s.resultMeta}>Electronics • السعر الأساسي: 50 ر.س</div>
                                </div>
                            </div>
                        )}
                        {selectedMaster && (
                            <div className={s.selectedMasterCard}>
                                <div>
                                    <span className={s.selectedName}>{selectedMaster.name}</span>
                                    <span className={s.selectedMeta}>تم اختياره من كتالوج الموردين العالمي</span>
                                </div>
                                <button type="button" onClick={() => setSelectedMaster(null)} className={s.changeBtn}>تغيير</button>
                            </div>
                        )}
                    </div>
                )}

                {/* BASIC INFO */}
                {mode === 'create' && (
                    <div className={s.section}>
                         <div className={s.sectionHeader}>
                          <Package size={20} />
                          <h3>المعلومات الأساسية</h3>
                        </div>
                        <div className={s.grid2}>
                          <div className={s.inputGroup}>
                            <label>اسم المنتج <span className={s.required}>*</span></label>
                            <input 
                                className={s.input}
                                value={formData.name}
                                onChange={e => setFormData({...formData, name: e.target.value})}
                                required
                            />
                          </div>
                          <div className={s.inputGroup}>
                            <label>التصنيف <span className={s.required}>*</span></label>
                            <input 
                                className={s.input}
                                value={formData.category}
                                onChange={e => setFormData({...formData, category: e.target.value})}
                                required
                            />
                          </div>
                        </div>
                        <div className={s.inputGroup}>
                            <label>الوصف <span className={s.required}>*</span></label>
                            <textarea
                                required
                                className={s.textarea}
                                rows="4"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                    </div>
                )}

                {/* VISUALS */}
                {mode === 'create' && (
                    <div className={s.section}>
                        <div className={s.sectionHeader}>
                          <ImageIcon size={20} />
                          <h3>الصور والوسائط</h3>
                        </div>
                        <ProductImageManager 
                            images={images}
                            onChange={setImages}
                        />
                    </div>
                )}

                {/* PRICING & INVENTORY */}
                <div className={s.section}>
                    <div className={s.sectionHeader}>
                      <DollarSign size={20} />
                      <h3>التسعير والمخزون</h3>
                    </div>
                    <div className={s.grid2}>
                        <div className={s.inputGroup}>
                          <label>السعر (ر.س) <span className={s.required}>*</span></label>
                          <input 
                              type="number"
                              step="0.01"
                              className={s.input}
                              value={formData.price}
                              onChange={e => setFormData({...formData, price: e.target.value})}
                              required
                          />
                        </div>
                        <div className={s.inputGroup}>
                          <label>المخزون المتوفر <span className={s.required}>*</span></label>
                          <input 
                              type="number"
                              className={s.input}
                              value={formData.stock}
                              onChange={e => setFormData({...formData, stock: e.target.value})}
                              required
                          />
                        </div>
                        <div className={s.inputGroup}>
                          <label>SKU (رمز الصنف)</label>
                          <input 
                              className={s.input}
                              value={formData.sku}
                              onChange={e => setFormData({...formData, sku: e.target.value})}
                          />
                        </div>
                        <div className={s.inputGroup}>
                          <label>تنبيه انخفاض المخزون</label>
                          <input 
                              type="number"
                              className={s.input}
                              value={formData.inventory_threshold}
                              onChange={e => setFormData({...formData, inventory_threshold: e.target.value})}
                          />
                        </div>
                    </div>
                </div>

                {/* SEO (Advanced) */}
                {mode === 'create' && (
                  <div className={s.section}>
                    <div className={s.sectionHeader}>
                      <Settings size={20} />
                      <h3>تحسين محركات البحث (SEO) <span className={s.badge}>متقدم</span></h3>
                    </div>
                    <div className={s.grid2}>
                       <div className={s.inputGroup}>
                          <label>عنوان ميتا (Meta Title)</label>
                          <input 
                              className={s.input}
                              value={formData.metaTitle}
                              onChange={e => setFormData({...formData, metaTitle: e.target.value})}
                              placeholder="عنوان الصفحة لمحركات البحث"
                          />
                        </div>
                        <div className={s.inputGroup}>
                          <label>الكلمات الدلالية (Tags)</label>
                          <input 
                              className={s.input}
                              value={formData.metaTags}
                              onChange={e => setFormData({...formData, metaTags: e.target.value})}
                              placeholder="مفصولة بفواصل e.g. هاتف, ذكي"
                          />
                        </div>
                    </div>
                  </div>
                )}

                <div className={s.submitFooter}>
                  <button
                    type="submit"
                    disabled={loading || (mode === 'dropship' && !selectedMaster)}
                    className={s.submitBtn}
                  >
                    {loading ? (
                      <div className="spinner-small"></div>
                    ) : (
                      <>
                        <Save size={20} />
                        {mode === 'dropship' ? 'تأكيد وإدراج' : 'حفظ ونشر'}
                      </>
                    )}
                  </button>
                </div>
            </form>
        </div>
    </div>
  );
};

export default VendorAddProduct;
