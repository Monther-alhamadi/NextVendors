import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useToast } from "../components/common/ToastProvider";
import { getLogs } from "../services/adminService";
import withMonitoring from "../hocs/withMonitoring";
import PageContainer from "../components/PageContainer";
import { RefreshCw, Search, X } from "lucide-react";
import styles from "./AdminLogs.module.css";

function AdminLogs() {
  const { t } = useTranslation();
  const [rows, setRows] = useState([]);
  const [limit, setLimit] = useState(100);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [level, setLevel] = useState("");
  const [q, setQ] = useState("");
  const toast = useToast();

  async function load() {
    setLoading(true);
    try {
      const data = await getLogs({
        limit,
        level: level || undefined,
        q: q || undefined,
      });
      if (Array.isArray(data)) setRows(data);
      else if (data && Array.isArray(data.items)) setRows(data.items);
      else setRows([]);
    } catch (e) {
      console.error(e);
      toast.push({ message: t('admin.load_failed', 'فشل تحميل السجلات'), type: "error" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [limit]);

  function applyFilter(e) {
    if(e) e.preventDefault();
    load();
  }

  return (
    <PageContainer>
      <div className={styles.pageHeader}>
        <div>
           <h1 className={styles.pageTitle}>{t('admin.frontend_logs', 'سجلات النظام (Logs)')}</h1>
           <p className={styles.pageSubtitle}>{t('admin.logs_desc', 'مراقبة أخطاء وأحداث واجهة المستخدم')}</p>
        </div>
        <button onClick={load} className={styles.refreshBtn}>
            <RefreshCw size={16} /> {t('common.refresh', 'تحديث')}
        </button>
      </div>

      <div className={styles.filterCard}>
          <form onSubmit={applyFilter} style={{display:'flex', width:'100%', gap:'1.5rem', flexWrap:'wrap', alignItems:'flex-end'}}>
            <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>{t('admin.level', 'المستوى')}</label>
                <select
                  id="level"
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  className={styles.filterInput}
                >
                  <option value="">{t('common.all', 'الكل')}</option>
                  <option value="error">❌ {t('admin.level_error', 'خطأ (Error)')}</option>
                  <option value="warning">⚠️ {t('admin.level_warning', 'تحذير (Warning)')}</option>
                  <option value="info">ℹ️ {t('admin.level_info', 'معلومة (Info)')}</option>
                </select>
            </div>
            
            <div className={`${styles.filterGroup} ${styles.searchGroup}`}>
                <label className={styles.filterLabel}>{t('common.search_placeholder', 'بحث...')}</label>
                <div style={{position:'relative'}}>
                   <Search size={16} style={{position:'absolute', top:'50%', transform:'translateY(-50%)', left:'1rem', color:'var(--text-muted)'}} />
                   <input
                     id="q"
                     value={q}
                     onChange={(e) => setQ(e.target.value)}
                     placeholder={t('common.search_placeholder', 'بحث في السجلات...')}
                     className={styles.filterInput}
                     style={{paddingLeft:'2.5rem'}}
                   />
                </div>
            </div>

            <div className={styles.filterActions}>
                <button type="submit" className={styles.filterBtn}>
                  {t('common.apply', 'تطبيق الدقة')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLevel("");
                    setQ("");
                    setTimeout(load, 0);
                  }}
                  className={`${styles.filterBtn} ${styles.clear}`}
                >
                  {t('admin.clear_filters', 'إلغاء الفلاتر')}
                </button>
            </div>
          </form>
      </div>

      <div className={styles.tableCard}>
        {loading ? (
            <div className={styles.emptyState}>{t('common.loading', 'جاري التحميل...')}</div>
        ) : rows.length === 0 ? (
            <div className={styles.emptyState}>
                <p className={styles.emptyText}>{t('admin.no_logs', 'لا توجد سجلات مطابقة.')}</p>
            </div>
        ) : (
            <div className={styles.tableWrapper}>
                <table className={styles.dataGrid}>
                  <thead>
                    <tr>
                      <th>{t('admin.received_at', 'تاريخ الاستلام')}</th>
                      <th>{t('admin.level', 'المستوى')}</th>
                      <th>{t('admin.source', 'المصدر')}</th>
                      <th>{t('common.customer', 'المستخدم')}</th>
                      <th>{t('admin.details', 'التفاصيل')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, idx) => (
                      <tr
                        key={idx}
                        className={selected?.received_at === r.received_at ? styles.selected : ''}
                        onClick={() => setSelected(selected?.received_at === r.received_at ? null : r)}
                      >
                        <td className={styles.timeCol}>{r.received_at}</td>
                        <td>
                            <span className={`${styles.levelBadge} ${r.level === 'error' ? styles.levelError : r.level === 'warning' ? styles.levelWarning : styles.levelInfo}`}>
                                {r.level}
                            </span>
                        </td>
                        <td className={styles.sourceCol}>{r.source}</td>
                        <td className={styles.userCol}>{r.user_id || "Guest"}</td>
                        <td className={styles.msgCol} title={String(r.message)}>{String(r.message)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
            </div>
        )}
      </div>

      {selected && (
        <div className={styles.detailPanel}>
          <div className={styles.detailHeader}>
              <h3 className={styles.detailTitle}>{t('admin.details', 'التفاصيل التقنية الدقيقة')}</h3>
              <button onClick={() => setSelected(null)} className={styles.closeBtn}>
                  <X size={20} />
              </button>
          </div>
          <div className={styles.detailBody}>
              <pre className={styles.jsonOutput}>
                {JSON.stringify(selected, null, 2)}
              </pre>
          </div>
        </div>
      )}
    </PageContainer>
  );
}

export default withMonitoring(AdminLogs, "AdminLogsPage");
