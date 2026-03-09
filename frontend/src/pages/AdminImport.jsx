import React, { useState } from "react";
import api from "../services/api";
import { useTranslation } from "react-i18next";
import PageContainer from "../components/PageContainer";
import CustomButton from "../components/common/CustomButton";


export default function AdminImport() {
  const { t } = useTranslation();
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState('info');
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (!file) {
      setMessage(t('admin.select_file_first'));
      setMessageType('warning');
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const fd = new FormData();
      fd.append("file", file, file.name);
      const r = await api.post("/admin/tools/import/upload", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setMessage(t('admin.items_created', { count: r.data.created }));
      setMessageType('success');
      setFile(null);
    } catch (err) {
      console.error(err);
      setMessage(t('admin.import_failed'));
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageContainer>
      <div className="page-header">
        <div>
             <h1 className="text-3xl font-black text-slate-800 tracking-tight">{t('admin.import_products')}</h1>
             <p className="subtitle text-slate-500">{t('admin.import_desc')}</p>
        </div>
      </div>

      <div className="card-premium p-8 max-w-2xl border-l-4 border-l-indigo-500 animate-fade-in">
        <form onSubmit={submit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-3 uppercase tracking-wider">
              📁 {t('admin.select_file')}
            </label>
            <div className="relative">
              <input
                data-testid="file-input"
                type="file"
                accept=".csv,application/json,text/csv"
                onChange={(e) => setFile(e.target.files && e.target.files[0])}
                className="block w-full text-sm text-slate-500 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 file:cursor-pointer cursor-pointer bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>
            {file && (
              <div className="mt-3 p-3 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium flex items-center gap-2 border border-blue-100">
                📄 {file.name} <span className="opacity-70">({(file.size / 1024).toFixed(2)} KB)</span>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <CustomButton
              type="submit"
              variant="primary"
              disabled={loading || !file}
              loading={loading}
              className="flex-1 shadow-lg shadow-indigo-200 btn-primary-soft"
            >
              {loading ? t('common.processing') : t('admin.import_now')}
            </CustomButton>
            {file && (
              <CustomButton
                type="button"
                variant="secondary"
                onClick={() => { setFile(null); setMessage(null); }}
                className="bg-white border border-slate-200 text-slate-500 hover:bg-slate-50"
              >
                {t('common.cancel')}
              </CustomButton>
            )}
          </div>
        </form>

        <div className="my-8 border-t border-slate-200"></div>

        <div className="mb-4">
             <h2 className="text-xl font-bold text-slate-800">🌐 {t('admin.import_from_url')}</h2>
             <p className="text-sm text-slate-500 mb-4">{t('admin.import_url_desc')}</p>
             <form onSubmit={async (e) => {
                e.preventDefault();
                const url = e.target.url.value;
                if (!url) return;
                setLoading(true);
                setMessage(null);
                try {
                    const r = await api.post("/admin/tools/import/url", { url });
                    setMessage(t('admin.import_success_product', { name: r.data.product.name }));
                    setMessageType('success');
                    e.target.reset();
                } catch (err) {
                    setMessage(err.response?.data?.detail || t('admin.import_failed'));
                    setMessageType('error');
                } finally {
                    setLoading(false);
                }
             }} className="flex gap-3">
                 <input 
                    name="url"
                    type="url" 
                    placeholder="https://aliexpress.com/item/..." 
                    className="flex-1 rounded-xl border-slate-200 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                 />
                 <CustomButton 
                    type="submit" 
                    variant="primary"
                    loading={loading}
                    disabled={loading}
                 >
                    {t('admin.import')}
                 </CustomButton>
             </form>
        </div>

        {message && (
          <div data-testid="message" className={`mt-6 p-4 rounded-xl font-bold animate-slide-down border shadow-sm ${
            messageType === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
            messageType === 'error' ? 'bg-red-50 text-red-700 border-red-100' :
            messageType === 'warning' ? 'bg-amber-50 text-amber-700 border-amber-100' :
            'bg-blue-50 text-blue-700 border-blue-100'
          }`}>
            <div className="flex items-center gap-2">
              {messageType === 'success' && '✅'}
              {messageType === 'error' && '❌'}
              {messageType === 'warning' && '⚠️'}
              {messageType === 'info' && 'ℹ️'}
              {message}
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .animate-fade-in { animation: fadeIn 0.4s ease-out both; }
        .animate-slide-down { animation: slideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1) both; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </PageContainer>
  );
}
