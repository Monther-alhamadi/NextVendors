import React, { useEffect, useState } from "react";
import { getTaxRates, createTaxRate, updateTaxRate, deleteTaxRate } from "../services/taxService";
import { useToast } from "../components/common/ToastProvider";
import { useConfirm } from "../components/common/ConfirmProvider";
import { useTranslation } from "react-i18next";
import PageContainer from "../components/PageContainer";
import { Plus, Edit2, Trash2 } from "lucide-react";
import styles from "./AdminTaxes.module.css";

export default function AdminTaxes() {
  const { t } = useTranslation();
  const toast = useToast();
  const confirm = useConfirm();

  const [rates, setRates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRate, setEditingRate] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    rate: 15.0,
    country: "SA",
    region: "",
    active: true
  });

  useEffect(() => {
    loadRates();
  }, []);

  async function loadRates() {
    setLoading(true);
    try {
      const data = await getTaxRates();
      setRates(data);
    } catch (e) {
      toast.push({ message: t("common.error", 'حدث خطأ في تحميل البيانات'), type: "error" });
    } finally {
      setLoading(false);
    }
  }

  function handleOpenModal(rate = null) {
    if (rate) {
      setEditingRate(rate);
      setFormData({ ...rate });
    } else {
      setEditingRate(null);
      setFormData({
        name: "VAT",
        rate: 15.0,
        country: "SA",
        region: "",
        active: true
      });
    }
    setShowModal(true);
  }

  async function handleSubmit() {
    try {
      if (editingRate) {
        await updateTaxRate(editingRate.id, formData);
        toast.push({ message: t("common.save_success", 'تم التعديل بنجاح'), type: "success" });
      } else {
        await createTaxRate(formData);
        toast.push({ message: t("common.save_success", 'تم الإضافة بنجاح'), type: "success" });
      }
      setShowModal(false);
      loadRates();
    } catch (e) {
      toast.push({ message: t("common.error", 'حدث خطأ في الحفظ'), type: "error" });
    }
  }

  async function handleDelete(id) {
    const ok = await confirm(t("common.confirm_delete", 'هل أنت متأكد من الحذف؟'));
    if (!ok) return;
    try {
      await deleteTaxRate(id);
      toast.push({ message: t("common.delete_success", 'تم الحذف بنجاح'), type: "success" });
      loadRates();
    } catch (e) {
      toast.push({ message: t("common.error", 'حدث خطأ'), type: "error" });
    }
  }

  return (
    <PageContainer>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>{t('admin.tax_management', 'إدارة الضرائب والمناطق الضريبية')}</h1>
          <p className={styles.pageSubtitle}>{t('admin.tax_subtitle', 'تكوين نسب الضرائب المضافة للمنتجات حسب الدول والمناطق')}</p>
        </div>
        <button onClick={() => handleOpenModal()} className={styles.addBtn}>
          <Plus size={18} />
          {t('admin.add_tax_rate', 'إضافة ضريبة')}
        </button>
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableWrapper}>
          <table className={styles.dataGrid}>
            <thead>
              <tr>
                <th>{t('common.name', 'الاسم')}</th>
                <th>{t('admin.rate', 'النسبة')}</th>
                <th>{t('admin.country', 'الدولة')}</th>
                <th>{t('admin.region', 'المنطقة')}</th>
                <th className={styles.right}>{t('common.actions', 'الإجراءات')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" style={{padding:'4rem', textAlign:'center', color:'var(--text-muted)'}}>{t('common.loading')}...</td></tr>
              ) : rates.length === 0 ? (
                <tr><td colSpan="5" style={{padding:'4rem', textAlign:'center', color:'var(--text-muted)'}}>{t('common.no_data', 'لا توجد بيانات ضريبية')}</td></tr>
              ) : rates.map(rate => (
                <tr key={rate.id}>
                  <td>
                    <div className={styles.rateName}>{rate.name}</div>
                    {!rate.active && <span className={styles.statusInactive}>{t('common.inactive', 'غير نشط')}</span>}
                  </td>
                  <td className={styles.rateValue}>{rate.rate}%</td>
                  <td>
                      <span className={styles.countryCode}>{rate.country || t('common.global', 'عالمي')}</span>
                  </td>
                  <td className={styles.regionCol}>{rate.region || "-"}</td>
                  <td className={styles.right}>
                     <div className={styles.actionsCol}>
                        <button onClick={()=>handleOpenModal(rate)} className={`${styles.actionBtn} ${styles.edit}`} title={t('common.edit', 'تعديل')}>
                            <Edit2 size={16} />
                        </button>
                        <button onClick={()=>handleDelete(rate.id)} className={`${styles.actionBtn} ${styles.delete}`} title={t('common.delete', 'حذف')}>
                            <Trash2 size={16} />
                        </button>
                     </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h2 className={styles.modalTitle}>
              {editingRate ? t('admin.edit_tax_rate', 'تعديل الضريبة') : t('admin.add_tax_rate', 'إضافة ضريبة جديدة')}
            </h2>
            
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.label}>{t('common.name', 'الاسم (مثال: VAT)')}</label>
                <input 
                  className={styles.input}
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>{t('admin.rate', 'النسبة المئوية (%)')}</label>
                  <input 
                    type="number"
                    step="0.01"
                    className={styles.input}
                    value={formData.rate}
                    onChange={e => setFormData({...formData, rate: parseFloat(e.target.value)})}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>{t('admin.country_code', 'رمز الدولة (SA)')}</label>
                  <input 
                    className={styles.input}
                    style={{ textTransform: 'uppercase' }}
                    maxLength={2}
                    value={formData.country}
                    onChange={e => setFormData({...formData, country: e.target.value.toUpperCase()})}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>{t('admin.region', 'المنطقة')} ({t('common.optional', 'اختياري')})</label>
                <input 
                  className={styles.input}
                  value={formData.region}
                  onChange={e => setFormData({...formData, region: e.target.value})}
                />
              </div>

              <label className={styles.activeToggle} htmlFor="tax_active">
                <input 
                  type="checkbox"
                  id="tax_active"
                  className={styles.checkbox}
                  checked={formData.active}
                  onChange={e => setFormData({...formData, active: e.target.checked})}
                />
                <span className={styles.rateName} style={{margin:0}}>{t('admin.active_rate', 'تفعيل هذه الضريبة عند الحساب')}</span>
              </label>
            </div>

            <div className={styles.modalActions}>
              <button className={`${styles.modalBtn} ${styles.cancel}`} onClick={()=>setShowModal(false)}>
                {t('common.cancel', 'إلغاء')}
              </button>
              <button className={`${styles.modalBtn} ${styles.confirm}`} onClick={handleSubmit}>
                {t('common.save', 'حفظ التغييرات')}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
