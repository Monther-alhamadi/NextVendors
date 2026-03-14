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
  
  const [kycModal, setKycModal] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [overrideModal, setOverrideModal] = useState(null);
  const [overrideJson, setOverrideJson] = useState("");

  const [auditModal, setAuditModal] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [vData, sData, bData] = await Promise.all([
          listVendors().catch(() => []),
          getVendorStats().catch(() => ({})),
          getVendorBalances().catch(() => [])
      ]);
      
      const merged = (vData || []).map(v => ({
          ...v,
          balance: bData.find(b => b.supplier_id === v.id)?.balance || 0
      }));
      
      setVendors(merged);
      setStats(sData || { total_vendors: 0, pending_kyc: 0});
    } catch (e) {
      console.error(e);
      toast.push({ message: t("common.error_loading_data"), type: "error" });
    } finally {
      setLoading(false);
    }
  }

  async function handleKYCReview(approved) {
      if (!kycModal) return;
      try {
          await reviewKYC(kycModal.id, approved, approved ? null : rejectionReason);
          toast.push({ message: t("common.save_success"), type: "success" });
          setKycModal(null);
          setRejectionReason("");
          loadData();
      } catch (e) {
          toast.push({ message: t("common.error"), type: "error" });
      }
  }

  async function handleBan(vendor) {
      if (!window.confirm(`${t('admin.confirm_delete_user')} ${vendor.name}?`)) return;
      try {
          await banVendor(vendor.id, !vendor.is_banned);
          toast.push({ message: t("common.save_success"), type: "success" });
          loadData();
      } catch (e) {
          toast.push({ message: t("common.error"), type: "error" });
      }
  }

  async function handleViewAuditLogs(vendor) {
      setAuditModal(vendor);
      setLoadingLogs(true);
      try {
          const { getVendorAuditLogs } = await import("../services/vendorService");
          const logs = await getVendorAuditLogs(vendor.id);
          setAuditLogs(logs);
      } catch (e) {
          toast.push({ message: t("common.error"), type: "error" });
      } finally {
          setLoadingLogs(false);
      }
  }

  async function handleSaveOverrides() {
      if (!overrideModal) return;
      try {
          const parsed = overrideJson ? JSON.parse(overrideJson) : null;
          const { adminUpdateVendor } = await import("../services/vendorService");
          await adminUpdateVendor(overrideModal.id, { override_limits: parsed });
          toast.push({ message: t("common.save_success"), type: "success" });
          setOverrideModal(null);
          loadData();
      } catch (e) {
          toast.push({ message: t("common.error"), type: "error" });
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
                <h1 className={styles.pageTitle}>{t('admin.vendors_title')}</h1>
                <p className={styles.pageSubtitle}>{t('admin.vendors_subtitle')}</p>
             </div>
             <div className={styles.headerActions}>
                 <div className={styles.statsBox}>
                     <span className={styles.statsLabel}>{t("admin.pending_kyc")}</span>
                     <span className={styles.statsValue}>{stats.pending_kyc || 0}</span>
                 </div>
                 <button className={styles.primaryBtn} onClick={() => alert(t("common.loading"))}>
                    <Plus size={18} /> {t("admin.add_vendor")}
                 </button>
             </div>
        </div>

        <div className={styles.tabs}>
            <button
               onClick={() => setActiveTab('all')}
               className={`${styles.tabBtn} ${activeTab === 'all' ? styles.active : ''}`}
            >
                {t('common.all')}
            </button>
            <button
               onClick={() => setActiveTab('kyc')}
               className={`${styles.tabBtn} ${activeTab === 'kyc' ? styles.active : ''}`}
            >
                {stats.pending_kyc > 0 && <span className={styles.tabBadge}>{stats.pending_kyc}</span>}
                {t('admin.verification')}
            </button>
            <button
               onClick={() => setActiveTab('banned')}
               className={`${styles.tabBtn} ${activeTab === 'banned' ? styles.active : ''}`}
            >
                {t('admin.suspended')}
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
                                <th>{t('admin.vendor')}</th>
                                <th>{t('common.status')}</th>
                                <th>{t('admin.verification')}</th>
                                <th>{t('admin.plan')}</th>
                                <th>{t('admin.balance')}</th>
                                <th style={{ textAlign: 'left' }}>{t('common.actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredVendors.length === 0 ? (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                                        <Store size={40} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
                                        {t("common.no_data")}
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
                                                <div className={styles.storeCode}>{v.code || '-'}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        {v.is_banned ? (
                                            <span className={`${styles.statusBadge} ${styles.statusBanned}`}><ShieldAlert size={10} style={{display:'inline', marginRight:'2px'}}/> {t("admin.suspended")}</span>
                                        ) : (
                                            <span className={`${styles.statusBadge} ${v.status === 'active' ? styles.statusActive : styles.statusPending}`}>
                                                {v.status === 'active' ? t('admin.active') : t('admin.pending')}
                                            </span>
                                        )}
                                    </td>
                                    <td>
                                        <button 
                                           onClick={() => { if(v.kyc_status === 'pending') setKycModal(v); }}
                                           className={`${styles.kycBtn} ${getKycClass(v.kyc_status)}`}
                                        >
                                            {v.kyc_status === 'approved' ? t('admin.verified') : v.kyc_status === 'pending' ? t('admin.approve') : t('admin.unverified')}
                                        </button>
                                    </td>
                                    <td>
                                        <span className={styles.planBadge}>
                                            <Award size={12} style={{display:'inline', marginRight:'2px'}}/> {v.billing_model || "Standard"}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={styles.balance}>
                                            {v.balance?.toFixed(2)} {t('common.currency')}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'left', display: 'flex', gap: '8px' }}>
                                        <button 
                                            onClick={() => handleViewAuditLogs(v)}
                                            className={`${styles.actionBtn}`}
                                        >
                                            {t('admin.audit_logs') || "سجل التدقيق"}
                                        </button>
                                        <button 
                                            onClick={() => {
                                                setOverrideModal(v);
                                                setOverrideJson(v.override_limits ? JSON.stringify(v.override_limits, null, 2) : "{\n  \"max_products\": 100,\n  \"max_coupons\": 5,\n  \"allow_whatsapp_checkout\": false,\n  \"allow_store_customization\": false\n}");
                                            }}
                                            className={`${styles.actionBtn}`}
                                        >
                                            {t('admin.security_settings')}
                                        </button>
                                        <button 
                                            onClick={() => handleBan(v)}
                                            className={`${styles.actionBtn} ${v.is_banned ? '' : styles.danger}`}
                                        >
                                            {v.is_banned ? t("admin.unsuspend") : t("admin.suspend")}
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
                    <h2 className={styles.modalTitle}>{t("admin.verification")}: {kycModal.name}</h2>
                    
                    <div className={styles.modalGrid}>
                        <div className={styles.modalSection}>
                            <h4 className={styles.modalSectionTitle}>{t("admin.view_document")}</h4>
                            {(!kycModal.kyc_documents || kycModal.kyc_documents.length === 0) ? (
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{t("common.no_data")}</p>
                            ) : (
                                <ul className={styles.docList}>
                                    {kycModal.kyc_documents.map((doc, i) => (
                                        <li key={i} className={styles.docItem}>
                                            <span>{doc.document_type}</span>
                                            <a href={doc.file_url} target="_blank" rel="noreferrer" className={styles.docLink}>{t("admin.view_document")}</a>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        <div className={styles.modalSection}>
                            <h4 className={styles.modalSectionTitle}>{t("admin.action_reject")}</h4>
                             <input 
                                className={styles.modalInput}
                                value={rejectionReason}
                                onChange={e => setRejectionReason(e.target.value)}
                                placeholder={t("admin.reject_reason_ph")}
                             />
                        </div>
                    </div>

                    <div className={styles.modalActions}>
                        <button className={`${styles.btnModal} ${styles.btnCancel}`} onClick={() => setKycModal(null)}>{t("common.cancel")}</button>
                        <button className={`${styles.btnModal} ${styles.btnReject}`} onClick={() => handleKYCReview(false)}>{t("admin.reject")}</button>
                        <button className={`${styles.btnModal} ${styles.btnApprove}`} onClick={() => handleKYCReview(true)}>{t("admin.approve")}</button>
                    </div>
                </div>
            </div>
        )}

        {overrideModal && (
            <div className={styles.modalOverlay}>
                <div className={styles.modalContent} style={{ maxWidth: '600px' }}>
                    <h2 className={styles.modalTitle}>{t("admin.security_settings")}: {overrideModal.name}</h2>
                    <textarea 
                        className={styles.modalInput}
                        rows={10}
                        style={{ fontFamily: 'monospace', direction: 'ltr', width: '100%', padding: '1rem', resize: 'vertical' }}
                        value={overrideJson}
                        onChange={e => setOverrideJson(e.target.value)}
                    />
                    <div className={styles.modalActions} style={{ marginTop: '1.5rem' }}>
                        <button className={`${styles.btnModal} ${styles.btnCancel}`} onClick={() => setOverrideModal(null)}>{t("common.cancel")}</button>
                        <button className={`${styles.btnModal} ${styles.btnApprove}`} onClick={handleSaveOverrides}>{t("common.save")}</button>
                    </div>
                </div>
            </div>
        )}

        {auditModal && (
            <div className={styles.modalOverlay}>
                <div className={styles.modalContent} style={{ maxWidth: '700px' }}>
                    <h2 className={styles.modalTitle}>{t("admin.audit_logs") || "سجل التدقيق"}: {auditModal.name}</h2>
                    <div style={{ maxHeight: '400px', overflowY: 'auto', marginBottom: '1.5rem', background: 'var(--bg-page)', padding: '1rem', borderRadius: '8px' }}>
                        {loadingLogs ? (
                            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 0' }}>{t("common.loading") || "جاري التحميل..."}</p>
                        ) : auditLogs.length === 0 ? (
                            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 0' }}>{t("common.no_data") || "لا توجد سجلات"}</p>
                        ) : (
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                {auditLogs.map(log => (
                                    <li key={log.id} style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '0.8rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                            <strong style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>{log.action}</strong>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                {new Date(log.created_at).toLocaleString('ar-SA')}
                                            </span>
                                        </div>
                                        {log.details && <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{log.details}</p>}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                    <div className={styles.modalActions}>
                        <button className={`${styles.btnModal} ${styles.btnCancel}`} onClick={() => setAuditModal(null)}>{t("common.close") || "إغلاق"}</button>
                    </div>
                </div>
            </div>
        )}
    </PageContainer>
  );
}
