import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getVendorById } from "../services/vendorService";
import { listProducts } from "../services/productService";
import { useToast } from "../components/common/ToastProvider";
import { isAuthenticated } from "../services/authService";
import { startChat } from "../services/messagingService";
import { MessageCircle, ShieldCheck, Mail, Truck, Store as StoreIcon } from "lucide-react";
import s from "./VendorStore.module.css";

export default function VendorStore() {
  const { id } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  
  const [vendor, setVendor] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("products");

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [v, p] = await Promise.all([
        getVendorById(id),
        listProducts("", 20, { supplier_id: id })
      ]);
      setVendor(v);
      setProducts(p || []);
    } catch (e) {
      console.error(e);
      toast.push({ message: t('common.error', 'حدث خطأ في تحميل بيانات المتجر'), type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleMessage = async () => {
    if (!isAuthenticated()) {
        toast.push({ message: t('vendor.login_to_message', 'الرجاء تسجيل الدخول لمراسلة المتجر'), type: "warning" });
        return navigate("/login");
    }
    try {
        await startChat(id);
        navigate("/messages");
    } catch (e) {
        navigate("/messages");
    }
  };

  if (loading) {
    return (
      <div className={s.page} style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className={s.page} style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
        <p className="subtitle">{t('vendor.not_found', 'المتجر غير موجود')}</p>
      </div>
    );
  }

  // Parse elite store ads
  const parsedAds = vendor?.store_ads ? (() => { 
      try { return JSON.parse(vendor.store_ads); } catch(e) { return []; } 
  })() : [];

  // Theme styles
  const storeStyle = {
    '--theme-primary': vendor?.theme_color || '#2563eb',
    position: 'relative',
    minHeight: '100vh',
    ...(vendor?.background_image_url && {
        backgroundImage: `url(${vendor.background_image_url})`,
        backgroundAttachment: 'fixed',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
    })
  };

  return (
    <div style={storeStyle}>
        {vendor?.announcement_text && (
            <div style={{ backgroundColor: 'var(--theme-primary)', color: '#fff', textAlign: 'center', padding: '12px 20px', fontWeight: 'bold', fontSize: '15px' }}>
                {vendor.announcement_text}
            </div>
        )}
        
        {/* Background Overlay if an image is preset for readability */}
        {vendor?.background_image_url && (
            <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(255,255,255,0.7)', zIndex: 0, pointerEvents: 'none' }}></div>
        )}

        <div className={s.page} style={{ position: 'relative', zIndex: 1, backgroundColor: vendor?.background_image_url ? 'transparent' : 'var(--bg-main)' }}>

        {/* Vendor Header */}
        <div className={s.vendorHeader}>
            <div className={s.vendorInfo}>
                <div className={s.vendorLogo}>
                    {vendor.logo_url ? <img src={vendor.logo_url} alt={vendor.name} /> : <StoreIcon size={40} opacity={0.3} />}
                </div>
                <div>
                    <h1 className={s.vendorName}>{vendor.name}</h1>
                    <p className={s.vendorDesc}>{vendor.description || t('vendor.welcome_store', 'أهلاً بك في متجرنا!')}</p>
                    <div className={s.badges}>
                        <span className={s.badge}>
                            <ShieldCheck size={14} />
                            {t('vendor.verified', 'متجر موثوق')}
                        </span>
                    </div>
                </div>
            </div>
            <div className={s.vendorActions}>
                <button className={s.messageBtn} onClick={handleMessage}>
                    <MessageCircle size={18} />
                    {t('common.message_vendor', 'تواصل مع البائع')}
                </button>
            </div>
            </div>
        </div>

        {/* Elite Store Ads (Banners/Promotions) */}
        {parsedAds.length > 0 && (
            <div className={s.storeCarousel} style={{ margin: '20px 0', display: 'grid', gridTemplateColumns: parsedAds.length > 1 ? 'repeat(auto-fit, minmax(300px, 1fr))' : '1fr', gap: '20px' }}>
                {parsedAds.map((adUrl, idx) => (
                    <img 
                        key={idx} 
                        src={adUrl} 
                        alt={`Store Ad ${idx + 1}`} 
                        style={{ width: '100%', borderRadius: '12px', objectFit: 'cover', maxHeight: '350px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', cursor: 'pointer', transition: 'transform 0.3s ease' }} 
                        onMouseOver={e => e.currentTarget.style.transform='scale(1.02)'}
                        onMouseOut={e => e.currentTarget.style.transform='scale(1)'}
                    />
                ))}
            </div>
        )}

        <div className={s.storeTabs}>
            <button 
                className={`${s.tabBtn} ${activeTab === 'products' ? s.tabBtnActive : ''}`}
                onClick={() => setActiveTab('products')}
            >
                {t('common.products', 'المنتجات')}
            </button>
            <button 
                className={`${s.tabBtn} ${activeTab === 'policies' ? s.tabBtnActive : ''}`}
                onClick={() => setActiveTab('policies')}
            >
                {t('vendor.shipping_policies', 'سياسات المتجر')}
            </button>
        </div>

        <div className={s.tabContent}>
            {activeTab === 'products' && (
                <div className={s.productsView}>
                    {products.length === 0 ? (
                        <p className={s.emptyMsg}>{t('common.no_products', 'لا توجد منتجات')}</p>
                    ) : (
                        <div className={s.productGrid}>
                            {products.map(p => {
                                const isSale = p.compare_at_price && p.compare_at_price > p.price;
                                const discountPercent = isSale ? Math.round(((p.compare_at_price - p.price) / p.compare_at_price) * 100) : 0;
                                
                                return (
                                <Link to={`/products/${p.id}`} key={p.id} className={s.productCard} style={{ position: 'relative' }}>
                                    
                                    {isSale && (
                                        <div style={{
                                            position: 'absolute', top: '10px', right: '10px', zIndex: 2,
                                            background: 'linear-gradient(45deg, #ef4444, #f43f5e)', color: 'white',
                                            padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold',
                                            boxShadow: '0 2px 4px rgba(239, 68, 68, 0.3)'
                                        }}>
                                            {t('vendor.sale', 'تخفيض')} {discountPercent}%
                                        </div>
                                    )}

                                    <div className={s.imgWrapper}>
                                        {p.images && p.images.length > 0 ? (
                                            <img src={p.images[0].url} alt={p.name} />
                                        ) : (
                                            <div className={s.placeholder}><StoreIcon /></div>
                                        )}
                                    </div>
                                    <div className={s.pInfo}>
                                        <h3 className={s.pName}>{p.name}</h3>
                                        <div className={s.pPrice}>
                                            {isSale ? (
                                                <>
                                                    <span style={{ textDecoration: 'line-through', color: '#999', fontSize: '0.9em', marginLeft: '6px' }}>
                                                        {p.compare_at_price} {t('common.currency', 'ر.س')}
                                                    </span>
                                                    <span style={{ color: '#ef4444', fontWeight: 'bold' }}>
                                                        {p.price} {t('common.currency', 'ر.س')}
                                                    </span>
                                                </>
                                            ) : (
                                                <span>{p.price} {t('common.currency', 'ر.س')}</span>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'policies' && (
                <div className={s.policiesView}>
                    <div className={s.policySection}>
                        <h3><Truck size={20} /> {t('vendor.shipping_policy', 'سياسة الشحن')}</h3>
                        <p>{vendor.shipping_policy || t('common.no_data', 'لا توجد بيانات')}</p>
                    </div>
                    <div className={s.policySection}>
                        <h3><Mail size={20} /> {t('vendor.return_policy', 'سياسة الاسترجاع')}</h3>
                        <p>{vendor.return_policy || t('common.no_data', 'لا توجد بيانات')}</p>
                    </div>
                </div>
            )}
        </div>
    </div>
  );
}
