import React, { useEffect, useState } from "react";
import { 
    getVendorPlans, 
    createVendorPlan, 
    updateVendorPlan, 
    deleteVendorPlan 
} from "../services/planService";
import { useToast } from "../components/common/ToastProvider";
import { useTranslation } from "react-i18next";
import PageContainer from "../components/PageContainer";
import Skeleton from "../components/common/Skeleton";
import { Plus, Edit2, Trash2, Package } from "lucide-react";
import s from "./AdminPlans.module.css";


// ── All toggleable vendor capabilities ──────────────────────
const PLAN_FEATURES = [
  { key: "auto_approve_products",         icon: "✅", label: t('auto_d3bb0c', t('auto_d3bb0c', 'الموافقة التلقائية على المنتجات')), desc: t('auto_259ec0', t('auto_259ec0', 'المنتجات تُنشر مباشرة دون مراجعة')) },
  { key: "can_customize_store",           icon: "🎨", label: t('auto_625bcb', t('auto_625bcb', 'تخصيص المتجر')),                  desc: t('auto_4767b5', t('auto_4767b5', 'تعديل الألوان والتصميم والشعار')) },
  { key: "can_access_advanced_analytics", icon: "📊", label: t('auto_7f0dea', t('auto_7f0dea', 'تحليلات متقدمة')),                desc: t('auto_164c51', t('auto_164c51', 'إحصائيات مفصلة ورسوم بيانية')) },
  { key: "can_use_priority_support",      icon: "⚡", label: t('auto_06c1bb', t('auto_06c1bb', 'دعم فني أولوي')),                 desc: t('auto_68ab77', t('auto_68ab77', 'أولوية في الرد والدعم الفني')) },
  { key: "allow_whatsapp_checkout",       icon: "💬", label: t('auto_1ca245', t('auto_1ca245', 'الدفع عبر واتساب')),              desc: t('auto_895f00', t('auto_895f00', 'إتمام الطلب عبر محادثة واتساب')) },
  { key: "is_active",                    icon: "🟢", label: t('auto_c5eda0', t('auto_c5eda0', 'الخطة فعّالة')),                   desc: t('auto_b634e4', t('auto_b634e4', 'إظهار الخطة للتجار الجدد')) },
];

const INITIAL_FORM = {
  name: "",
  description: "",
  monthly_price: 0,
  yearly_price: 0,
  commission_rate: 0.10,
  max_products: 50,
  max_coupons: 0,
  auto_approve_products: false,
  can_customize_store: false,
  can_access_advanced_analytics: false,
  can_use_priority_support: false,
  allow_whatsapp_checkout: false,
  is_active: true,
};

