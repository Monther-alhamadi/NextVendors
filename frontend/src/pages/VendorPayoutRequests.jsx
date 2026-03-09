import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { DollarSign, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import api from "../services/api";
import { useToast } from "../components/common/ToastProvider";
import * as walletService from "../services/walletService";
import s from "./VendorPayoutRequests.module.css";

export default function VendorPayoutRequests() {
  const { t } = useTranslation();
  const toast = useToast();
  const [wallet, setWallet] = useState(null);
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);

  const MINIMUM_PAYOUT = 100; // SAR

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [walletData, payoutData] = await Promise.all([
        walletService.getWallet(),
        api.get('/vendor/payouts')
      ]);
      
      setWallet(walletData);
      setPayouts(payoutData.data || []);
    } catch (e) {
      console.error(e);
      toast.push({ message: t('common.error_loading_data', 'خطأ في تحميل البيانات'), type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  async function requestPayout() {
    if (wallet.balance < MINIMUM_PAYOUT) {
      toast.push({ 
        message: t('vendor.insufficient_balance', `الحد الأدنى للسحب هو ${MINIMUM_PAYOUT} ريال`), 
        type: 'warning' 
      });
      return;
    }

    setRequesting(true);
    try {
      await api.post('/vendor/payouts/request', {
        amount: wallet.balance
      });
      
      toast.push({ message: t('vendor.payout_requested', 'تم إرسال طلب السحب بنجاح!'), type: 'success' });
      await loadData();
    } catch (e) {
      console.error(e);
      toast.push({ message: e.response?.data?.detail || t('common.error', 'حدث خطأ'), type: 'error' });
    } finally {
      setRequesting(false);
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock size={16} color="var(--warning)" />;
      case 'approved': return <CheckCircle size={16} color="var(--success)" />;
      case 'completed': return <CheckCircle size={16} color="var(--clr-emerald-600)" />;
      case 'rejected': return <XCircle size={16} color="var(--danger)" />;
      default: return <AlertCircle size={16} color="var(--text-muted)" />;
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending': return s.badgePending;
      case 'approved': return s.badgeApproved;
      case 'completed': return s.badgeCompleted;
      case 'rejected': return s.badgeRejected;
      default: return s.badgeDefault;
    }
  };

  if (loading) {
    return (
      <div className={s.page} style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className={s.page}>
      <div className={s.header}>
        <h1 className={s.title}>{t('vendor.payout_requests', 'طلبات السحب')}</h1>
        <p className={s.subtitle}>{t('vendor.payout_desc', 'إدارة ومراجعة طلبات سحب الأرباح الخاصة بك')}</p>
      </div>

      {/* Wallet Balance Card */}
      <div className={s.walletCard}>
        <div className={s.walletCardTop}>
          <div className={s.walletIconWrap}>
            <DollarSign size={32} />
          </div>
          <div className={s.cardInfo}>
            <h2 className={s.balanceLabel}>{t('vendor.available_balance', 'الرصيد القابل للسحب')}</h2>
            <div className={s.balanceAmount}>{wallet?.balance?.toFixed(2) || '0.00'} {t('common.currency', 'ر.س')}</div>
            <p className={s.pendingLabel}>{t('vendor.pending', 'أرباح معلقة')}: {wallet?.pending_balance?.toFixed(2) || '0.00'} {t('common.currency', 'ر.س')}</p>
          </div>
        </div>
        
        <div className={s.actions}>
          <button 
            onClick={requestPayout}
            disabled={requesting || wallet?.balance < MINIMUM_PAYOUT}
            className={s.requestBtn}
          >
            {requesting ? t('common.processing', 'جاري المعالجة...') : t('vendor.request_payout', 'طلب سحب')}
          </button>
          {wallet?.balance < MINIMUM_PAYOUT && (
            <span className={s.warningHint}>
              ⚠️ {t('vendor.minimum_payout_msg', `الحد الأدنى للسحب: ${MINIMUM_PAYOUT} ريال`)}
            </span>
          )}
        </div>
      </div>

      {/* Payout History */}
      <div className={s.historySection}>
        <h2 className={s.historyTitle}>{t('vendor.payout_history', 'سجل السحوبات')}</h2>
        
        {payouts.length === 0 ? (
          <div className={s.emptyState}>
            <DollarSign size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
            <p>{t('vendor.no_payouts', 'لا توجد طلبات سحب حتى الآن')}</p>
          </div>
        ) : (
          <div className={s.tableWrap}>
            <table className={s.table}>
              <thead>
                <tr>
                  <th>{t('vendor.date', 'التاريخ')}</th>
                  <th>{t('vendor.amount', 'المبلغ')}</th>
                  <th>{t('vendor.status', 'الحالة')}</th>
                  <th>{t('vendor.notes', 'ملاحظات')}</th>
                </tr>
              </thead>
              <tbody>
                {payouts.map((payout) => (
                  <tr key={payout.id}>
                    <td>{new Date(payout.created_at).toLocaleDateString()}</td>
                    <td className={s.amountCell}>{payout.amount.toFixed(2)} {t('common.currency', 'ر.س')}</td>
                    <td>
                      <div className={s.statusWrap}>
                        <div className={s.statusIcon}>
                            {getStatusIcon(payout.status)}
                        </div>
                        <span className={`${s.badge} ${getStatusBadgeClass(payout.status)}`}>
                            {t(`vendor.payout_status_${payout.status}`, payout.status)}
                        </span>
                      </div>
                    </td>
                    <td className={s.notesCell}>{payout.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
