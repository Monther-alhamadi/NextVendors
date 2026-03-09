import React, { useEffect, useState } from "react";
import { 
    listVendors, 
    updateVendorStatus, 
    getVendorStats,
    reviewKYC,
    banVendor
} from "../services/vendorService";
import { getVendorBalances } from "../services/payoutService";
import { useToast } from "../components/common/ToastProvider";
import { useTranslation } from "react-i18next";
import { Plus, Check, X, ShieldAlert, Store, Award } from "lucide-react";
import PageContainer from "../components/PageContainer";
import Skeleton from "../components/common/Skeleton";
import styles from "./AdminVendors.module.css";

export default function AdminVendors() {
  const { t } = useTranslation();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState("all"); 
  const [vendors, setVendors] = useState([]);
  const [stats, setStats] = useState({ total_vendors: 0, pending_kyc: 0 });
  const [loading, setLoading] = useState(true);
  
  // Modal States
  const [kycModal, setKycModal] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [overrideModal, setOverrideModal] = useState(null);
  const [overrideJson, setOverrideJson] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [vData, sData, bData] = await Promise.all([
          listVendors(),
          getVendorStats().catch(() => ({})),
          getVendorBalances().catch(() => [])
      ]);
      
      const merged = vData.map(v => ({
          ...v,
          balance: bData.find(b => b.supplier_id === v.id)?.balance || 0
      }));
      
      setVendors(merged);
      setStats(sData || { total_vendors: 0, pending_kyc: 0});
    } catch (e) {
      console.error(e);
      toast.push({ message: t("common.error", "فشل جلب التجار"), type: "error" });
    } finally {
      setLoading(false);
    }
  }

  async function handleKYCReview(approved) {
      if (!kycModal) return;
      try {
          await reviewKYC(kycModal.id, approved, approved ? null : rejectionReason);
          toast.push({ message: t("common.success", "تمت معالجة وثائق التاجر"), type: "success" });
          setKycModal(null);
          setRejectionReason("");
          loadData();
      } catch (e) {
          toast.push({ message: t("common.error", "حدث خطأ"), type: "error" });
      }
  }

  async function handleBan(vendor) {
      if (!window.confirm(`هل أنت متأكد من تغيير حالة الحظر لهذا التاجر (${vendor.name})?`)) return;
      try {
          await banVendor(vendor.id, !vendor.is_banned);
          toast.push({ message: t("common.success", "تم التحديث بنجاح"), type: "success" });
          loadData();
      } catch (e) {
          toast.push({ message: t("common.error", "فشل التحديث"), type: "error" });
      }
  }

  async function handleSaveOverrides() {
      if (!overrideModal) return;
      try {
          const parsed = overrideJson ? JSON.parse(overrideJson) : null;
          // Import adminUpdateVendor dynamically since it might not be at the top level
          const { adminUpdateVendor } = await import("../services/vendorService");
          await adminUpdateVendor(overrideModal.id, { override_limits: parsed });
          toast.push({ message: t("common.success", "تم تحديث الصلاحيات بنجاح"), type: "success" });
          setOverrideModal(null);
          loadData();
      } catch (e) {
          toast.push({ message: "تنسيق JSON غير صحيح أو فشل التحديث", type: "error" });
      }
  }

  const filteredVendors = vendors.filter(v => {
      if (activeTab === "kyc") return v.kyc_status === "pending";
      if (activeTab === "banned") return v.is_banned;
      return true;
  });

  const getKycClass = (kyc) => {
    switch (kyc?.toLowerCase()) {
      case 'approved': return styles.kycApproved;
      case 'pending': return styles.kycPending;
      default: return styles.kycNull;
    }
  };

  return (
    <PageContainer>
        <div className={styles.pageHeader}>
             <div>
                <h1 className={styles.pageTitle}>{t('admin.merchant_center', 'مركز التجّار والمتجر')}</h1>
                <p className={styles.pageSubtitle}>{t('admin.manage_vendors', 'إدارة توثيق المتاجر، الرصيد، والمخالفات')}</p>
             </div>
             <div className={styles.headerActions}>
                 <div className={styles.statsBox}>
                     <span className={styles.statsLabel}>{t("admin.pending_kyc", "وثائق قيد المراجعة")}</span>
                     <span className={styles.statsValue}>{stats.pending_kyc || 0}</span>
                 </div>
                 <button className={styles.primaryBtn} onClick={() => alert("ميزة إضافة تاجر يدوياً قيد التطوير.")}>
                    <Plus size={18} /> {t("admin.add_vendor", "إضافة تاجر")}
                 </button>
             </div>
        </div>

        <div className={styles.tabs}>
            <button
               onClick={() => setActiveTab('all')}
               className={`${styles.tabBtn} ${activeTab === 'all' ? styles.active : ''}`}
            >
                {t('common.all', 'الكل')}
            </button>
            <button
               onClick={() => setActiveTab('kyc')}
               className={`${styles.tabBtn} ${activeTab === 'kyc' ? styles.active : ''}`}
            >
                {t('admin.tab_kyc', 'توثيق KYC')}
            </button>
            <button
               onClick={() => setActiveTab('banned')}
               className={`${styles.tabBtn} ${activeTab === 'banned' ? styles.active : ''}`}
            >
                {t('admin.tab_banned', 'محظورون')}
            </button>
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
                                <th>{t('admin.store_identity', 'هوية المتجر')}</th>
                                <th>{t('common.status', 'الحالة')}</th>
                                <th>{t('admin.kyc', 'توثيق (KYC)')}</th>
                                <th>{t('admin.plan', 'الباقة')}</th>
                                <th>{t('admin.balance', 'الرصيد المتاح')}</th>
                                <th style={{ textAlign: 'left' }}>{t('common.actions', 'الإجراءات')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredVendors.length === 0 ? (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                                        <Store size={40} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
                                        لا يوجد بيانات لعرضها في هذا التبويب
                                    </td>
                                </tr>
                            ) : filteredVendors.map(v => (
                                <tr key={v.id} className={v.is_banned ? styles.bannedRow : ""}>
                                    <td>
                                        <div className={styles.storeCell}>
                                            <div className={styles.storeLogo}>
                                                {v.logo_url ? <img src={v.logo_url} alt={v.name} /> : <Store size={20} />}
                                            </div>
                                            <div>
                                                <div className={styles.storeName}>{v.name}</div>
                                                <div className={styles.storeCode}>{v.code || 'بدون كود'}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        {v.is_banned ? (
                                            <span className={`${styles.statusBadge} ${styles.statusBanned}`}><ShieldAlert size={10} style={{display:'inline', marginRight:'2px'}}/> محظور</span>
                                        ) : (
                                            <span className={`${styles.statusBadge} ${v.status === 'active' ? styles.statusActive : styles.statusPending}`}>
                                                {v.status === 'active' ? 'نشط' : 'قيد الانتظار'}
                                            </span>
                                        )}
                                    </td>
                                    <td>
                                        <button 
                                           onClick={() => { if(v.kyc_status === 'pending') setKycModal(v); }}
                                           className={`${styles.kycBtn} ${getKycClass(v.kyc_status)}`}
                                        >
                                            {v.kyc_status === 'approved' ? 'موثق ✅' : v.kyc_status === 'pending' ? 'مراجعة الآن ⏳' : 'غير مكتمل'}
                                        </button>
                                    </td>
                                    <td>
                                        <span className={styles.planBadge}>
                                            <Award size={12} style={{display:'inline', marginRight:'2px'}}/> {v.billing_model || "Standard"}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={styles.balance}>
                                            {v.balance?.toFixed(2)} {t('common.currency', 'ر.س')}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'left', display: 'flex', gap: '8px' }}>
                                        <button 
                                            onClick={() => {
                                                setOverrideModal(v);
                                                setOverrideJson(v.override_limits ? JSON.stringify(v.override_limits, null, 2) : "{\n  \"max_products\": 100,\n  \"max_coupons\": 5,\n  \"allow_whatsapp_checkout\": false,\n  \"allow_store_customization\": false\n}");
                                            }}
                                            className={`${styles.actionBtn}`}
                                            title="إدارة الصلاحيات والاستثناءات"
                                        >
                                            صلاحيات
                                        </button>
                                        <button 
                                            onClick={() => handleBan(v)}
                                            className={`${styles.actionBtn} ${v.is_banned ? '' : styles.danger}`}
                                        >
                                            {v.is_banned ? "فك الحظر" : "حظر التاجر"}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {kycModal && (
            <div className={styles.modalOverlay}>
                <div className={styles.modalContent}>
                    <h2 className={styles.modalTitle}>توثيق التاجر: {kycModal.name}</h2>
                    
                    <div className={styles.modalGrid}>
                        <div className={styles.modalSection}>
                            <h4 className={styles.modalSectionTitle}>المستندات المرفوعة</h4>
                            {(!kycModal.kyc_documents || kycModal.kyc_documents.length === 0) ? (
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>لا توجد مستندات مرفوعة.</p>
                            ) : (
                                <ul className={styles.docList}>
                                    {kycModal.kyc_documents.map((doc, i) => (
                                        <li key={i} className={styles.docItem}>
                                            <span>{doc.document_type}</span>
                                            <a href={doc.file_url} target="_blank" rel="noreferrer" className={styles.docLink}>فتح المستند</a>
                                        </li>
                                    ))}
                                </ul>
                            )}
                            {kycModal.verification_document_url && (
                                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-light)' }}>
                                     <a href={kycModal.verification_document_url} target="_blank" rel="noreferrer" className={styles.docLink}>رابط المستند القديم</a>
                                </div>
                            )}
                        </div>
                        <div className={styles.modalSection}>
                            <h4 className={styles.modalSectionTitle}>القرار التأديبي (في حال الرفض)</h4>
                             <input 
                                className={styles.modalInput}
                                value={rejectionReason}
                                onChange={e => setRejectionReason(e.target.value)}
                                placeholder="سبب الرفض (مثال: الهوية غير واضحة)"
                             />
                        </div>
                    </div>

                    <div className={styles.modalActions}>
                        <button className={`${styles.btnModal} ${styles.btnCancel}`} onClick={() => setKycModal(null)}>إلغاء</button>
                        <button className={`${styles.btnModal} ${styles.btnReject}`} onClick={() => handleKYCReview(false)}>رفض المستندات</button>
                        <button className={`${styles.btnModal} ${styles.btnApprove}`} onClick={() => handleKYCReview(true)}>اعتماد المتجر</button>
                    </div>
                </div>
            </div>
        )}

        {overrideModal && (
            <div className={styles.modalOverlay}>
                <div className={styles.modalContent} style={{ maxWidth: '600px' }}>
                    <h2 className={styles.modalTitle}>إدارة صلاحيات التاجر: {overrideModal.name}</h2>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                        أدخل الصلاحيات الاستثنائية للتاجر بصيغة JSON. هذه الصلاحيات ستتجاوز حدود الباقة الأساسية. لدعم واتساب أو تخصيص المتجر، استخدم القيم المنطقية true/false.
                    </p>
                    <textarea 
                        className={styles.modalInput}
                        rows={10}
                        style={{ fontFamily: 'monospace', direction: 'ltr', width: '100%', padding: '1rem', resize: 'vertical' }}
                        value={overrideJson}
                        onChange={e => setOverrideJson(e.target.value)}
                        placeholder={`{\n  "max_products": 200,\n  "allow_whatsapp_checkout": true\n}`}
                    />
                    <div className={styles.modalActions} style={{ marginTop: '1.5rem' }}>
                        <button className={`${styles.btnModal} ${styles.btnCancel}`} onClick={() => setOverrideModal(null)}>إلغاء</button>
                        <button className={`${styles.btnModal} ${styles.btnApprove}`} onClick={handleSaveOverrides}>حفظ الصلاحيات</button>
                    </div>
                </div>
            </div>
        )}
    </PageContainer>
  );
}
