import React, { useEffect, useState } from "react";
import api from "../services/api";
import { getCacheConfig, setCacheConfig } from "../services/adminCacheService";
import withMonitoring from "../hocs/withMonitoring";
import { error as logError } from "../utils/logger";
import { useTranslation } from "react-i18next";
import PageContainer from "../components/PageContainer";
import { RefreshCw, ArrowUpCircle } from "lucide-react";
import styles from "./AdminCache.module.css";

export default withMonitoring(AdminCache, "AdminCachePage");

function AdminCache() {
  const { t } = useTranslation();
  const [namespaces, setNamespaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [raptorEnabled, setRaptorEnabled] = useState(undefined);

  async function load() {
    setLoading(true);
    try {
      const resp = await api.get("/admin/cache/namespaces");
      setNamespaces(resp.data);
      try {
        const cfg = await getCacheConfig();
        setRaptorEnabled(cfg.raptor_mini_enabled);
      } catch (e) {
        console.warn("Could not load cache config", e);
      }
    } catch (e) {
      setError(
        e.response?.status === 403
          ? t('common.unauthorized', 'غير مصرح')
          : t('admin.load_failed', 'فشل التحميل')
      );
      logError("Failed load namespaces", {
        e: e?.response?.data || e?.message || String(e),
      });
    } finally {
      setLoading(false);
    }
  }

  async function bump(ns) {
    try {
      await api.post(`/admin/cache/namespaces/${ns}/bump`);
      await load();
    } catch (e) {
      setError(e.response?.data?.detail || t('common.error', 'حدث خطأ'));
      logError("Failed bump namespace", {
        e: e?.response?.data || e?.message || String(e),
      });
    }
  }

  async function toggleRaptor(enabled) {
    try {
      const r = await setCacheConfig({ raptor_mini_enabled: enabled });
      setRaptorEnabled(r.raptor_mini_enabled);
    } catch (e) {
      setError(t('common.error', 'حدث خطأ'));
      logError("Failed toggle raptor", {
        e: e?.response?.data || e?.message || String(e),
      });
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <PageContainer>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>{t('admin.cache_namespaces', 'إدارة التخزين المؤقت (Cache)')}</h1>
          <p className={styles.pageSubtitle}>{t('admin.cache_desc', 'مراقبة ومسح النطاقات وتكوين التخزين المؤقت وتحسين الأداء')}</p>
        </div>
        <button onClick={load} className={styles.refreshBtn}>
           <RefreshCw size={16} /> {t('common.refresh', 'تحديث')}
        </button>
      </div>

      {loading ? (
        <div className={styles.messageBox}>{t('common.loading', 'جاري التحميل...')}</div>
      ) : error ? (
        <div className={`${styles.messageBox} ${styles.error}`}>{error}</div>
      ) : (
        <>
          <div className={styles.featureCard}>
            <div className={styles.featureInfo}>
              <h3 className={styles.featureTitle}>{t('admin.raptor_preview', 'محرك Raptor المصغر')}</h3>
              <p className={styles.featureDesc}>{t('admin.raptor_desc', 'تسريع تحميل واجهة المتجر بشكل كبير باستخدام تقنيات Edge Caching والتخزين المسبق للحمولات الدقيقة.')}</p>
            </div>
            
            <div className={styles.featureControls}>
              <div className={`${styles.statusBadge} ${raptorEnabled === undefined ? styles.loading : raptorEnabled ? styles.enabled : styles.disabled}`}>
                {raptorEnabled === undefined ? '...' : raptorEnabled ? t('common.enabled', 'مُفعّل') : t('common.disabled', 'معطل')}
              </div>
              
              <label className={styles.toggleLabel}>
                <span className={styles.toggleText}>{t('common.enable', 'تفعيل')}</span>
                <div className={styles.toggleSwitch}>
                  <input
                    type="checkbox"
                    checked={!!raptorEnabled}
                    onChange={(e) => toggleRaptor(e.target.checked)}
                  />
                  <span className={styles.slider}></span>
                </div>
              </label>
            </div>
          </div>

          <div className={styles.listCard}>
            <div className={styles.listHeader}>
              <h3 className={styles.listTitle}>{t('admin.cache_namespaces', 'نطاقات التخزين المؤقت (Namespaces)')}</h3>
            </div>
            <div className={styles.listContainer}>
              {namespaces.map((n) => (
                <div key={n.namespace} className={styles.listItem}>
                  <div className={styles.itemInfo}>
                    <div className={styles.itemName}>{n.namespace}</div>
                    <div className={styles.itemVersion}>{t('admin.version', 'الإصدار')}: {n.version}</div>
                  </div>
                  <button
                    onClick={() => bump(n.namespace)}
                    className={styles.bumpBtn}
                    title={t('admin.bump_version', 'ترقية الإصدار لمسح التخزين المؤقت')}
                  >
                    <ArrowUpCircle size={18} /> {t('admin.bump_version', 'مسح التخزين (Bump)')}
                  </button>
                </div>
              ))}
              {namespaces.length === 0 && (
                <div className={styles.messageBox} style={{padding: '4rem 2rem'}}>{t('common.no_data', 'لا توجد بيانات')}</div>
              )}
            </div>
          </div>
        </>
      )}
    </PageContainer>
  );
}
