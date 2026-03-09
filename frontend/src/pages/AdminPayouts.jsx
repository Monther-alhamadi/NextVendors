import React, { useState, useEffect } from "react";
import payoutService from "../services/payoutService";
import { useTranslation } from "react-i18next";
import { useToast } from "../components/common/ToastProvider";
import { useConfirm } from "../components/common/ConfirmProvider";
import { Check, X, Clock, User, DollarSign, Wallet } from "lucide-react";
import PageContainer from "../components/PageContainer";
import Skeleton from "../components/common/Skeleton";
import styles from "./AdminPayouts.module.css";

export default function AdminPayouts() {
    const { t } = useTranslation();
    const toast = useToast();
    const confirm = useConfirm();
    
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("pending");

    useEffect(() => {
        fetchRequests();
    }, [filter]);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const data = await payoutService.listAllPayoutRequests(filter === "all" ? null : filter);
            setRequests(data || []);
        } catch (err) {
            toast.push({ message: t("common.error_loading_data", "Failed to load payout requests"), type: "error" });
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id) => {
        const ok = await confirm(t('admin.confirm_approve_payout', 'هل أنت متأكد من الموافقة على طلب السحب؟'));
        if (!ok) return;

        try {
            await payoutService.approvePayoutRequest(id);
            toast.push({ message: t("admin.payout_approved", "Payout approved successfully"), type: "success" });
            fetchRequests();
        } catch (err) {
            toast.push({ message: t("common.error", "Approval failed"), type: "error" });
        }
    };

    const handleReject = async (id) => {
        const reason = window.prompt(t('admin.payout_rejection_reason', "Enter rejection reason:"));
        if (reason === null) return;
        
        try {
            await payoutService.rejectPayoutRequest(id, reason || "Rejected by Admin");
            toast.push({ message: t("admin.payout_rejected", "Payout rejected"), type: "info" });
            fetchRequests();
        } catch (err) {
            toast.push({ message: t("common.error", "Rejection failed"), type: "error" });
        }
    };

    return (
        <PageContainer>
            <div className={styles.pageHeader}>
                <div>
                    <h1 className={styles.pageTitle}>{t('admin.payout_requests', 'طلبات السحب (Payouts)')}</h1>
                    <p className={styles.pageSubtitle}>{t('admin.payout_subtitle', 'مراجعة ومعالجة طلبات تحويل الأرصدة للتُجّار')}</p>
                </div>
                <div className={styles.filterGroup}>
                    {['pending', 'completed', 'rejected', 'all'].map(s => (
                        <button
                            key={s}
                            onClick={() => setFilter(s)}
                            className={`${styles.filterBtn} ${filter === s ? styles.active : ''}`}
                        >
                            {t(`common.${s}`, s)}
                        </button>
                    ))}
                </div>
            </div>

            <div className={styles.tableCard}>
                <div className={styles.tableWrapper}>
                    <table className={styles.dataGrid}>
                        <thead>
                            <tr>
                                <th>{t('admin.vendor', 'التاجر')}</th>
                                <th>{t('admin.amount', 'المبلغ')}</th>
                                <th>{t('admin.requested_at', 'وقت الطلب')}</th>
                                <th>{t('common.status', 'الحالة')}</th>
                                <th style={{ textAlign: 'left' }}>{t('common.actions', 'الإجراءات')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                [1,2,3,4].map(i => (
                                    <tr key={i}>
                                        <td><Skeleton width="150px" height="40px" /></td>
                                        <td><Skeleton width="80px" height="24px" /></td>
                                        <td><Skeleton width="120px" height="20px" /></td>
                                        <td><Skeleton width="100px" height="24px" className="rounded-full" /></td>
                                        <td><Skeleton width="80px" height="32px" /></td>
                                    </tr>
                                ))
                            ) : requests.length === 0 ? (
                                <tr>
                                    <td colSpan={5}>
                                        <div className={styles.emptyState}>
                                           <Wallet size={48} className="opacity-30 mb-2 mx-auto" />
                                           <p>{t('admin.no_payouts', 'لا توجد طلبات سحب مطابقة.')}</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : requests.map(req => (
                                <tr key={req.id}>
                                    <td>
                                        <div className={styles.vendorCell}>
                                            <div className={styles.vendorIcon}>
                                                <User size={18} />
                                            </div>
                                            <div className={styles.vendorInfo}>
                                                <div className={styles.vendorName}>{t('admin.vendor_id')} #{req.user_id}</div>
                                                <div className={styles.vendorMethod}>{req.method || 'Default Method'}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className={styles.amountCol}>
                                            <DollarSign size={14} style={{display:'inline', color:'var(--text-muted)'}} />
                                            {req.amount.toFixed(2)}
                                        </div>
                                    </td>
                                    <td className={styles.dateCol}>
                                        {new Date(req.created_at).toLocaleString()}
                                    </td>
                                    <td>
                                        <span className={`${styles.statusBadge} ${
                                            req.status === 'completed' ? styles.statusCompleted :
                                            req.status === 'pending' ? styles.statusPending :
                                            styles.statusRejected
                                        }`}>
                                            {req.status === 'completed' ? <Check size={10} /> :
                                             req.status === 'pending' ? <Clock size={10} /> : <X size={10} />}
                                            {req.status}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'left' }}>
                                        {req.status === 'pending' ? (
                                            <div className={styles.actionsCol}>
                                                <button 
                                                    onClick={() => handleApprove(req.id)}
                                                    className={`${styles.actionBtn} ${styles.approveBtn}`}
                                                    title={t('admin.approve', 'موافقة')}
                                                >
                                                    <Check size={16} />
                                                </button>
                                                <button 
                                                    onClick={() => handleReject(req.id)}
                                                    className={`${styles.actionBtn} ${styles.rejectBtn}`}
                                                    title={t('admin.reject', 'رفض')}
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className={styles.processedLabel}>{t('admin.processed', 'تمت المعالجة')}</div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </PageContainer>
    );
}
