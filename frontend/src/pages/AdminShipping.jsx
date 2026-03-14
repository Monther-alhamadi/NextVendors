import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import PageContainer from "../components/PageContainer";
import { useToast } from "../components/common/ToastProvider";
import { useConfirm } from "../components/common/ConfirmProvider";
import { Plus, X, Trash2, Settings, Truck, MapPin } from "lucide-react";
import styles from "./AdminShipping.module.css";
import { 
  getShippingProviders, 
  createShippingProvider, 
  getShippingZones, 
  createShippingZone, 
  deleteShippingZone 
} from "../services/adminShippingService";

export default function AdminShipping() {
  const { t } = useTranslation();
  const [providers, setProviders] = useState([]);
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("providers");
  const [showForm, setShowForm] = useState(false);
  const toast = useToast();
  const confirm = useConfirm();

  const [providerForm, setProviderForm] = useState({
    name: "", code: "", description: "", environment: "sandbox", api_config: {}
  });

  const [zoneForm, setZoneForm] = useState({
    name: "", provider_id: "", countries: "", base_cost: 0, cost_per_kg: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [pData, zData] = await Promise.all([
        getShippingProviders(),
        getShippingZones()
      ]);
      setProviders(pData);
      setZones(zData);
    } catch (e) {
      toast.push({ message: t('common.error', 'Failed to load data'), type: "error" });
    } finally {
      setLoading(false);
    }
  }

  async function handleProviderSubmit(e) {
    e.preventDefault();
    try {
      await createShippingProvider(providerForm);
      toast.push({ message: t('common.save_success', 'Provider created successfully'), type: "success" });
      setShowForm(false);
      setProviderForm({ name: "", code: "", description: "", environment: "sandbox", api_config: {} });
      loadData();
    } catch (e) {
      toast.push({ message: t('common.error', 'Failed to create provider'), type: "error" });
    }
  }

  async function handleZoneSubmit(e) {
    e.preventDefault();
    try {
      const payload = {
          ...zoneForm,
          countries: zoneForm.countries.split(',').map(c => c.trim().toUpperCase()).filter(c => c)
      };
      await createShippingZone(payload);
      toast.push({ message: t('common.save_success', 'Zone created successfully'), type: "success" });
      setShowForm(false);
      setZoneForm({ name: "", provider_id: "", countries: "", base_cost: 0, cost_per_kg: 0 });
      loadData();
    } catch (e) {
      toast.push({ message: t('common.error', 'Failed to create zone'), type: "error" });
    }
  }

  async function doDeleteZone(id) {
      const ok = await confirm(t('admin.confirm_delete_zone', 'Are you sure you want to delete this shipping zone?'));
      if(!ok) return;
      try {
          await deleteShippingZone(id);
          toast.push({ message: t('common.delete_success', "Zone deleted"), type: "success" });
          loadData();
      } catch (e) {
          toast.push({ message: t('common.error', 'Delete failed'), type: "error" });
      }
  }

  return (
    <PageContainer>
      <div className={styles.pageHeader}>
         <div>
            <h1 className={styles.pageTitle}>{t('admin.logistics_title', 'الشحن والخدمات اللوجستية')}</h1>
            <p className={styles.pageSubtitle}>{t('admin.logistics_subtitle', 'إدارة شركات الشحن والمناطق وتكاليف التوصيل')}</p>
         </div>
         <button 
            className={`${styles.addBtn} ${showForm ? styles.cancel : ''}`} 
            onClick={() => setShowForm(!showForm)}
         >
           {showForm ? <><X size={18} /> {t('common.cancel', 'إلغاء')}</> : <><Plus size={18} /> {t(`admin.add_${activeTab === 'providers' ? 'provider' : 'zone'}`, 'إضافة جديد')}</>}
         </button>
      </div>

      <div className={styles.tabsContainer}>
          <button 
            className={`${styles.tabBtn} ${activeTab === 'providers' ? styles.active : ''}`}
            onClick={() => setActiveTab('providers')}
          >
            <Truck size={16} style={{display:'inline', marginRight:'6px'}}/>
            {t('admin.carriers', 'شركات الشحن')}
          </button>
          <button 
            className={`${styles.tabBtn} ${activeTab === 'zones' ? styles.active : ''}`}
            onClick={() => setActiveTab('zones')}
          >
            <MapPin size={16} style={{display:'inline', marginRight:'6px'}}/>
            {t('admin.shipping_zones', 'مناطق الشحن')}
          </button>
      </div>

      {showForm && activeTab === 'providers' && (
          <div className={styles.formCard}>
              <h3 className={styles.formTitle}>{t('admin.new_provider', 'إضافة شركة شحن جديدة')}</h3>
              <form onSubmit={handleProviderSubmit} className={styles.formGrid}>
                  <div className={styles.formGroup}>
                      <label className={styles.label}>{t('admin.carrier_name', 'اسم الشركة')}</label>
                      <input className={styles.input} placeholder="e.g. Aramex" required value={providerForm.name} onChange={e => setProviderForm({...providerForm, name: e.target.value})} />
                  </div>
                  <div className={styles.formGroup}>
                      <label className={styles.label}>{t('admin.carrier_code', 'الرمز (Code)')}</label>
                      <input className={styles.input} placeholder="ARAMEX" required value={providerForm.code} onChange={e => setProviderForm({...providerForm, code: e.target.value})} />
                  </div>
                  <div className={`${styles.formGroup} ${styles.fullW}`}>
                      <label className={styles.label}>{t('common.description', 'الوصف')}</label>
                      <input className={styles.input} value={providerForm.description} onChange={e => setProviderForm({...providerForm, description: e.target.value})} />
                  </div>
                  <div className={`${styles.formGroup} ${styles.fullW}`}>
                      <label className={styles.label}>{t('admin.environment', 'بيئة العمل')}</label>
                      <select className={styles.input} value={providerForm.environment} onChange={e => setProviderForm({...providerForm, environment: e.target.value})}>
                          <option value="sandbox">{t('admin.sandbox', 'تجريبي (Sandbox)')}</option>
                          <option value="production">{t('admin.production', 'إنتاج (Production)')}</option>
                      </select>
                  </div>
                  <div className={styles.fullW}>
                     <button type="submit" className={styles.submitBtn}>{t('common.save', 'حفظ وإضافة')}</button>
                  </div>
              </form>
          </div>
      )}

      {showForm && activeTab === 'zones' && (
          <div className={styles.formCard}>
              <h3 className={styles.formTitle}>{t('admin.new_zone', 'إضافة منطقة شحن جديدة')}</h3>
              <form onSubmit={handleZoneSubmit} className={styles.formGrid}>
                  <div className={styles.formGroup}>
                      <label className={styles.label}>{t('admin.zone_name', 'اسم المنطقة')}</label>
                      <input className={styles.input} placeholder="GCC Region" required value={zoneForm.name} onChange={e => setZoneForm({...zoneForm, name: e.target.value})} />
                  </div>
                  <div className={styles.formGroup}>
                      <label className={styles.label}>{t('admin.vendor', 'شركة الشحن المرتبطة')}</label>
                      <select required className={styles.input} value={zoneForm.provider_id} onChange={e => setZoneForm({...zoneForm, provider_id: parseInt(e.target.value)})}>
                          <option value="">{t('admin.select_connector', 'اختر الشركة')}</option>
                          {providers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                  </div>
                  <div className={`${styles.formGroup} ${styles.fullW}`}>
                      <label className={styles.label}>{t('common.countries', 'الدول المشمولة')}</label>
                      <input className={styles.input} placeholder={t('auto_bf04bd', t('auto_bf04bd', 'مثال: SA, AE, KW... (افصل بينها بفاصلة)'))} required value={zoneForm.countries} onChange={e => setZoneForm({...zoneForm, countries: e.target.value})} />
                  </div>
                  <div className={styles.formGroup}>
                      <label className={styles.label}>{t('admin.base_cost', 'التكلفة الأساسية')}</label>
                      <input type="number" step="0.01" className={styles.input} required value={zoneForm.base_cost} onChange={e => setZoneForm({...zoneForm, base_cost: parseFloat(e.target.value)})} />
                  </div>
                  <div className={styles.formGroup}>
                      <label className={styles.label}>{t('admin.cost_per_kg', 'تكلفة الكيلو الإضافي')}</label>
                      <input type="number" step="0.01" className={styles.input} required value={zoneForm.cost_per_kg} onChange={e => setZoneForm({...zoneForm, cost_per_kg: parseFloat(e.target.value)})} />
                  </div>
                  <div className={styles.fullW}>
                      <button type="submit" className={styles.submitBtn}>{t('common.save', 'حفظ وإضافة')}</button>
                  </div>
              </form>
          </div>
      )}

      {activeTab === 'providers' ? (
          <div className={styles.providersGrid}>
              {providers.map(p => (
                  <div key={p.id} className={styles.providerCard}>
                      <div className={styles.providerHeader}>
                          <div className={`${styles.envBadge} ${p.environment === 'production' ? styles.envProd : styles.envSand}`}>
                              {p.environment}
                          </div>
                          <div className={`${styles.statusDot} ${p.is_active ? styles.statusActive : styles.statusInactive}`}></div>
                      </div>
                      <h3 className={styles.providerName}>{p.name}</h3>
                      <p className={styles.providerCode}>{p.code}</p>
                      <p className={styles.providerDesc}>{p.description || "No description provided."}</p>
                      <button className={styles.configBtn}>
                          <Settings size={14} style={{display:'inline', marginRight:'6px'}}/>
                          {t('admin.configure_api', 'إعداد الـ API')}
                      </button>
                  </div>
              ))}
              {providers.length === 0 && !loading && (
                   <div className={styles.emptyState}>
                       <div className={styles.emptyIcon}>🚚</div>
                       <p className={styles.emptyText}>{t('admin.no_providers', 'لا توجد شركات شحن مضافة حتى الآن.')}</p>
                   </div>
              )}
          </div>
      ) : (
          <div className={styles.tableCard}>
               <div className={styles.tableWrapper}>
                   <table className={styles.dataGrid}>
                       <thead>
                           <tr>
                               <th>{t('admin.zone_name', 'المنطقة')}</th>
                               <th>{t('admin.carriers', 'الشركة المرتبطة')}</th>
                               <th>{t('common.countries', 'التغطية')}</th>
                               <th>{t('admin.base_cost', 'أساسي')}</th>
                               <th>{t('admin.cost_per_kg', 'للكيلو')}</th>
                               <th className={styles.right}>{t('common.actions', 'إجراء')}</th>
                           </tr>
                       </thead>
                       <tbody>
                           {zones.map((z) => (
                               <tr key={z.id}>
                                   <td className={styles.zoneName}>{z.name}</td>
                                   <td className={styles.carrierName}>{providers.find(p => p.id === z.provider_id)?.name || "Unknown"}</td>
                                   <td>
                                       <div className={styles.countryTags}>
                                           {z.countries.map(c => <span key={c} className={styles.countryTag}>{c}</span>)}
                                       </div>
                                   </td>
                                   <td className={styles.costCol}>{t('common.currency', 'SAR')} {z.base_cost.toFixed(2)}</td>
                                   <td className={`${styles.costCol} ${styles.secondary}`}>{t('common.currency', 'SAR')} {z.cost_per_kg.toFixed(2)}</td>
                                   <td className={styles.right}>
                                       <button onClick={() => doDeleteZone(z.id)} className={styles.deleteBtn} title={t('common.delete', 'حذف')}>
                                           <Trash2 size={16} />
                                       </button>
                                   </td>
                               </tr>
                           ))}
                           {zones.length === 0 && !loading && (
                               <tr><td colSpan="6" style={{padding:'4rem', textAlign:'center', color:'var(--text-muted)'}}>{t('admin.no_zones', 'لا توجد مناطق شحن مضافة.')}</td></tr>
                           )}
                       </tbody>
                   </table>
               </div>
          </div>
      )}
    </PageContainer>
  );
}
