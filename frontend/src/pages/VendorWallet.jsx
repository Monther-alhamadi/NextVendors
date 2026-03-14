import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useToast } from "../components/common/ToastProvider";
import api from "../services/api";
import { Wallet, Clock, CheckCircle, ArrowRightLeft, Landmark, TrendingUp, AlertCircle } from "lucide-react";
import s from "./VendorWallet.module.css";

export default function VendorWallet() {
  const { t } = useTranslation();
  const toast = useToast();
  const navigate = useNavigate();
  const [requesting, setRequesting] = useState(false);
  const [balanceData, setBalanceData] = useState({ balance: 0.0, pending: 0.0, total_payouts: 0.0 });
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchWalletData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/payouts/my-balance");
      setBalanceData(res.data);
      
      if (res.data.supplier_id) {
        const txRes = await api.get(`/payouts/supplier/${res.data.supplier_id}`);
        setTransactions(txRes.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch wallet data:", err);
      toast.push({ message: t("common.error", "فشل تحميل بيانات المحفظة"), type: "error" });
    } finally {
      setLoading(false);
    }
  }, [t, toast]);

  useEffect(() => {
    fetchWalletData();
  }, [fetchWalletData]);

  const handleWithdrawalRequest = () => {
    if (balanceData.balance <= 0) {
      toast.push({ message: t("vendor.no_balance_to_withdraw", "لا يوجد رصيد قابل للسحب حالياً"), type: "warning" });
      return;
    }
    navigate("/vendor/payouts/request");
  };

  const getTransactionIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'payout': return <Landmark size={18} className={s.iconSuccess} />;
      case 'refund': return <Clock size={18} className={s.iconWarning} />;
      default: return <ArrowRightLeft size={18} className={s.iconInfo} />;
    }
  };

  if (loading) {
    return (
      <div className={s.loadingScreen}>
        <div className={s.spinner} />
        <p>{t("common.loading", "جارٍ التحميل...")}</p>
      </div>
    );
  }

  return (
    <div className={s.container}>
      <header className={s.header}>
        <div className={s.headerTitle}>
          <Wallet className={s.titleIcon} size={24} />
          <h1 className={s.title}>{t('vendor.wallet_title', 'المحفظة المالية')}</h1>
        </div>
        <button 
          className={s.withdrawBtn} 
          onClick={handleWithdrawalRequest}
          disabled={balanceData.balance <= 0}
        >
          <Landmark size={18} /> {t('vendor.request_payout', 'طلب سحب رصيد')}
        </button>
      </header>

      {/* Balance Cards */}
      <div className={s.statsGrid}>
        <div className={s.statCard}>
          <div className={`${s.statIcon} ${s.statGreen}`}>
            <Wallet size={28} />
          </div>
          <div className={s.statContent}>
            <div className={s.statLabel}>{t('vendor.available_balance', 'الرصيد المتاح')}</div>
            <div className={s.statValue}>{balanceData.balance.toFixed(2)} {t('common.currency', 'ر.س')}</div>
          </div>
        </div>

        <div className={s.statCard}>
          <div className={`${s.statIcon} ${s.statAmber}`}>
            <Clock size={28} />
          </div>
          <div className={s.statContent}>
            <div className={s.statLabel}>{t('vendor.pending_balance', 'رصيد معلق')}</div>
            <div className={s.statValue}>{balanceData.pending.toFixed(2)} {t('common.currency', 'ر.س')}</div>
          </div>
        </div>

        <div className={s.statCard}>
          <div className={`${s.statIcon} ${s.statBlue}`}>
            <TrendingUp size={28} />
          </div>
          <div className={s.statContent}>
            <div className={s.statLabel}>{t('vendor.total_payouts_made', 'إجمالي المسحوبات')}</div>
            <div className={s.statValue}>{balanceData.total_payouts.toFixed(2)} {t('common.currency', 'ر.س')}</div>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className={s.historyCard}>
        <div className={s.cardHead}>
          <h2 className={s.cardTitle}>{t('vendor.transaction_history', 'سجل العمليات المالية')}</h2>
        </div>

        <div className={s.tableWrapper}>
          <table className={s.table}>
            <thead>
              <tr>
                <th>{t('common.date', 'التاريخ')}</th>
                <th>{t('common.id', 'رقم العملية')}</th>
                <th>{t('common.type', 'النوع')}</th>
                <th>{t('common.status', 'الحالة')}</th>
                <th style={{textAlign: 'left'}}>{t('common.amount', 'المبلغ')}</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan="5" className={s.emptyCell}>
                    <AlertCircle size={32} opacity={0.3} />
                    <p>{t('vendor.no_transactions', 'لا يوجد سجل عمليات حتى الآن.')}</p>
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id}>
                    <td className={s.dateCell}>
                      {new Date(tx.created_at).toLocaleDateString(i18n.language === 'ar' ? 'ar-SA' : 'en-US')}
                    </td>
                    <td className={s.idCell}>#{tx.id}</td>
                    <td>
                      <div className={s.typeWrapper}>
                        {getTransactionIcon(tx.transaction_type)}
                        <span>{tx.transaction_type}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`${s.statusBadge} ${s[tx.status?.toLowerCase()] || ''}`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className={`${s.amountCell} ${tx.amount > 0 ? s.positive : s.negative}`} style={{textAlign: 'left'}}>
                      {tx.amount > 0 ? '+' : ''}{tx.amount.toFixed(2)} {t('common.currency', 'ر.س')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
