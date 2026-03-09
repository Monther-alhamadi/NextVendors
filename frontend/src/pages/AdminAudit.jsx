import React, { useEffect, useState } from "react";
import PageContainer from "../components/PageContainer";
import { listAudit } from "../services/adminService";
import { useTranslation } from "react-i18next";
import Skeleton from "../components/common/Skeleton";
import { Search, ChevronLeft, ChevronRight, Hash } from "lucide-react";
import withMonitoring from "../hocs/withMonitoring";
import styles from "./AdminAudit.module.css";

function AdminAudit() {
    const { t } = useTranslation();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);

    useEffect(() => {
        fetchLogs();
    }, [page]);

    async function fetchLogs() {
        setLoading(true);
        try {
            const data = await listAudit({ offset: page * 20, limit: 20 });
            setLogs(data);
        } catch (e) {
            console.error("Audit load failed", e);
        } finally {
            setLoading(false);
        }
    }

    const isRtl = t('common.dir', 'ltr') === 'rtl';

    return (
        <PageContainer>
            <div className={styles.pageHeader}>
                <div>
                    <h1 className={styles.pageTitle}>{t('admin.audit_log_viewer', 'سجل تدقيق النظام')}</h1>
                    <p className={styles.pageSubtitle}>{t('admin.audit_desc', 'مراقبة جميع الإجراءات والتغييرات الحساسة داخل المنصة')}</p>
                </div>
            </div>

            <div className={styles.tableCard}>
                <div className={styles.tableWrapper}>
                    <table className={styles.dataGrid}>
                        <thead>
                            <tr>
                                <th>{t('admin.action', 'نوع الإجراء')}</th>
                                <th>{t('admin.target_type', 'الكيان')}</th>
                                <th>{t('admin.details', 'التفاصيل')}</th>
                                <th>{t('admin.timestamp', 'الوقت والتاريخ')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                [1,2,3,4,5].map(i => (
                                    <tr key={i}>
                                        <td><Skeleton width="100px" height="24px" className="rounded-md" /></td>
                                        <td><Skeleton width="120px" height="40px" /></td>
                                        <td><Skeleton width="250px" height="20px" /></td>
                                        <td><Skeleton width="150px" height="20px" /></td>
                                    </tr>
                                ))
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan="4">
                                        <div className={styles.emptyState}>
                                           <Search size={48} className={styles.emptyIcon} />
                                           <div>
                                             <h3 className={styles.emptyText}>{t('common.no_data', 'لا توجد بيانات')}</h3>
                                             <p className={styles.emptyDesc}>{t('admin.audit_log_empty_desc', 'لم يتم تسجيل أي إجراءات حتى الآن.')}</p>
                                           </div>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                logs.map((log) => (
                                    <tr key={log.id}>
                                        <td>
                                            <span className={`${styles.actionBadge} ${
                                                log.action.includes('DELETE') ? styles.actionDelete : 
                                                log.action.includes('UPDATE') ? styles.actionUpdate : 
                                                log.action.includes('CREATE') ? styles.actionCreate : 
                                                styles.actionDefault
                                            }`}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td>
                                            <div className={styles.targetType}>{log.target_type}</div>
                                            {log.target_id && (
                                                <div className={styles.targetId}>
                                                    <Hash size={10} style={{display:'inline', marginRight:'2px'}}/> 
                                                    {log.target_id}
                                                </div>
                                            )}
                                        </td>
                                        <td className={styles.detailsCol} title={log.details}>
                                            {log.details}
                                        </td>
                                        <td className={styles.timeCol}>{new Date(log.created_at).toLocaleString()}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className={styles.pagination}>
                <button 
                    disabled={page === 0} 
                    onClick={() => setPage(p => p - 1)}
                    className={styles.pageBtn}
                >
                    {isRtl ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                    {t('common.prev', 'السابق')}
                </button>
                <div className={styles.pageInfo}>
                    {t('common.page', 'صفحة')} {page + 1}
                </div>
                <button 
                    disabled={(logs?.length || 0) < 20} 
                    onClick={() => setPage(p => p + 1)}
                    className={styles.pageBtn}
                >
                    {t('common.next', 'التالي')}
                    {isRtl ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
                </button>
            </div>
        </PageContainer>
    );
}

export default withMonitoring(AdminAudit, "AdminAuditPage");
