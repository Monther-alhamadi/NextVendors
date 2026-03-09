import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useToast } from "../components/common/ToastProvider";
import api from "../services/api";
import { Wallet, Clock, CheckCircle, ArrowRightLeft, Landmark } from "lucide-react";
import s from "./VendorWallet.module.css";

export default function VendorWallet() {
  const { t } = useTranslation();
  const toast = useToast();
  const navigate = useNavigate();
  const [requesting, setRequesting] = useState(false);
  const [balanceData, setBalanceData] = useState({ balance: 0.0, pending: 0.0, total_payouts: 0.0 });
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWalletData();
  }, []);

  async function fetchWalletData() {
    try {
      const res = await api.get("/payouts/my-balance");
      setBalanceData(res.data);
      
      if (res.data.supplier_id) {
        const txRes = await api.get(`/payouts/supplier/${res.data.supplier_id}`);
        setTransactions(txRes.data);
      }
    } catch (err) {
      console.error("Failed to load wallet", err);
      toast.push({ message: t('common.error_loading', 'مشكلة في جلب البيانات'), type: "error" });
    } finally {
      setLoading(false);
    }
  }

  const handleRequestPayout = async () => {
    if (balanceData.balance <= 0) {
       toast.push({ message: t('vendor.insufficient_balance', 'الرصيد غير كافٍ'), type: "warning" });
       return;
    }
    setRequesting(true);
    try {
         await new Promise(r => setTimeout(r, 1000));
         toast.push({ message: t('vendor.payout_request_success', 'تم إرسال طلب السحب بنجاح'), type: "success" });
    } catch (err) {
        toast.push({ message: t('common.error', 'حدث خطأ'), type: "error" });
    } finally {
        setRequesting(false);
    }
  };

  const getTransactionTypeClass = (type) => {
    const t = type.toLowerCase();
    if (t === 'sale') return s.typeSale;
    if (t === 'payout') return s.typePayout;
    if (t === 'subscription_fee') return s.typeSub;
    return s.typeSale;
  };

  return (
    <div className={s.page}>
      <div className={s.header}>
        <div>
          <h1 className={s.title}>{t('vendor.wallet', 'المحفظة')}</h1>
          <p className={s.subtitle}>تتبع أرباحك وعمليات السحب الخاصة بمتجرك.</p>
        </div>
      </div>

      <div className={s.statsGrid}>
          {/* Balance Card */}
          <div className={s.balanceCard}>
              <div className={s.cardTop}>
                  <div className={s.cardTitleWrap}>
                      <div className={`${s.cardIcon} ${s.iconSuccess}`}><Wallet size={24} /></div>
                      <h3 className={s.cardTitle}>{t('vendor.available_balance', 'الرصيد المتاح')}</h3>
                  </div>
              </div>
              <div>
                  <div className={s.amount}>
                    {loading ? "..." : `${balanceData.balance.toFixed(2)} ${t('common.currency', 'ر.س')}`}
                  </div>
              </div>
              <button 
                onClick={handleRequestPayout} 
                className={s.actionBtn}
                disabled={balanceData.balance <= 0 || requesting}
              >
                  {requesting ? 'جاري الطلب...' : t('vendor.payout_request', 'طلب سحب أرباح')}
              </button>
          </div>

          {/* Pending Card */}
          <div className={s.balanceCard}>
              <div className={s.cardTop}>
                  <div className={s.cardTitleWrap}>
                      <div className={`${s.cardIcon} ${s.iconWarning}`}><Clock size={24} /></div>
                      <h3 className={s.cardTitle}>{t('vendor.pending_clearance', 'أرباح معلقة')}</h3>
                  </div>
              </div>
              <div>
                  <div className={s.amount}>
                    {loading ? "..." : `${balanceData.pending.toFixed(2)} ${t('common.currency', 'ر.س')}`}
                  </div>
              </div>
              <p className={s.hint}>
                {t('vendor.funds_hold_desc', 'هذه المبالغ قيد المراجعة أو معلقة لفترة الضمان قبل إتاحتها للسحب.')}
              </p>
          </div>
          
           {/* Total Payouts Card */}
          <div className={s.balanceCard}>
             <div className={s.cardTop}>
                  <div className={s.cardTitleWrap}>
                      <div className={`${s.cardIcon} ${s.iconInfo}`}><CheckCircle size={24} /></div>
                      <h3 className={s.cardTitle}>{t('vendor.total_payouts', 'إجمالي المسحوبات')}</h3>
                  </div>
              </div>
              <div>
                  <div className={s.amount}>
                     {loading ? "..." : `${balanceData.total_payouts.toFixed(2)} ${t('common.currency', 'ر.س')}`}
                  </div>
              </div>
              <Link to="/vendor/payouts" className={s.viewAllLink} style={{marginTop: 'auto', textDecoration: 'none'}}>
                  عرض سجل السحوبات &rarr;
              </Link>
          </div>
      </div>

      {/* Transactions */}
      <div className={s.transactionsSection}>
          <div className={s.txHeader}>
            <h2 className={s.txTitle}>{t('vendor.transaction_history', 'سجل المعاملات')}</h2>
          </div>
          <div className={s.tableWrap}>
              <table className={s.table}>
                  <thead>
                      <tr>
                          <th>{t('common.date', 'التاريخ')}</th>
                          <th>{t('common.description', 'الوصف')}</th>
                          <th>{t('common.type', 'النوع')}</th>
                          <th style={{textAlign: 'left'}}>{t('common.amount', 'المبلغ')}</th>
                      </tr>
                  </thead>
                  <tbody>
                      {transactions.length === 0 && !loading && (
                          <tr>
                              <td colSpan="4" style={{textAlign: 'center', padding: '3rem', color: 'var(--text-muted)'}}>
                                {t('common.no_data', 'لا توجد بيانات متاحة')}
                              </td>
                          </tr>
                      )}
                      {transactions.map(tx => (
                          <tr key={tx.id}>
                              <td className={s.date}>{new Date(tx.created_at).toLocaleDateString()}</td>
                              <td className={s.desc}>{tx.description}</td>
                              <td>
                                  <span className={`${s.typeBadge} ${getTransactionTypeClass(tx.transaction_type)}`}>
                                      {tx.transaction_type}
                                  </span>
                              </td>
                              <td className={`${s.amountCell} ${tx.amount > 0 ? s.positive : s.negative}`} style={{textAlign: 'left'}}>
                                  {tx.amount > 0 ? '+' : ''}{tx.amount.toFixed(2)}
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      </div>
    </div>
  );
}
