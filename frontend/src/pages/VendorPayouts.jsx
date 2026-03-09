import React, { useState, useEffect } from "react";
import PageContainer from "../components/PageContainer";
import { useTranslation } from "react-i18next";
import { Wallet, ArrowUpCircle, Clock, CheckCircle2, XCircle } from "lucide-react";
import payoutService from "../services/payoutService";
import { useToast } from "../components/common/ToastProvider";
import CustomButton from "../components/common/CustomButton";
import Input from "../components/common/Input";
import api from "../services/api";

export default function VendorPayouts() {
  const { t } = useTranslation();
  const toast = useToast();
  const [balance, setBalance] = useState({ available: 0, pending: 0 });
  const [history, setHistory] = useState([]);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [walletRes, historyRes] = await Promise.all([
        api.get("/wallet/me"), // Adjust endpoint if needed
        payoutService.getPayoutHistory().catch(() => [])
      ]);
      setBalance({
        available: walletRes.data.balance,
        pending: walletRes.data.pending_balance
      });
      setHistory(historyRes || []);
    } catch (err) {
      console.error(err);
    } finally {
      setFetching(false);
    }
  }

  async function handleRequest(e) {
    e.preventDefault();
    const val = parseFloat(amount);
    if (!val || val <= 0) return;
    if (val > balance.available) {
        toast.push({ message: t('vendor.insufficient_balance'), type: 'error' });
        return;
    }

    setLoading(true);
    try {
      await payoutService.requestPayout(val);
      toast.push({ message: t('vendor.payout_requested'), type: "success" });
      setAmount("");
      loadData();
    } catch (err) {
      toast.push({ message: err.response?.data?.detail || "Request failed", type: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageContainer>
      <div className="mb-10">
        <h1 className="text-3xl font-black text-slate-800 mb-2">{t('vendor.payouts_title', 'Financial Settlement')}</h1>
        <p className="text-slate-500 font-medium">Manage your earnings and request withdrawals.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        {/* WALLET SUMMARY */}
        <div className="card-premium p-8 bg-indigo-600 text-white flex flex-col justify-between">
           <div>
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mb-6">
                 <Wallet size={24} />
              </div>
              <div className="text-sm font-bold text-indigo-200 uppercase tracking-widest mb-1">{t('vendor.available_balance')}</div>
              <div className="text-4xl font-black">{balance.available.toFixed(2)} SAR</div>
           </div>
           <div className="mt-8 pt-6 border-t border-white/10">
              <div className="flex justify-between items-center opacity-80">
                 <span className="text-sm font-bold">{t('vendor.pending_escrow', 'Pending in Escrow')}</span>
                 <span className="font-mono">{balance.pending.toFixed(2)} SAR</span>
              </div>
           </div>
        </div>

        {/* REQUEST FORM */}
        <div className="lg:col-span-2 card-premium p-8">
           <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <ArrowUpCircle size={20} className="text-indigo-500" />
              {t('vendor.request_withdrawal', 'Request Withdrawal')}
           </h3>
           <form onSubmit={handleRequest} className="space-y-6">
              <div className="max-w-md">
                 <Input 
                   label={t('vendor.payout_amount', 'Amount to Withdraw')}
                   type="number"
                   step="0.01"
                   value={amount}
                   onChange={e => setAmount(e.target.value)}
                   placeholder="0.00"
                   className="input-soft"
                   required
                 />
                 <p className="text-xs text-slate-400 mt-2">Maximum available: {balance.available.toFixed(2)} SAR</p>
              </div>
              
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 flex gap-3">
                 <Clock size={20} className="text-amber-600 shrink-0" />
                 <p className="text-xs text-amber-800 font-medium leading-relaxed">
                    Withdrawal requests are typically processed within 3-5 business days. Funds will be sent to your primary payout method.
                 </p>
              </div>

              <CustomButton 
                type="submit" 
                variant="primary" 
                loading={loading}
                disabled={!amount || parseFloat(amount) <= 0 || loading}
                className="btn-primary-soft py-4 px-10"
              >
                 {t('vendor.submit_request', 'Submit Payout Request')}
              </CustomButton>
           </form>
        </div>
      </div>

      {/* HISTORY TABLE */}
      <div className="card-premium overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
           <h3 className="font-bold text-slate-800">{t('vendor.payout_history', 'Payout History')}</h3>
        </div>
        <div className="overflow-x-auto">
          {fetching ? (
             <div className="p-10 text-center text-slate-400">Loading history...</div>
          ) : history.length === 0 ? (
             <div className="p-20 text-center">
                <div className="text-4xl mb-4">📭</div>
                <h4 className="text-lg font-bold text-slate-800">No payouts yet</h4>
                <p className="text-slate-500">Your future payout requests will appear here.</p>
             </div>
          ) : (
             <table className="w-full text-right sm:text-left">
                <thead className="bg-slate-50 text-slate-400 text-xs font-bold uppercase tracking-widest">
                   <tr>
                      <th className="px-6 py-4">ID</th>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4">Amount</th>
                      <th className="px-6 py-4">Status</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                   {history.map(item => (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                         <td className="px-6 py-4 font-mono text-sm text-slate-500">#{item.id}</td>
                         <td className="px-6 py-4 font-medium text-slate-700">{new Date(item.created_at).toLocaleDateString()}</td>
                         <td className="px-6 py-4 font-black text-slate-800">{item.amount.toFixed(2)} SAR</td>
                         <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                                item.status === 'completed' ? 'bg-green-100 text-green-700' :
                                item.status === 'pending' ? 'bg-indigo-100 text-indigo-700' :
                                'bg-red-100 text-red-700'
                            }`}>
                               {item.status === 'completed' ? <CheckCircle2 size={12} /> :
                                item.status === 'pending' ? <Clock size={12} /> :
                                <XCircle size={12} />}
                               {item.status.toUpperCase()}
                            </span>
                         </td>
                      </tr>
                   ))}
                </tbody>
             </table>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
