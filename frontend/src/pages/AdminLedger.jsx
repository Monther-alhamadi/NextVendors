import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Search, Library, FileText } from "lucide-react";
import PageContainer from "../components/PageContainer";
import api from "../services/api";
import Skeleton from "../components/common/Skeleton";
import styles from "./AdminLedger.module.css";

export default function AdminLedger() {
  const { t } = useTranslation();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    loadLedger();
  }, []);

  async function loadLedger() {
    try {
      setLoading(true);
      const res = await api.get("/payouts/ledger");
      setEntries(res.data || []);
    } catch (e) {
      console.error("Ledger load failed", e);
    } finally {
      setLoading(false);
    }
  }

  const filtered = entries.filter(e => 
    e.transaction_type?.toLowerCase().includes(filter.toLowerCase()) ||
    e.supplier?.name?.toLowerCase().includes(filter.toLowerCase()) ||
    e.reference_id?.includes(filter)
  );

  return (
    <PageContainer>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>{t('admin.ledger_title', 'السجل المالي (Ledger)')}</h1>
          <p className={styles.pageSubtitle}>{t('admin.ledger_subtitle', 'تتبع الحركات المالية والمبيعات وعمليات السحب بشكل مفصل')}</p>
        </div>
        <div className={styles.searchBox}>
          <Search size={18} color="var(--text-muted)" />
          <input 
            type="text" 
            placeholder={t('admin.ledger_filter_placeholder', 'ابحث برقم المرجع أو اسم التاجر...')} 
            className={styles.searchInput}
            value={filter}
            onChange={e => setFilter(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableWrapper}>
            <table className={styles.dataGrid}>
              <thead>
                <tr>
                  <th>{t('admin.timestamp', 'الوقت والتاريخ')}</th>
                  <th>{t('admin.vendor', 'صاحب الحركة (التاجر)')}</th>
                  <th>{t('admin.transaction_type', 'نوع العملية')}</th>
                  <th>{t('admin.amount', 'المبلغ')}</th>
                  <th>{t('admin.reference', 'المرجع النظامي')}</th>
                  <th>{t('common.details', 'التفاصيل')}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [1,2,3,4,5].map(i => (
                    <tr key={i}>
                      <td><Skeleton width="120px" height="20px" /></td>
                      <td><Skeleton width="100px" height="20px" /></td>
                      <td><Skeleton width="80px" height="24px" className="rounded-md" /></td>
                      <td><Skeleton width="60px" height="24px" /></td>
                      <td><Skeleton width="100px" height="24px" className="rounded-md" /></td>
                      <td><Skeleton width="200px" height="20px" /></td>
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                       <div className={styles.emptyState}>
                          <Library size={48} className="mb-4 opacity-30" />
                          <p>{t('auto_301ba0', t('auto_301ba0', 'لا توجد أي حركات مالية مطابقة للبحث.'))}</p>
                       </div>
                    </td>
                  </tr>
                ) : filtered.map((e) => (
                  <tr key={e.id}>
                    <td className={styles.timeCol}>{new Date(e.created_at).toLocaleString()}</td>
                    <td className={styles.vendorCol}>{e.supplier?.name || t('admin.system', 'النظام (System)')}</td>
                    <td>
                      <span className={`${styles.typeBadge} ${
                        e.transaction_type === 'SALE' ? styles.typeSale :
                        e.transaction_type === 'PAYOUT' ? styles.typePayout :
                        styles.typeSystem
                      }`}>
                        {e.transaction_type}
                      </span>
                    </td>
                    <td className={`${styles.amountCol} ${e.amount >= 0 ? styles.amountPositive : styles.amountNegative}`}>
                      {e.amount >= 0 ? '+' : ''}{e.amount.toFixed(2)} {t('common.currency', 'ر.س')}
                    </td>
                    <td>
                        <span className={styles.refCol}>
                           <FileText size={10} style={{display:'inline', marginRight:'4px'}} />
                           #{e.reference_id || 'N/A'}
                        </span>
                    </td>
                    <td className={styles.descCol}>"{e.description}"</td>
                  </tr>
                ))}
              </tbody>
            </table>
        </div>
      </div>
    </PageContainer>
  );
}
