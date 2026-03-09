import React, { useEffect, useState } from "react";
import PageContainer from "../components/PageContainer";
import { useTranslation } from "react-i18next";
import { getWallet, topUpWallet } from "../services/walletService";
import CustomButton from "../components/common/CustomButton";
import Input from "../components/common/Input";
import { useToast } from "../components/common/ToastProvider";
import Skeleton from "../components/common/Skeleton";

export default function Wallet() {
  const { t } = useTranslation();
  const toast = useToast();
  
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showTopUp, setShowTopUp] = useState(false);
  const [amount, setAmount] = useState(50);

  useEffect(() => {
    loadWallet();
  }, []);

  async function loadWallet() {
    try {
      setLoading(true);
      const data = await getWallet();
      setWallet(data);
    } catch (error) {
        console.error(error);
      toast.push({ message: t("common.error"), type: "error" });
    } finally {
      setLoading(false);
    }
  }

  async function handleTopUp(e) {
    e.preventDefault();
    try {
      await topUpWallet(amount, "User Deposit");
      toast.push({ message: t("wallet.topup_success"), type: "success" });
      setShowTopUp(false);
      loadWallet();
    } catch (error) {
      toast.push({ message: t("common.error"), type: "error" });
    }
  }

  if (loading) {
      return (
          <PageContainer>
              <Skeleton height="200px" className="rounded-2xl" />
          </PageContainer>
      );
  }

  return (
    <PageContainer>
      <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
        <header className="flex justify-between items-center">
            <div>
                 <h1 className="text-3xl font-black text-slate-800 tracking-tight">{t("wallet.title", "My Wallet")}</h1>
                 <p className="subtitle">{t("wallet.subtitle", "Manage your balance and transactions")}</p>
            </div>
            <CustomButton className="btn-primary-soft shadow-lg shadow-indigo-200" onClick={() => setShowTopUp(true)}>
                ➕ {t("wallet.top_up", "Top Up")}
            </CustomButton>
        </header>

        {/* Balance Card */}
        <div className="card-premium bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-900 text-white p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 transform translate-x-10 -translate-y-10 group-hover:scale-110 transition-transform duration-700">
                <svg width="200" height="200" fill="currentColor" viewBox="0 0 24 24"><path d="M21 18v1c0 1.1-.9 2-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h14c1.1 0 2 .9 2 2v1h-9a2 2 0 00-2 2v8a2 2 0 002 2h9zm-9-2h9v-4h-9v4z" /></svg>
            </div>
            
            <p className="text-indigo-200 font-bold uppercase tracking-widest text-sm mb-2 opacity-80">{t("wallet.total_balance", "Total Balance")}</p>
            <div className="text-6xl font-black tracking-tight flex items-baseline gap-2">
                <span className="text-4xl opacity-50 font-medium">{wallet?.currency || "$"}</span>
                {wallet?.balance?.toFixed(2) || "0.00"}
            </div>
            
            <div className="mt-8 flex gap-6 border-t border-indigo-500/30 pt-6">
                <div>
                     <p className="text-xs text-indigo-300 uppercase font-bold mb-1">{t("wallet.loyalty_points", "Loyalty Points")}</p>
                     <p className="text-xl font-bold">✨ {wallet?.loyalty_points || 0}</p>
                </div>
            </div>
        </div>

        {/* Transactions */}
        <div className="card-premium">
            <h3 className="font-bold text-xl text-slate-800 mb-6 border-b border-slate-100 pb-4">{t("wallet.transactions", "Recent Transactions")}</h3>
            {(!wallet?.transactions || wallet.transactions.length === 0) ? (
                <div className="text-center py-12 text-slate-400">
                    <p>{t("wallet.no_transactions", "No transactions yet.")}</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {wallet.transactions.map((tx) => (
                        <div key={tx.id} className="flex items-center justify-between p-4 rounded-xl hover:bg-slate-50 transition-colors border border-slate-50 hover:border-slate-100">
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg shadow-sm ${tx.transaction_type === "credit" ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-500"}`}>
                                    {tx.transaction_type === "credit" ? "↓" : "↑"}
                                </div>
                                <div>
                                    <p className="font-bold text-slate-800">{tx.description}</p>
                                    <p className="text-xs text-slate-400 font-mono">{new Date(tx.created_at).toLocaleDateString()} • {new Date(tx.created_at).toLocaleTimeString()}</p>
                                </div>
                            </div>
                            <div className={`font-mono font-bold text-lg ${tx.transaction_type === "credit" ? "text-emerald-600" : "text-slate-800"}`}>
                                {tx.transaction_type === "credit" ? "+" : "-"}{wallet.currency}{tx.amount.toFixed(2)}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>

        {/* Top Up Modal */}
        {showTopUp && (
             <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 animate-fade-in">
                 <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-sm w-full border border-slate-100">
                      <h3 className="text-xl font-bold mb-4">{t("wallet.top_up", "Top Up Wallet")}</h3>
                      <form onSubmit={handleTopUp} className="space-y-6">
                           <Input 
                              label={t("wallet.amount", "Amount")}
                              type="number"
                              value={amount}
                              onChange={e => setAmount(e.target.value)}
                              className="input-premium text-2xl font-bold"
                              autoFocus
                           />
                           
                           <div className="flex justify-end gap-3">
                               <CustomButton variant="secondary" onClick={() => setShowTopUp(false)}>{t("common.cancel")}</CustomButton>
                               <CustomButton type="submit" variant="primary" className="shadow-lg shadow-indigo-200">{t("common.confirm")}</CustomButton>
                           </div>
                      </form>
                 </div>
             </div>
        )}
      </div>
      <style jsx>{`
            .animate-fade-in { animation: fadeIn 0.4s ease-out forwards; opacity: 0; }
            @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </PageContainer>
  );
}
