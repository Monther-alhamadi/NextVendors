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
  { key: "auto_approve_products",         icon: "✅", label: "الموافقة التلقائية على المنتجات", desc: "المنتجات تُنشر مباشرة دون مراجعة" },
  { key: "can_customize_store",           icon: "🎨", label: "تخصيص المتجر",                  desc: "تعديل الألوان والتصميم والشعار" },
  { key: "can_access_advanced_analytics", icon: "📊", label: "تحليلات متقدمة",                desc: "إحصائيات مفصلة ورسوم بيانية" },
  { key: "can_use_priority_support",      icon: "⚡", label: "دعم فني أولوي",                 desc: "أولوية في الرد والدعم الفني" },
  { key: "allow_whatsapp_checkout",       icon: "💬", label: "الدفع عبر واتساب",              desc: "إتمام الطلب عبر محادثة واتساب" },
  { key: "is_active",                    icon: "🟢", label: "الخطة فعّالة",                   desc: "إظهار الخطة للتجار الجدد" },
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
        toast.push({ message: "تم تحديث الخطة بنجاح", type: "success" });
      } else {
        await createVendorPlan(formData);
        toast.push({ message: "تم إنشاء الخطة بنجاح", type: "success" });
      }
      setModalOpen(false);
      loadData();
    } catch (e) {
      toast.push({ message: e.response?.data?.detail || t("common.error", "حدث خطأ"), type: "error" });
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("هل أنت متأكد من حذف هذه الخطة؟")) return;
    try {
      await deleteVendorPlan(id);
      toast.push({ message: "تم حذف الخطة", type: "success" });
      loadData();
    } catch (e) {
      toast.push({ message: e.response?.data?.detail || "فشل حذف الخطة", type: "error" });
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
      toast.push({ message: "فشل تحديث الميزة", type: "error" });
    }
  }

  return (
    <PageContainer>
      <div className={s.container}>
        {/* Header */}
        <div className={s.header}>
          <div>
            <h1 className={s.title}>إدارة خطط التجار</h1>
            <p className={s.subtitle}>تحكم في الخطط والمميزات والأسعار والحدود لكل مستوى اشتراك</p>
          </div>
          <button className={s.createBtn} onClick={openCreate}>
            <Plus size={18} />
            إنشاء خطة جديدة
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
            <div className={s.emptyText}>لا توجد خطط حالياً</div>
            <div className={s.emptyHint}>أنشئ خطة اشتراك للبدء في إدارة مميزات التجار</div>
          </div>
        ) : (
          <div className={s.plansGrid}>
            {plans.map(plan => (
              <div key={plan.id} className={s.planCard}>
                {/* Card Header */}
                <div className={s.planCardHeader}>
                  <span className={s.planName}>{plan.name}</span>
                  <span className={`${s.planBadge} ${plan.is_active ? s.badgeActive : s.badgeInactive}`}>
                    {plan.is_active ? 'فعّالة' : 'معطّلة'}
                  </span>
                </div>

                {/* Pricing */}
                <div className={s.planPricing}>
                  <div className={s.priceItem}>
                    <span className={s.priceLabel}>شهرياً</span>
                    <span className={s.priceValue}>
                      {plan.monthly_price} <span className={s.priceUnit}>ر.س</span>
                    </span>
                  </div>
                  <div className={s.priceItem}>
                    <span className={s.priceLabel}>سنوياً</span>
                    <span className={s.priceValue}>
                      {plan.yearly_price || '—'} <span className={s.priceUnit}>ر.س</span>
                    </span>
                  </div>
                  <div className={s.priceItem}>
                    <span className={s.priceLabel}>العمولة</span>
                    <span className={s.priceValue}>
                      {(plan.commission_rate * 100).toFixed(1)}<span className={s.priceUnit}>%</span>
                    </span>
                  </div>
                </div>

                {/* Limits */}
                <div className={s.planLimits}>
                  <div className={s.limitItem}>
                    <span className={s.limitValue}>{plan.max_products}</span>
                    <span className={s.limitLabel}>أقصى منتجات</span>
                  </div>
                  <div className={s.limitItem}>
                    <span className={s.limitValue}>{plan.max_coupons || 0}</span>
                    <span className={s.limitLabel}>أقصى كوبونات</span>
                  </div>
                </div>

                {/* Features Toggles */}
                <div className={s.planFeatures}>
                  <div className={s.featuresTitle}>المميزات والخدمات</div>
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
                    <Edit2 size={14} /> تعديل الخطة
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
                  {editingPlan ? `تعديل خطة: ${editingPlan.name}` : 'إنشاء خطة جديدة'}
                </h2>
              </div>

              <div className={s.modalBody}>
                {/* Basic Info */}
                <div className={s.formGroup}>
                  <label className={s.formLabel}>اسم الخطة</label>
                  <input 
                    className={s.formInput}
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    placeholder="مثال: أساسية، احترافية، مؤسسية"
                    required
                  />
                </div>
                <div className={s.formGroup}>
                  <label className={s.formLabel}>الوصف</label>
                  <input 
                    className={s.formInput}
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    placeholder="وصف مختصر للخطة ومميزاتها"
                  />
                </div>

                {/* Pricing */}
                <div className={s.formRow}>
                  <div className={s.formGroup}>
                    <label className={s.formLabel}>السعر الشهري (ر.س)</label>
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
                    <label className={s.formLabel}>السعر السنوي (ر.س)</label>
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
                    <label className={s.formLabel}>نسبة العمولة (0.10 = 10%)</label>
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
                    <label className={s.formLabel}>الحد الأقصى للمنتجات</label>
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
                    <label className={s.formLabel}>الحد الأقصى للكوبونات</label>
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
                  <div className={s.formSectionTitle}>المميزات والخدمات</div>
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
                <button className={s.cancelBtn} onClick={() => setModalOpen(false)}>إلغاء</button>
                <button className={s.saveBtn} onClick={handleSubmit}>
                  {editingPlan ? 'تحديث الخطة' : 'إنشاء الخطة'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
