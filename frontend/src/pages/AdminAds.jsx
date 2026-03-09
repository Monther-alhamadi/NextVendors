import React, { useEffect, useState } from "react";
import { getAdminAds, updateAdStatus } from "../services/vendorService";
import { useToast } from "../components/common/ToastProvider";
import { useTranslation } from "react-i18next";
import PageContainer from "../components/PageContainer";
import Skeleton from "../components/common/Skeleton";
import styles from "./AdminVendors.module.css"; // Reusing vendor styles for table

export default function AdminAds() {
  const { t } = useTranslation();
  const toast = useToast();
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAds();
  }, []);

  async function loadAds() {
    try {
      setLoading(true);
      const data = await getAdminAds();
      setAds(data);
    } catch (e) {
      console.error(e);
      toast.push({ message: "فشل جلب طلبات الإعلانات", type: "error" });
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusUpdate(adId, newStatus) {
    try {
      await updateAdStatus(adId, newStatus, newStatus === 'active' ? true : null);
      toast.push({ message: "تم تحديث حالة الإعلان", type: "success" });
      loadAds();
    } catch (e) {
      toast.push({ message: "فشل تحديث الحالة", type: "error" });
    }
  }

  async function handleMarkPaid(adId) {
    try {
      // Keep existing status but update payment state
      const ad = ads.find(a => a.id === adId);
      await updateAdStatus(adId, ad.status, true);
      toast.push({ message: "تم تغيير حالة الدفع", type: "success" });
      loadAds();
    } catch (e) {
      toast.push({ message: "فشل تحديث حالة الدفع", type: "error" });
    }
  }

  return (
    <PageContainer>
        <div className={styles.pageHeader}>
             <div>
                <h1 className={styles.pageTitle}>تأجير المساحات الإعلانية</h1>
                <p className={styles.pageSubtitle}>إدارة طلبات إعلانات التجّار على الصفحة الرئيسية ومراجعة الدفعات</p>
             </div>
        </div>

        {loading ? (
            <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {[1,2,3].map(i => <Skeleton key={i} height="60px" />)}
            </div>
        ) : (
            <div className={styles.tableCard}>
                <div className={styles.tableWrapper}>
                    <table className={styles.dataGrid}>
                        <thead>
                            <tr>
                                <th>الإعلان</th>
                                <th>معرّف التاجر</th>
                                <th>المكان والتكلفة</th>
                                <th>الدفع</th>
                                <th>الحالة</th>
                                <th>إجراءات الإدارة</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ads.length === 0 ? (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                                        لا توجد طلبات إعلانات حالياً
                                    </td>
                                </tr>
                            ) : ads.map(ad => (
                                <tr key={ad.id}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ width: '80px', height: '45px', borderRadius: '4px', overflow: 'hidden', backgroundColor: '#f5f5f5' }}>
                                                {ad.image_url ? (
                                                    <img src={ad.image_url} alt="ad banner" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : <span style={{fontSize: '10px', color: '#999', padding:'2px'}}>No Image</span>}
                                            </div>
                                            <div>
                                                <a href={ad.target_url} target="_blank" rel="noreferrer" style={{ fontSize: '0.85rem', color: 'var(--primary-color)' }}>الرابط الوجهة</a>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ fontWeight: '500' }}>{ad.vendor_id}</td>
                                    <td>
                                        <div style={{ fontSize: '0.9rem', marginBottom: '4px' }}>{ad.placement}</div>
                                        <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{ad.cost} ر.س</div>
                                    </td>
                                    <td>
                                        <span className={`${styles.badge} ${ad.is_paid ? styles.badgeSuccess : styles.badgeWarning}`}
                                              style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', background: ad.is_paid ? '#dcfce7' : '#fef08a', color: ad.is_paid ? '#166534' : '#854d0e' }}
                                        >
                                            {ad.is_paid ? 'مدفوع' : 'غير مدفوع'}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`${styles.statusBadge} ${ad.status === 'active' ? styles.statusActive : ad.status === 'rejected' ? styles.statusBanned : styles.statusPending}`}>
                                            {ad.status === 'active' ? 'مفعل' : ad.status === 'rejected' ? 'مرفوض' : 'في الانتظار'}
                                        </span>
                                    </td>
                                    <td style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                        {ad.status === 'pending' && (
                                            <>
                                                <button className={styles.actionBtn} style={{ background: '#ecfdf5', color: '#059669', borderColor: '#a7f3d0' }} onClick={() => handleStatusUpdate(ad.id, 'active')}>قبول</button>
                                                <button className={styles.actionBtn} style={{ background: '#fef2f2', color: '#e11d48', borderColor: '#fecdd3' }} onClick={() => handleStatusUpdate(ad.id, 'rejected')}>رفض</button>
                                            </>
                                        )}
                                        {ad.status === 'active' && (
                                            <button className={styles.actionBtn} style={{ background: '#fef2f2', color: '#e11d48', borderColor: '#fecdd3' }} onClick={() => handleStatusUpdate(ad.id, 'rejected')}>إيقاف</button>
                                        )}
                                        {ad.status === 'rejected' && (
                                            <button className={styles.actionBtn} style={{ background: '#ecfdf5', color: '#059669', borderColor: '#a7f3d0' }} onClick={() => handleStatusUpdate(ad.id, 'active')}>إعادة تفعيل</button>
                                        )}
                                        {!ad.is_paid && (
                                            <button className={styles.actionBtn} style={{ background: '#f3f4f6', color: '#374151' }} onClick={() => handleMarkPaid(ad.id)}>تأكيد الدفع</button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )}
    </PageContainer>
  );
}
