import React, { useState, useEffect } from "react";
import PageContainer from "../components/PageContainer";
import { useTranslation } from "react-i18next";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area 
} from "recharts";
import { Users, ShoppingBag, Wallet, Info, Link as LinkIcon, Copy, Check } from "lucide-react";
import api from "../services/api";
import CustomButton from "../components/common/CustomButton";
import { useToast } from "../components/common/ToastProvider";

export default function AffiliateDashboard() {
  const { t } = useTranslation();
  const toast = useToast();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [productUrl, setProductUrl] = useState("");
  const [generatedLink, setGeneratedLink] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/affiliate/me/stats");
        setStats(res.data);
      } catch (err) {
        console.error("Failed to load affiliate stats", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleGenerateLink = () => {
    if (!productUrl || !stats) return;
    try {
      const url = new URL(productUrl);
      url.searchParams.set("ref", stats.referral_code);
      setGeneratedLink(url.toString());
    } catch (e) {
      // If relative path
      const base = window.location.origin;
      const full = productUrl.startsWith("/") ? `${base}${productUrl}` : `${base}/${productUrl}`;
      const url = new URL(full);
      url.searchParams.set("ref", stats.referral_code);
      setGeneratedLink(url.toString());
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    toast.push({ message: t('common.copied_to_clipboard') || "Copied!", type: "success" });
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <PageContainer><div>Loading...</div></PageContainer>;

  const chartData = [
    { name: 'Mon', visits: 120, conversions: 2 },
    { name: 'Tue', visits: 150, conversions: 4 },
    { name: 'Wed', visits: 180, conversions: 3 },
    { name: 'Thu', visits: 140, conversions: 5 },
    { name: 'Fri', visits: 210, conversions: 6 },
    { name: 'Sat', visits: 250, conversions: 8 },
    { name: 'Sun', visits: 190, conversions: 4 },
  ];

  return (
    <PageContainer>
      <div className="mb-10">
        <h1 className="text-3xl font-black text-slate-800 mb-2">
            {t('affiliate.dashboard_title', 'Affiliate Command Center')}
        </h1>
        <p className="text-slate-500 font-medium">Track your performance and manage your referral links.</p>
      </div>

      {/* REFERRAL LINK SHOWCASE */}
      <div className="card-premium p-8 mb-10 bg-gradient-to-r from-indigo-50 to-violet-50 border-2 border-indigo-200">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold text-slate-800 mb-2 flex items-center gap-2">
              <LinkIcon size={24} className="text-indigo-600" />
              Your Referral Code
            </h2>
            <p className="text-slate-600 mb-4">Share this code to earn commissions</p>
            <div className="flex items-center gap-3">
              <div className="bg-white px-6 py-3 rounded-lg border-2 border-indigo-300 font-mono text-2xl font-bold text-indigo-600">
                {stats?.referral_code || 'Loading...'}
              </div>
              <CustomButton 
                variant="primary" 
                onClick={() => {
                  const link = `${window.location.origin}?ref=${stats?.referral_code}`;
                  navigator.clipboard.writeText(link);
                  toast.push({ message: 'Referral link copied!', type: 'success' });
                }}
              >
                <Copy size={16} className="inline mr-2" />
                Copy Link
              </CustomButton>
            </div>
          </div>
          <CustomButton 
            variant="secondary" 
            size="lg"
            onClick={() => setShowLinkModal(true)}
          >
            <Info size={18} className="inline mr-2" />
            How to Use
          </CustomButton>
        </div>
      </div>

      {/* HELP MODAL */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowLinkModal(false)}>
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full m-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-2xl font-bold text-slate-800">How Affiliate Links Work</h3>
              <button onClick={() => setShowLinkModal(false)} className="text-slate-400 hover:text-slate-600">
                <Check size={24} />
              </button>
            </div>
            
            <div className="space-y-4 mb-6">
              <div className="bg-indigo-50 p-4 rounded-lg">
                <h4 className="font-bold text-slate-800 mb-2">📋 Your Base Link</h4>
                <code className="bg-white px-3 py-2 rounded block text-sm">
                  {window.location.origin}?ref={stats?.referral_code}
                </code>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-bold text-slate-800 mb-2">✨ Example Usage</h4>
                <p className="text-sm text-slate-600 mb-2">Link to a specific product:</p>
                <code className="bg-white px-3 py-2 rounded block text-sm">
                  {window.location.origin}/products/123?ref={stats?.referral_code}
                </code>
              </div>
              
              <div className="bg-amber-50 p-4 rounded-lg">
                <h4 className="font-bold text-slate-800 mb-2">💰 How You Earn</h4>
                <ul className="text-sm text-slate-600 list-disc list-inside space-y-1">
                  <li>When someone clicks your link, we track it for 24 hours</li>
                  <li>If they make a purchase, you get a commission</li>
                  <li>Earnings appear in your wallet once the order is delivered</li>
                </ul>
              </div>
            </div>
            
            <CustomButton 
              variant="primary" 
              onClick={() => setShowLinkModal(false)}
              className="w-full"
            >
              Got it!
            </CustomButton>
          </div>
        </div>
      )}

      {/* STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="card-premium p-6 border-b-4 border-indigo-500">
           <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                 <Users size={24} />
              </div>
              <span className="text-xs font-bold text-green-500 bg-green-50 px-2 py-1 rounded-lg">+12%</span>
           </div>
           <div className="text-3xl font-black text-slate-800 mb-1">{stats?.total_clicks || 0}</div>
           <div className="text-sm font-bold text-slate-400 uppercase tracking-wider">{t('affiliate.total_clicks', 'Total Clicks')}</div>
        </div>

        <div className="card-premium p-6 border-b-4 border-emerald-500">
           <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                 <ShoppingBag size={24} />
              </div>
           </div>
           <div className="text-3xl font-black text-slate-800 mb-1">{stats?.total_conversions || 0}</div>
           <div className="text-sm font-bold text-slate-400 uppercase tracking-wider">{t('affiliate.conversions', 'Conversions')}</div>
        </div>

        <div className="card-premium p-6 border-b-4 border-amber-500">
           <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
                 <Wallet size={24} />
              </div>
           </div>
           <div className="text-3xl font-black text-slate-800 mb-1">{stats?.total_earnings?.toFixed(2) || '0.00'} {stats?.currency}</div>
           <div className="text-sm font-bold text-slate-400 uppercase tracking-wider">{t('affiliate.total_earnings', 'Total Earnings')}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        {/* CHART */}
        <div className="lg:col-span-2 card-premium p-8">
           <div className="flex justify-between items-center mb-8">
              <h3 className="text-lg font-bold text-slate-800">{t('affiliate.performance_trend', 'Performance Trend')}</h3>
              <select className="text-sm font-bold text-slate-500 bg-slate-50 border-none rounded-lg p-2 outline-none">
                 <option>Last 7 Days</option>
                 <option>Last 30 Days</option>
              </select>
           </div>
           <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                  <Tooltip 
                    contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}}
                  />
                  <Area type="monotone" dataKey="visits" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorVisits)" />
                </AreaChart>
              </ResponsiveContainer>
           </div>
        </div>

        {/* WALLET PIPELINE */}
        <div className="card-premium p-8 bg-slate-800 text-white">
           <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <Wallet size={20} className="text-indigo-400" />
              {t('affiliate.earnings_pipeline', 'Earnings Pipeline')}
           </h3>
           
           <div className="space-y-6">
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                 <div className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">{t('affiliate.available', 'Available Now')}</div>
                 <div className="text-3xl font-black text-indigo-400">{stats?.available_balance?.toFixed(2)} {stats?.currency}</div>
              </div>
              
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10 shadow-inner">
                 <div className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">{t('affiliate.pending', 'Pending (Escrow)')}</div>
                 <div className="text-2xl font-black text-white/80">{stats?.pending_balance?.toFixed(2)} {stats?.currency}</div>
                 <div className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                    <Info size={12} /> Releasing soon upon order fulfillment
                 </div>
              </div>

              <CustomButton variant="primary" className="w-full py-4 text-md bg-indigo-600 hover:bg-indigo-500 text-white border-none">
                 {t('affiliate.withdraw', 'Withdraw Funds')}
              </CustomButton>
           </div>
        </div>
      </div>

      {/* LINK GENERATOR */}
      <div className="card-premium p-8 border-dashed border-2 border-indigo-200 bg-indigo-50/30">
        <h3 className="text-xl font-bold text-slate-800 mb-2 flex items-center gap-2">
           <LinkIcon size={24} className="text-indigo-500" />
           {t('affiliate.link_generator', 'Smart Link Generator')}
        </h3>
        <p className="text-slate-500 mb-6 text-sm">Convert any product URL into your personal referral link in one click.</p>
        
        <div className="flex flex-col md:flex-row gap-4">
           <div className="flex-1">
              <input 
                type="text" 
                placeholder="Paste product or category URL here..."
                className="w-full p-4 rounded-xl border-2 border-slate-200 outline-none focus:border-indigo-500 transition-all font-medium"
                value={productUrl}
                onChange={(e) => setProductUrl(e.target.value)}
              />
           </div>
           <button 
             onClick={handleGenerateLink}
             className="px-8 py-4 bg-slate-800 text-white rounded-xl font-bold hover:bg-black transition-all shadow-lg"
           >
              {t('affiliate.generate', 'Generate Link')}
           </button>
        </div>

        {generatedLink && (
            <div className="mt-6 p-4 bg-white rounded-xl border border-indigo-100 flex items-center justify-between gap-4 animate-fade-in">
              <code className="text-indigo-600 font-bold overflow-hidden text-ellipsis whitespace-nowrap text-sm flex-1">
                {generatedLink}
              </code>
              <button 
                onClick={copyToClipboard}
                className={`p-3 rounded-lg flex items-center gap-2 font-bold text-sm transition-all ${copied ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
        )}
      </div>

      <style jsx>{`
        .animate-fade-in {
            animation: fadeIn 0.4s ease-out;
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </PageContainer>
  );
}
