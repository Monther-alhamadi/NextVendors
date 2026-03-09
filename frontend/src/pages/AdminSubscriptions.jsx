import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import PageContainer from "../components/PageContainer";
import CustomButton from "../components/common/CustomButton";
import Input from "../components/common/Input";
import { useToast } from "../components/common/ToastProvider";
import api from "../services/api";


export default function AdminSubscriptions() {
  const { t } = useTranslation();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const toast = useToast();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    monthly_price: 0,
    commission_rate: 0.10,
    features: ""
  });

  useEffect(() => {
    loadPlans();
  }, []);

  async function loadPlans() {
    try {
      setLoading(true);
      const res = await api.get("/subscription-plans/");
      setPlans(res.data);
    } catch (e) {
      toast.push({ message: t('common.error'), type: "error" });
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await api.post("/subscription-plans/", formData);
      toast.push({ message: t('common.save_success'), type: "success" });
      setShowCreate(false);
      setFormData({ name: "", description: "", monthly_price: 0, commission_rate: 0.10, features: "" });
      loadPlans();
    } catch (e) {
      toast.push({ message: e.response?.data?.detail || t('common.error'), type: "error" });
    }
  }

  async function handleChargeFee(plan) {
    if (!window.confirm(`Charge ${plan.monthly_price} to all vendors subscribed to "${plan.name}"?`)) return;
    try {
        const vendorsRes = await api.get("/vendors");
        const subscribedVendors = vendorsRes.data.filter(v => v.subscription_plan_id === plan.id);
        
        if (subscribedVendors.length === 0) {
            toast.push({ message: "No vendors on this plan", type: "info" });
            return;
        }

        for (const v of subscribedVendors) {
            await api.post(`/payouts/charge-subscription?supplier_id=${v.id}`);
        }
        
        toast.push({ message: `Charged ${subscribedVendors.length} vendors`, type: "success" });
    } catch (e) {
        toast.push({ message: t('common.error'), type: "error" });
    }
  }

  return (
    <PageContainer>
      <div className="page-header">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">{t('admin.subscriptions_title')}</h1>
          <p className="subtitle text-slate-500">{t('admin.subscriptions_subtitle')}</p>
        </div>
        <CustomButton variant="primary" className="btn-primary-soft" onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? t('common.cancel') : t('admin.create_plan')}
        </CustomButton>
      </div>

      {showCreate && (
        <div className="card-premium p-8 mb-8 border-l-4 border-l-indigo-500 animate-fade-in">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input 
              label={t('admin.plan_name')} 
              required 
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="input-soft"
            />
            <Input 
              label={t('admin.monthly_price')} 
              type="number" 
              step="0.01" 
              required 
              value={formData.monthly_price}
              onChange={e => setFormData({...formData, monthly_price: parseFloat(e.target.value)})}
              className="input-soft"
            />
            <Input 
              label={t('admin.commission_rate')} 
              type="number" 
              step="0.01" 
              required 
              value={formData.commission_rate}
              onChange={e => setFormData({...formData, commission_rate: parseFloat(e.target.value)})}
              helpText="e.g. 0.10 for 10%"
              className="input-soft"
            />
            <Input 
              label={t('common.description')} 
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              className="input-soft"
            />
            <div className="md:col-span-2 flex justify-end gap-2">
              <CustomButton type="submit" variant="success" className="shadow-lg shadow-emerald-200">{t('common.save')}</CustomButton>
            </div>
          </form>
        </div>
      )}

      <div className="plans-grid grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan, i) => (
          <div key={plan.id} className="card-premium p-6 hover:-translate-y-1 transition-all group border border-slate-100" style={{ animationDelay: `${i * 0.1}s` }}>
            <h3 className="text-xl font-black text-slate-800 mb-2">{plan.name}</h3>
            <div className="text-3xl font-black text-indigo-600 mb-4 tracking-tight">
              {t('common.currency')} {plan.monthly_price} <span className="text-sm font-medium text-slate-400">/ {t('admin.monthly')}</span>
            </div>
            <p className="text-slate-500 mb-6 h-12 line-clamp-2 text-sm leading-relaxed">{plan.description}</p>
            <div className="bg-slate-50 p-3 rounded-xl text-sm mb-6 border border-slate-100 font-bold text-slate-600">
              <span className="text-indigo-500 mr-2">📊</span>
              {t('admin.commission_rate')}: <span className="text-slate-800">{plan.commission_rate * 100}%</span>
            </div>
            <CustomButton size="sm" variant="outline" className="w-full rounded-xl py-3 border-slate-200 text-slate-600 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-all" onClick={() => handleChargeFee(plan)}>
              💸 {t('admin.charge_monthly_fee')}
            </CustomButton>
          </div>
        ))}
      </div>
      
      <style jsx>{`
        .animate-fade-in { animation: fadeIn 0.4s ease-out both; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </PageContainer>
  );
}
