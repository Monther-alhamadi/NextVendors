import React, { useEffect, useState } from "react";
import api from "../services/api";
import { useTranslation } from "react-i18next";
import PageContainer from "../components/PageContainer";
import CustomButton from "../components/common/CustomButton";
import { useToast } from "../components/common/ToastProvider";


export default function AdminTasks() {
  const { t } = useTranslation();
  const toast = useToast();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [payload, setPayload] = useState("{}");

  async function load() {
    setLoading(true);
    try {
      const r = await api.get("/admin/tools/tasks");
      setTasks(r.data || []);
    } catch (e) {
      console.error(e);
      toast.push({ message: t('admin.load_failed'), duration: 3000 });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function enqueue(e) {
    e.preventDefault();
    try {
      const payloadObj = JSON.parse(payload || "{}");
      await api.post("/admin/tools/tasks", {
        name,
        payload: payloadObj,
      });
      setName("");
      setPayload("{}");
      toast.push({ message: t('common.save_success'), duration: 3000, type: "success" });
      await load();
    } catch (err) {
      console.error(err);
      toast.push({ message: t('common.error'), duration: 3000, type: "error" });
    }
  }

  async function runTask(id) {
    try {
      await api.post(`/admin/tools/tasks/${id}/run`);
      toast.push({ message: t('admin.task_started'), duration: 3000, type: "success" });
      await load();
    } catch (e) {
      console.error(e);
      toast.push({ message: t('common.error'), duration: 3000, type: "error" });
    }
  }

  return (
    <PageContainer>
      <div className="page-header">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">{t('admin.tasks_panel')}</h1>
          <p className="subtitle text-slate-500">{t('admin.tasks_desc') || "Manage background tasks and queues"}</p>
        </div>
        <CustomButton onClick={load} variant="secondary" size="sm" className="bg-white border border-slate-200 text-slate-600 hover:bg-slate-50">
           🔄 {t('common.refresh')}
        </CustomButton>
      </div>

      <div className="card-premium p-8 mb-8 border-l-4 border-l-indigo-500 animate-fade-in">
        <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
          <span className="text-indigo-500 bg-indigo-50 p-2 rounded-lg">➕</span> {t('admin.enqueue_task')}
        </h2>
        <form onSubmit={enqueue} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('admin.task_name')}</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-soft w-full"
                placeholder={t('admin.task_name')}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('admin.task_payload')}</label>
              <textarea
                value={payload}
                onChange={(e) => setPayload(e.target.value)}
                className="input-soft w-full font-mono text-sm min-h-[80px]"
                placeholder='{"key": "value"}'
              />
            </div>
          </div>
          <div className="flex justify-end">
            <CustomButton type="submit" variant="primary" className="btn-primary-soft shadow-lg shadow-indigo-200">
               {t('admin.enqueue_task')}
            </CustomButton>
          </div>
        </form>
      </div>

      <div className="card-premium overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-lg font-black text-slate-800">{t('admin.current_tasks')}</h2>
        </div>
        {loading ? (
          <div className="p-20 text-center text-slate-400 font-bold">{t('common.loading')}</div>
        ) : tasks.length === 0 ? (
          <div className="p-20 text-center">
            <div className="text-5xl mb-4 opacity-30">📋</div>
            <p className="text-slate-400 font-bold">{t('admin.no_tasks')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
              <table className="premium-table">
                <thead>
                  <tr>
                    <th>{t('common.id')}</th>
                    <th>{t('common.name')}</th>
                    <th>{t('product.status')}</th>
                    <th>{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((task, i) => (
                    <tr key={task.id} className="hover:bg-slate-50 transition-colors">
                      <td className="font-mono text-xs text-slate-400">#{task.id}</td>
                      <td className="font-bold text-slate-800">{task.name}</td>
                      <td>
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          task.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                          task.status === 'running' ? 'bg-blue-100 text-blue-700' :
                          task.status === 'failed' ? 'bg-red-100 text-red-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {task.status}
                        </span>
                      </td>
                      <td>
                        <CustomButton
                          onClick={() => runTask(task.id)}
                          variant="primary"
                          size="sm"
                          disabled={task.status === 'running'}
                          className="btn-primary-soft py-1 px-3 text-xs"
                        >
                          ▶️ {t('admin.run_now')}
                        </CustomButton>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
          </div>
        )}
      </div>

      <style jsx>{`
        .animate-fade-in { animation: fadeIn 0.4s ease-out both; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </PageContainer>
  );
}
