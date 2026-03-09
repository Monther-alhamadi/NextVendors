import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import PageContainer from "../components/PageContainer";
import CustomButton from "../components/common/CustomButton";
import api from "../services/api";

export default function CustomerSupport() {
  const { t } = useTranslation();
  const [tickets, setTickets] = useState([]);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ subject: "", category: "Order Issue", priority: "medium", initial_message: "", order_id: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMyTickets();
    const params = new URLSearchParams(window.location.search);
    const disputeOrderId = params.get("dispute_order");
    if (disputeOrderId) {
      setForm((prev) => ({
        ...prev,
        subject: `Order Issue #${disputeOrderId}`,
        category: "Order Issue",
        initial_message: `I would like to report an issue with order #${disputeOrderId}...`,
        order_id: parseInt(disputeOrderId, 10)
      }));
      setShowNew(true);
    }
  }, []);

  async function loadMyTickets() {
    try {
      const res = await api.get("/support/tickets");
      setTickets(res.data);
    } catch (e) {
      console.error("Failed to load your tickets", e);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit() {
    if (!form.subject || !form.initial_message) return;
    try {
      await api.post("/support/tickets", form);
      setShowNew(false);
      setForm({ subject: "", category: "Order Issue", priority: "medium", initial_message: "", order_id: null });
      loadMyTickets();
    } catch (e) {
      alert("Failed to create ticket");
    }
  }

  return (
    <PageContainer>
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-black text-gray-800 mb-2">My Support Tickets</h1>
          <p className="text-gray-500 font-medium">How can we help you today?</p>
        </div>
        <CustomButton onClick={() => setShowNew(true)} className="rounded-2xl px-8 shadow-lg shadow-primary/20">
          Open New Ticket
        </CustomButton>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tickets.map(t => (
          <div key={t.id} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer">
            <div className="flex justify-between items-start mb-4">
              <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${
                t.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
              }`}>
                {t.status}
              </span>
              <span className="text-xs text-gray-400 font-mono">#{t.id}</span>
            </div>
            <h3 className="font-bold text-gray-800 mb-2 text-lg truncate">{t.subject}</h3>
            <p className="text-xs text-gray-500 mb-4">{t.category} • Updated {new Date(t.updated_at).toLocaleDateString()}</p>
            <CustomButton variant="outline" size="sm" className="w-full rounded-xl" onClick={() => {/* Navigate to chat */}}>
              View Conversation
            </CustomButton>
          </div>
        ))}
      </div>

      {showNew && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[32px] p-10 w-full max-w-xl shadow-2xl animate-float-in">
            <h2 className="text-3xl font-black text-gray-800 mb-6">Open New Ticket</h2>
            
            <div className="flex flex-col gap-5 text-left mb-8">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-gray-500 ml-1">Subject</label>
                <input 
                  type="text" 
                  className="p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all"
                  value={form.subject}
                  onChange={(e) => setForm({...form, subject: e.target.value})}
                  placeholder="e.g. Broken item received"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-gray-500 ml-1">Category</label>
                  <select 
                    className="p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none"
                    value={form.category}
                    onChange={(e) => setForm({...form, category: e.target.value})}
                  >
                    <option>Order Issue</option>
                    <option>Billing</option>
                    <option>Technical</option>
                    <option>Account</option>
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-gray-500 ml-1">Priority</label>
                  <select 
                    className="p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none"
                    value={form.priority}
                    onChange={(e) => setForm({...form, priority: e.target.value})}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-gray-500 ml-1">Message</label>
                <textarea 
                  className="p-4 bg-gray-50 border border-gray-100 rounded-2xl h-32 outline-none resize-none"
                  value={form.initial_message}
                  onChange={(e) => setForm({...form, initial_message: e.target.value})}
                  placeholder="Describe your issue in detail..."
                />
              </div>
            </div>

            <div className="flex gap-4">
              <CustomButton onClick={handleSubmit} className="flex-1 rounded-2xl py-6">Submit Ticket</CustomButton>
              <CustomButton variant="outline" onClick={() => setShowNew(false)} className="px-8 rounded-2xl">Cancel</CustomButton>
            </div>
          </div>
        </div>
      )}
      
      <style jsx>{`
        .animate-float-in { animation: floatIn 0.5s cubic-bezier(0.16, 1, 0.3, 1); }
        @keyframes floatIn { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </PageContainer>
  );
}
