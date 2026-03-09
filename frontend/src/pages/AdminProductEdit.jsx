import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { 
  ArrowRight, Save, Image as ImageIcon, Info, Box, Tag, 
  Settings, DollarSign, UploadCloud, Trash2, X
} from "lucide-react";
import { getProduct, createProduct, updateProduct } from "../services/productService";
import { useToast } from "../components/common/ToastProvider";
import parseAxiosError from "../utils/errorParser";
import PageContainer from "../components/PageContainer";
import styles from "./AdminProductEdit.module.css";
// Importing original Refactored components
import AdminProductFormFields from "./AdminProductFormFields";
import AdminProductImageList from "./AdminProductImageList";
import AdminProductUpload from "./AdminProductUpload";
import useImageUpload from "../hooks/useImageUpload";

export default function AdminProductEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const toast = useToast();
  
  const [activeTab, setActiveTab] = useState("basic"); // basic, media, advanced
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Form State
  const [product, setProduct] = useState(null);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [inventory, setInventory] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [images, setImages] = useState([]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (id && id !== "new") {
      loadProduct();
    }
  }, [id]);

  async function loadProduct() {
      setLoading(true);
      try {
        const p = await getProduct(id);
        setProduct(p);
        setName(p.name || "");
        setPrice(p.price || "");
        setInventory(p.inventory || "");
        setDescription(p.description || "");
        setCategory(p.category || "");
        if (Array.isArray(p.images)) {
          setImages(p.images.map((img) => (typeof img === "string" ? img : img.url)));
        }
      } catch (err) {
        toast.push({ message: t('common.error', 'حدث خطأ أثناء تحميل تفاصيل المنتج'), type: "error" });
      } finally {
        setLoading(false);
      }
  }

  const {
    uploading,
    uploadProgress,
    currentUploadFilename,
    handleFileSelect,
    abortUpload,
  } = useImageUpload({ toast });

  const onUploadSuccess = (url) => {
    if (url) setImages((prev) => [...(prev || []), url]);
  };

  const removeImage = (idx) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  async function handleSave(e) {
    e?.preventDefault();
    setErrors({});
    
    // Basic validation
    const newErrors = {};
    if (!name.trim()) newErrors.name = "اسم المنتج مطلوب";
    if (!price || price <= 0) newErrors.price = "السعر يجب أن يكون أكبر من صفر";
    if (inventory === "" || inventory < 0) newErrors.inventory = "الكمية غير صحيحة";
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setActiveTab("basic");
      toast.push({ message: "يرجى تصحيح الأخطاء في النموذج", type: "error" });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name,
        price: parseFloat(price),
        inventory: parseInt(inventory || 0, 10),
        description,
        category,
        images,
      };

      if (id === "new") {
        await createProduct(payload);
        toast.push({ message: t('common.save_success', 'تم إنشاء المنتج بنجاح'), type: "success" });
        navigate("/admin/products");
      } else {
        await updateProduct(id, payload);
        toast.push({ message: t('common.save_success', 'تم تحديث المنتج بنجاح'), type: "success" });
      }
    } catch (err) {
      const parsed = parseAxiosError(err);
      toast.push({ message: parsed.message || t('common.error', 'فشل حفظ المنتج'), type: "error" });
      if (parsed.fieldErrors) setErrors(parsed.fieldErrors);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <PageContainer>Loading...</PageContainer>;

  return (
    <PageContainer>
      <div className={styles.pageHeader}>
        <div className={styles.titleArea}>
           <Link to="/admin/products" className={styles.backBtn}>
              <ArrowRight size={20} />
           </Link>
           <div>
             <h1 className={styles.pageTitle}>
               {id === "new" ? t('admin.create_product', 'إضافة منتج جديد') : `${t('admin.edit_product', 'تعديل المنتج')} #${id}`}
             </h1>
             <p className={styles.pageSubtitle}>
               {id === "new" ? 'قم بتعبئة تفاصيل المنتج لرفعه على المنصة' : 'يمكنك تعديل معلومات المنتج، الصور، والأسعار'}
             </p>
           </div>
        </div>
        <div className={styles.headerActions}>
           <button 
             className={`${styles.actionBtn} ${styles.secondaryBtn}`}
             onClick={() => navigate('/admin/products')}
           >
             <X size={18} /> إلغاء
           </button>
           <button 
             className={`${styles.actionBtn} ${styles.primaryBtn}`}
             onClick={handleSave}
             disabled={saving}
           >
             <Save size={18} /> {saving ? 'جاري الحفظ...' : 'حفظ المنتج'}
           </button>
        </div>
      </div>

      <div className={styles.tabsContainer}>
         <button 
           className={`${styles.tabBtn} ${activeTab === 'basic' ? styles.active : ''}`}
           onClick={() => setActiveTab('basic')}
         >
           <Info size={18} /> المعلومات الأساسية
         </button>
         <button 
           className={`${styles.tabBtn} ${activeTab === 'media' ? styles.active : ''}`}
           onClick={() => setActiveTab('media')}
         >
           <ImageIcon size={18} /> الصور والوسائط ({images.length})
         </button>
         <button 
           className={`${styles.tabBtn} ${activeTab === 'advanced' ? styles.active : ''}`}
           onClick={() => setActiveTab('advanced')}
         >
           <Settings size={18} /> خيارات متقدمة
         </button>
      </div>

      <div className={styles.formGrid}>
         <div className={styles.mainCol}>
            {activeTab === 'basic' && (
               <div className={styles.card}>
                  <div className={styles.cardHeader}>
                     <h3 className={styles.cardTitle}><Tag size={20} /> تفاصيل المنتج</h3>
                  </div>
                  
                  <div className={styles.fieldGroup}>
                     <label className={styles.fieldLabel}>اسم المنتج *</label>
                     <input 
                       type="text" 
                       className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
                       value={name}
                       onChange={e => setName(e.target.value)}
                       placeholder="مثال: حذاء رياضي نايك أير ماكس"
                     />
                     {errors.name && <span className={styles.errorText}>{errors.name}</span>}
                  </div>

                  <div className={styles.fieldGroup}>
                     <label className={styles.fieldLabel}>التصنيف</label>
                     <input 
                       type="text" 
                       className={styles.input}
                       value={category}
                       onChange={e => setCategory(e.target.value)}
                       placeholder="مثال: أحذية رياضية"
                     />
                  </div>

                  <div className={styles.fieldGroup}>
                     <label className={styles.fieldLabel}>الوصف التفصيلي</label>
                     <textarea 
                       className={styles.input}
                       style={{ minHeight: '150px', resize: 'vertical' }}
                       value={description}
                       onChange={e => setDescription(e.target.value)}
                       placeholder="اكتب وصفاً جذاباً ومفصلاً للمنتج يوضح ميزاته وفوائده..."
                     />
                  </div>
               </div>
            )}

            {activeTab === 'media' && (
               <div className={styles.card}>
                   <div className={styles.cardHeader}>
                     <h3 className={styles.cardTitle}><ImageIcon size={20} /> معرض الصور</h3>
                   </div>
                   
                   <div className={styles.mediaGrid}>
                       {images.map((img, idx) => (
                           <div key={idx} className={styles.mediaItem}>
                               <img src={img} alt={`Product ${idx}`} />
                               <div className={styles.mediaOverlays}>
                                  <button type="button" onClick={() => removeImage(idx)} className={`${styles.iconBtn} ${styles.danger}`}>
                                      <Trash2 size={16} />
                                  </button>
                               </div>
                           </div>
                       ))}
                       
                       <label className={styles.uploadZone}>
                           {uploading ? (
                               <div style={{ textAlign: 'center' }}>
                                 <span className="block mb-2">{uploadProgress}%</span>
                                 <span style={{ fontSize: '0.8rem' }}>جاري الرفع...</span>
                               </div>
                           ) : (
                               <>
                                  <UploadCloud size={24} style={{ marginBottom: '0.5rem' }} />
                                  <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>إضافة صورة</span>
                               </>
                           )}
                           <input 
                             type="file" 
                             accept="image/*" 
                             style={{ display: 'none' }} 
                             onChange={(e) => {
                               if(e.target.files?.[0]) handleFileSelect(e.target.files[0], { onSuccess: onUploadSuccess });
                             }}
                             disabled={uploading}
                           />
                       </label>
                   </div>
               </div>
            )}

            {activeTab === 'advanced' && (
                <div className={styles.card}>
                   <div className={styles.cardHeader}>
                     <h3 className={styles.cardTitle}><Settings size={20} /> إعدادات SEO ومحركات البحث</h3>
                   </div>
                   <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                      هذه الميزة قيد التطوير وستتوفر قريباً للتحكم في عنوان الـ Meta ووصف الصفحة.
                   </p>
                </div>
            )}
         </div>

         <div className={styles.sideCol}>
             <div className={styles.card}>
                  <div className={styles.cardHeader}>
                     <h3 className={styles.cardTitle}><DollarSign size={20} /> التسعير والمخزون</h3>
                  </div>

                  <div className={styles.fieldGroup}>
                     <label className={styles.fieldLabel}>سعر البيع ({t('common.currency', 'ر.س')}) *</label>
                     <input 
                       type="number" 
                       step="0.01"
                       className={`${styles.input} ${errors.price ? styles.inputError : ''}`}
                       value={price}
                       onChange={e => setPrice(e.target.value)}
                     />
                     {errors.price && <span className={styles.errorText}>{errors.price}</span>}
                  </div>

                  <div className={styles.fieldGroup}>
                     <label className={styles.fieldLabel}>الكمية المتوفرة (المخزون) *</label>
                     <div style={{ position: 'relative' }}>
                        <Box size={18} color="var(--text-muted)" style={{ position: 'absolute', top: '50%', right: '1rem', transform: 'translateY(-50%)' }} />
                        <input 
                          type="number" 
                          className={`${styles.input} ${errors.inventory ? styles.inputError : ''}`}
                          style={{ paddingRight: '2.5rem' }}
                          value={inventory}
                          onChange={e => setInventory(e.target.value)}
                        />
                     </div>
                     {errors.inventory && <span className={styles.errorText}>{errors.inventory}</span>}
                  </div>
             </div>
         </div>
      </div>
    </PageContainer>
  );
}
