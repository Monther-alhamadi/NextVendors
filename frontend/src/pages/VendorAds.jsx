import React, { useState } from "react";
import { requestVendorAd } from "../services/vendorService";
import { useToast } from "../components/common/ToastProvider";
import { useTranslation } from "react-i18next";
import PageContainer from "../components/PageContainer";
import { Megaphone, CreditCard } from "lucide-react";
import styles from "./VendorSettings.module.css"; // Reuse settings styling

export default function VendorAds() {
  const { t } = useTranslation();
  const toast = useToast();
  
  const [formData, setFormData] = useState({
    image_url: "",
    target_url: "",
    placement: "homepage_hero",
    cost: 150.0
  });

  const [loading, setLoading] = useState(false);

  const placements = [
    { id: "homepage_hero", name: "بنر رئيسي (الرئيسية)", price: 150.0 },
    { id: "sidebar_premium", name: "جانبي مميز (المنتجات)", price: 75.0 },
    { id: "checkout_upsell", name: "بنر قبل الدفع (سلة المهملات)", price: 200.0 }
  ];

  const handlePlacementChange = (e) => {
    const pId = e.target.value;
    const pObj = placements.find(p => p.id === pId);
    setFormData({ ...formData, placement: pId, cost: pObj ? pObj.price : 150.0 });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.image_url || !formData.target_url) {
      toast.push({ message: "يرجى تعبئة كافة الحقول المطلوبة", type: "warning" });
      return;
    }

    try {
      setLoading(true);
      await requestVendorAd(formData);
      toast.push({ message: "تم تقديم طلب الإعلان بنجاح. سنقوم بمراجعته قريباً.", type: "success" });
      setFormData({ ...formData, image_url: "", target_url: "" });
    } catch (err) {
      console.error(err);
      toast.push({ message: "حدث خطأ أثناء تقديم الطلب", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer>
      <div className={styles.headerArea}>
        <div>
          <h1 className={styles.pageTitle}><Megaphone size={28} /> الترويج والإعلانات</h1>
          <p className={styles.pageSubtitle}>ارفع مبيعاتك من خلال حجز مساحات إعلانية في أبرز مناطق المنصة.</p>
        </div>
      </div>

      <div className={styles.settingsGrid}>
        <div className={styles.card}>
           <h2 className={styles.cardTitle}>معسكر الإعلانات</h2>
           
           <form onSubmit={handleSubmit} className={styles.formGroup}>
             <label className={styles.label}>
               رابط صورة الإعلان (URL) *
               <input 
                 className={styles.input} 
                 type="url" 
                 placeholder="https://example.com/ad-image.jpg"
                 value={formData.image_url}
                 onChange={e => setFormData({...formData, image_url: e.target.value})}
               />
             </label>

             <label className={styles.label}>
               رابط التوجيه (أين يذهب العميل عند النقر) *
               <input 
                 className={styles.input} 
                 type="url" 
                 placeholder="https://mystore.com/deal"
                 value={formData.target_url}
                 onChange={e => setFormData({...formData, target_url: e.target.value})}
               />
             </label>

             <label className={styles.label}>
               مكان الإعلان
               <select 
                 className={styles.input} 
                 value={formData.placement}
                 onChange={handlePlacementChange}
               >
                 {placements.map(p => (
                   <option key={p.id} value={p.id}>{p.name} - {p.price} ر.س</option>
                 ))}
               </select>
             </label>

             <div className={styles.paymentBox} style={{ margin: '20px 0', padding: '15px', background: '#f8fafc', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-color)' }}>التكلفة الإجمالية:</span>
                <span style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--primary-color)' }}>{formData.cost} ر.س</span>
             </div>

             <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '20px' }}>
                سيتم خصم المبلغ من رصيد متجرك أو يتطلب تحويل بنكي إذا لم يكن لديك رصيد كافي. (ميزة قيد التطوير). التفعيل بعد مراجعة الإدارة.
             </p>

             <button type="submit" disabled={loading} className={styles.saveBtn} style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '8px' }}>
                <CreditCard size={18} /> {loading ? 'جاري التقديم...' : 'تأكيد طلب الإعلان'}
             </button>
           </form>
        </div>

        <div className={styles.card}>
           <h2 className={styles.cardTitle}>إعلانات سابقة</h2>
           <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
               سجل إعلاناتك سيظهر هنا.
           </div>
        </div>
      </div>
    </PageContainer>
  );
}
