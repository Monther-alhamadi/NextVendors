import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { RefreshCw, PackageX, Check, X } from "lucide-react";
import api from "../services/api";
import { useToast } from "../components/common/ToastProvider";
import { useConfirm } from "../components/common/ConfirmProvider";
import PageContainer from "../components/PageContainer";
import Skeleton from "../components/common/Skeleton";
import styles from "./AdminRMA.module.css";

export default function AdminRMA() {
  const { t } = useTranslation();
  const toast = useToast();
  const confirm = useConfirm();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRequests();
  }, []);

  async function loadRequests() {
    setLoading(true);
    try {
      const res = await api.get("/rma/all");
      setRequests(res.data || []);
    } catch (e) {
      console.error(e);
      toast.push({ message: t('admin.load_failed', 'فشل تحميل بيانات الاسترجاع'), type: "error" });
    } finally {
      setLoading(false);
    }
  }

  async function processRequest(id, action) {
    const ok = await confirm(t('admin.confirm_rma_action', `هل أنت متأكد من ${action === 'approve' ? 'الموافقة على' : 'رفض'} هذا الطلب؟`));
    if (!ok) return;
    try {
      await api.post(`/rma/${id}/process`, { action });
      toast.push({ message: t('common.save_success', 'تم تنفيذ الإجراء بنجاح'), type: "success" });
      loadRequests();
    } catch (e) {
      console.error(e);
      toast.push({ message: t('common.error', 'حدث خطأ'), type: "error" });
    }
  }

  const getReasonClass = (reason) => {
    switch (reason?.toLowerCase()) {
      case 'damaged': return styles.reasonDamaged;
      default: return styles.reasonOther;
    }
  };

  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return styles.statusPending;
      case 'completed': return styles.statusCompleted;
      case 'rejected': return styles.statusRejected;
      default: return styles.statusPending;
    }
  };

  return (
    <PageContainer>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>{t('admin.rma_title', 'إدارة الاسترجاع والتعويضات (RMA)')}</h1>
          <p className={styles.pageSubtitle}>{t('admin.rma_subtitle', 'مراجعة طلبات استرجاع المبالغ أو تبديل المنتجات')}</p>
        </div>
        <button onClick={loadRequests} className={styles.primaryBtn}>
          <RefreshCw size={16} /> {t('common.refresh', 'تحديث البيانات')}
        </button>
      </div>

      <div className={styles.tableCard}>
        {loading ? (
          <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[1,2,3,4].map(i => <Skeleton key={i} height="60px" className="rounded-md" />)}
          </div>
        ) : requests.length === 0 ? (
          <div className={styles.emptyState}>
             <PackageX size={48} className={styles.emptyIcon} />
             <p>{t('admin.no_returns', 'لا توجد طلبات استرجاع حالياً.')}</p>
          </div>
        ) : (
          <div className={styles.tableWrapper}>
              <table className={styles.dataGrid}>
                <thead>
                  <tr>
                    <th>{t('common.id', 'رقم')}</th>
                    <th>{t('admin.order_item', 'عنصر الطلب')}</th>
                    <th>{t('admin.reason', 'السبب')}</th>
                    <th>{t('admin.refund_amount', 'قيمة الاسترداد')}</th>
                    <th>{t('product.status', 'الحالة')}</th>
                    <th style={{ textAlign: 'left' }}>{t('common.actions', 'الإجراءات')}</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((r) => (
                    <tr key={r.id}>
                      <td><span className={styles.rmaId}>#{r.id}</span></td>
                      <td>
                        <div className={styles.orderInfo}>
                           <span className={styles.orderTxt}>{t('common.order', 'طلب')} #{r.order_id}</span>
                           <span className={styles.itemTxt}>{t('common.item', 'عنصر')} #{r.order_item_id}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`${styles.reasonBadge} ${getReasonClass(r.reason)}`}>
                          {t(`admin.reason_${r.reason}`, r.reason)}
                        </span>
                      </td>
                      <td>
                        <span className={styles.refundAmount}>
                           {r.refund_amount?.toLocaleString()} {t('common.currency', 'ر.س')}
                        </span>
                      </td>
                      <td>
                        <span className={`${styles.statusBadge} ${getStatusClass(r.status)}`}>
                          {t(`admin.status_${r.status}`, r.status)}
                        </span>
                      </td>
                      <td style={{ textAlign: 'left' }}>
                        {r.status === 'pending' ? (
                          <div className={styles.actionGroup} style={{ justifyContent: 'flex-end' }}>
                            <button className={`${styles.btnSm} ${styles.btnApprove}`} onClick={() => processRequest(r.id, "approve")}>
                               <Check size={14} /> {t('admin.approve', 'موافقة')}
                            </button>
                            <button className={`${styles.btnSm} ${styles.btnReject}`} onClick={() => processRequest(r.id, "reject")}>
                               <X size={14} /> {t('admin.reject', 'رفض')}
                            </button>
                          </div>
                        ) : (
                          <span className={styles.processedTxt}>{t('admin.processed', 'تمت المعالجة')}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