export default function AdminPlans() {
  const { t } = useTranslation();
  const PLAN_FEATURES = getPlanFeatures(t);
  const toast = useToast();

  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [formData, setFormData] = useState({ ...INITIAL_FORM });

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      setLoading(true);
      const data = await getVendorPlans();
      setPlans(data);
    } catch (e) {
      console.error(e);
      toast.push({ message: t("common.error", "حدث خطأ"), type: "error" });
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditingPlan(null);
    setFormData({ ...INITIAL_FORM });
    setModalOpen(true);
  }

  function openEdit(plan) {
    setEditingPlan(plan);
    setFormData({
      name: plan.name || "",
      description: plan.description || "",
      monthly_price: plan.monthly_price || 0,
      yearly_price: plan.yearly_price || 0,
      commission_rate: plan.commission_rate || 0.10,
      max_products: plan.max_products || 50,
      max_coupons: plan.max_coupons || 0,
      auto_approve_products: !!plan.auto_approve_products,
      can_customize_store: !!plan.can_customize_store,
      can_access_advanced_analytics: !!plan.can_access_advanced_analytics,
      can_use_priority_support: !!plan.can_use_priority_support,
      allow_whatsapp_checkout: !!plan.allow_whatsapp_checkout,
      is_active: plan.is_active !== false,
    });
    setModalOpen(true);
  }

  async function handleSubmit() {
    try {
      if (editingPlan) {
        await updateVendorPlan(editingPlan.id, formData);
        toast.push({ message: t("admin.plans.update_success", "تم تحديث الخطة بنجاح"), type: "success" });
      } else {
        await createVendorPlan(formData);
        toast.push({ message: t("admin.plans.create_success", "تم إنشاء الخطة بنجاح"), type: "success" });
      }
      setModalOpen(false);
      loadData();
    } catch (e) {
      toast.push({ message: e.response?.data?.detail || t("common.error", "حدث خطأ"), type: "error" });
    }
  }

  async function handleDelete(id) {
    if (!window.confirm(t("admin.plans.delete_confirm", "هل أنت متأكد من حذف هذه الخطة؟"))) return;
    try {
      await deleteVendorPlan(id);
      toast.push({ message: t("admin.plans.delete_success", "تم حذف الخطة"), type: "success" });
      loadData();
    } catch (e) {
      toast.push({ message: e.response?.data?.detail || t("admin.plans.delete_failed", "فشل حذف الخطة"), type: "error" });
    }
  }

  // Quick-toggle a feature directly from the card
  async function handleQuickToggle(plan, featureKey) {
    const newValue = !plan[featureKey];
    try {
      await updateVendorPlan(plan.id, { [featureKey]: newValue });
      setPlans(prev => prev.map(p =>
        p.id === plan.id ? { ...p, [featureKey]: newValue } : p
      ));
    } catch (e) {
      toast.push({ message: t("admin.plans.toggle_failed", "فشل تحديث الميزة"), type: "error" });
    }
  }

  return (
    <PageContainer>
      <div className={s.container}>
        {/* Header */}
        <div className={s.header}>
          <div>
            <h1 className={s.title}>{t("admin.plans.title", "إدارة خطط التجار")}</h1>
            <p className={s.subtitle}>{t("admin.plans.subtitle", "تحكم في الخطط والمميزات والأسعار والحدود لكل مستوى اشتراك")}</p>
          </div>
          <button className={s.createBtn} onClick={openCreate}>
            <Plus size={18} />
            {t("admin.plans.create_new", "إنشاء خطة جديدة")}
          </button>
        </div>

        {/* Plans Grid */}
        {loading ? (
          <div className={s.plansGrid}>
            {[1,2,3].map(i => <Skeleton key={i} height="420px" style={{ borderRadius: '16px' }} />)}
          </div>
        ) : plans.length === 0 ? (
          <div className={s.emptyState}>
            <div className={s.emptyIcon}>📋</div>
            <div className={s.emptyText}>{t("admin.plans.empty", "لا توجد خطط حالياً")}</div>
            <div className={s.emptyHint}>{t("admin.plans.empty_hint", "أنشئ خطة اشتراك للبدء في إدارة مميزات التجار")}</div>
          </div>
        ) : (
          <div className={s.plansGrid}>
            {plans.map(plan => (
              <div key={plan.id} className={s.planCard}>
                {/* Card Header */}
                <div className={s.planCardHeader}>
                  <span className={s.planName}>{plan.name}</span>
                  <span className={`${s.planBadge} ${plan.is_active ? s.badgeActive : s.badgeInactive}`}>
                    {plan.is_active ? t("common.active_f", "فعّالة") : t("common.inactive_f", "معطّلة")}
                  </span>
                </div>

                {/* Pricing */}
                <div className={s.planPricing}>
                  <div className={s.priceItem}>
                    <span className={s.priceLabel}>{t("admin.plans.monthly", "شهرياً")}</span>
                    <span className={s.priceValue}>
                      {plan.monthly_price} <span className={s.priceUnit}>{t("common.currency", "ر.س")}</span>
                    </span>
                  </div>
                  <div className={s.priceItem}>
                    <span className={s.priceLabel}>{t("admin.plans.yearly", "سنوياً")}</span>
                    <span className={s.priceValue}>
                      {plan.yearly_price || '—'} <span className={s.priceUnit}>{t("common.currency", "ر.س")}</span>
                    </span>
                  </div>
                  <div className={s.priceItem}>
                    <span className={s.priceLabel}>{t("admin.plans.commission", "العمولة")}</span>
                    <span className={s.priceValue}>
                      {(plan.commission_rate * 100).toFixed(1)}<span className={s.priceUnit}>%</span>
                    </span>
                  </div>
                </div>

                {/* Limits */}
                <div className={s.planLimits}>
                  <div className={s.limitItem}>
                    <span className={s.limitValue}>{plan.max_products}</span>
                    <span className={s.limitLabel}>{t("admin.plans.max_products", "أقصى منتجات")}</span>
                  </div>
                  <div className={s.limitItem}>
                    <span className={s.limitValue}>{plan.max_coupons || 0}</span>
                    <span className={s.limitLabel}>{t("admin.plans.max_coupons", "أقصى كوبونات")}</span>
                  </div>
                </div>

                {/* Features Toggles */}
                <div className={s.planFeatures}>
                  <div className={s.featuresTitle}>{t("admin.plans.features", "المميزات والخدمات")}</div>
                  <div className={s.featuresList}>
                    {PLAN_FEATURES.map(feat => (
                      <div key={feat.key} className={s.featureRow}>
                        <div className={s.featureInfo}>
                          <span className={s.featureIcon}>{feat.icon}</span>
                          <span className={s.featureLabel}>{feat.label}</span>
                        </div>
                        <button
                          className={`${s.toggleSwitch} ${plan[feat.key] ? s.toggleActive : ''}`}
                          onClick={() => handleQuickToggle(plan, feat.key)}
                          title={feat.desc}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className={s.planActions}>
                  <button className={s.editBtn} onClick={() => openEdit(plan)}>
                    <Edit2 size={14} /> {t("admin.plans.edit_plan", "تعديل الخطة")}
                  </button>
                  <button className={s.deleteBtn} onClick={() => handleDelete(plan.id)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create / Edit Modal */}
        {modalOpen && (
          <div className={s.overlay} onClick={(e) => e.target === e.currentTarget && setModalOpen(false)}>
            <div className={s.modal}>
              <div className={s.modalHeader}>
                <h2 className={s.modalTitle}>
                  {editingPlan ? `تعديل خطة: ${editingPlan.name}` : '{t("admin.plans.create_new", "إنشاء خطة جديدة")}'}
                </h2>
              </div>

              <div className={s.modalBody}>
                {/* Basic Info */}
                <div className={s.formGroup}>
                  <label className={s.formLabel}>{t("admin.plans.plan_name", "اسم الخطة")}</label>
                  <input 
                    className={s.formInput}
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    placeholder={t("admin.plans.name_ph", "مثال: أساسية، احترافية، مؤسسية")}
                    required
                  />
                </div>
                <div className={s.formGroup}>
                  <label className={s.formLabel}>{t("admin.plans.desc", "الوصف")}</label>
                  <input 
                    className={s.formInput}
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    placeholder={t("admin.plans.desc_ph", "وصف مختصر للخطة ومميزاتها")}
                  />
                </div>

                {/* Pricing */}
                <div className={s.formRow}>
                  <div className={s.formGroup}>
                    <label className={s.formLabel}>{t("admin.plans.monthly_price_lbl", "السعر الشهري (ر.س)")}</label>
                    <input 
                      className={s.formInput}
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.monthly_price}
                      onChange={e => setFormData({...formData, monthly_price: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                  <div className={s.formGroup}>
                    <label className={s.formLabel}>{t("admin.plans.yearly_price_lbl", "السعر السنوي (ر.س)")}</label>
                    <input 
                      className={s.formInput}
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.yearly_price}
                      onChange={e => setFormData({...formData, yearly_price: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                </div>

                {/* Limits */}
                <div className={s.formRow}>
                  <div className={s.formGroup}>
                    <label className={s.formLabel}>{t("admin.plans.commission_lbl", "نسبة العمولة (0.10 = 10%)")}</label>
                    <input 
                      className={s.formInput}
                      type="number"
                      min="0"
                      max="1"
                      step="0.01"
                      value={formData.commission_rate}
                      onChange={e => setFormData({...formData, commission_rate: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                  <div className={s.formGroup}>
                    <label className={s.formLabel}>{t("admin.plans.max_products", "الحد الأقصى للمنتجات")}</label>
                    <input 
                      className={s.formInput}
                      type="number"
                      min="1"
                      value={formData.max_products}
                      onChange={e => setFormData({...formData, max_products: parseInt(e.target.value) || 1})}
                    />
                  </div>
                </div>

                <div className={s.formRow}>
                  <div className={s.formGroup}>
                    <label className={s.formLabel}>{t("admin.plans.max_coupons", "الحد الأقصى للكوبونات")}</label>
                    <input 
                      className={s.formInput}
                      type="number"
                      min="0"
                      value={formData.max_coupons}
                      onChange={e => setFormData({...formData, max_coupons: parseInt(e.target.value) || 0})}
                    />
                  </div>
                </div>

                {/* Feature Toggles */}
                <div className={s.formSection}>
                  <div className={s.formSectionTitle}>{t("admin.plans.features", "المميزات والخدمات")}</div>
                  <div className={s.featuresList}>
                    {PLAN_FEATURES.map(feat => (
                      <div key={feat.key} className={s.featureRow}>
                        <div className={s.featureInfo}>
                          <span className={s.featureIcon}>{feat.icon}</span>
                          <div>
                            <span className={s.featureLabel}>{feat.label}</span>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{feat.desc}</div>
                          </div>
                        </div>
                        <button
                          type="button"
                          className={`${s.toggleSwitch} ${formData[feat.key] ? s.toggleActive : ''}`}
                          onClick={() => setFormData({...formData, [feat.key]: !formData[feat.key]})}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className={s.modalFooter}>
                <button className={s.cancelBtn} onClick={() => setModalOpen(false)}>{t("common.cancel", "إلغاء")}</button>
                <button className={s.saveBtn} onClick={handleSubmit}>
                  {editingPlan ? t('admin.plans.update_plan', 'تحديث الخطة') : t('admin.plans.create_plan', 'إنشاء الخطة')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
