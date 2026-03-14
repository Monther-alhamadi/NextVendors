import React, { useEffect, useState } from "react";
import { getVendorPlans, subscribeToPlan } from "../services/planService";
import { getMySupplierInfo } from "../services/supplierService";
import { useToast } from "../components/common/ToastProvider";
import { useTranslation } from "react-i18next";
import s from "./VendorPlans.module.css";
import { Check } from "lucide-react";

export default function VendorPlans() {
  const { t } = useTranslation();
  const toast = useToast();

  const [plans, setPlans] = useState([]);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [supplierInfo, setSupplierInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [upgradeModal, setUpgradeModal] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [planData, supplierData] = await Promise.all([
        getVendorPlans(),
        getMySupplierInfo()
      ]);
      
      setPlans(planData.filter(p => p.is_active));
      setSupplierInfo(supplierData);
      
      const current = planData.find(p => p.name === supplierData.plan_name);
      setCurrentPlan(current);
    } catch (e) {
      console.error(e);
      toast.push({ message: t("common.error", 'حدث خطأ'), type: "error" });
    } finally {
      setLoading(false);
    }
  }

  function handleUpgrade(plan) {
    setUpgradeModal(plan);
  }

  async function confirmUpgrade() {
    if (!upgradeModal) return;
    try {
        await subscribeToPlan(upgradeModal.id);
        toast.push({ 
          message: t('vendor.plan_upgrade_success', 'تم تعديل الباقة بنجاح!'), 
          type: "success" 
        });
        setUpgradeModal(null);
        loadData();
    } catch (e) {
        toast.push({ message: e.response?.data?.detail || t('common.error'), type: "error" });
    }
  }

  const getPlanIcon = (planName) => {
    const icons = { 'Basic': '📄', 'Starter': '🚀', 'Pro': '⭐', 'Enterprise': '👑', 'Premium': '💎' };
    return icons[planName] || '📋';
  };

  if (loading) {
    return (
      <div className={s.page} style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className={s.page}>
        <div className={s.header}>
             <h1 className={s.title}>{t('vendor.subscription_plans', 'باقات الاشتراك')}</h1>
             <p className={s.subtitle}>{t('vendor.choose_plan', 'اختر الباقة المناسبة لتنمية أعمالك وزيادة مبيعاتك')}</p>
        </div>

        {/* Current Plan Status */}
        {currentPlan && supplierInfo && (
            <div className={s.currentPlanCard}>
                <div className={s.currentLeft}>
                    <div className={s.currentIcon}>
                        {getPlanIcon(currentPlan.name)}
                    </div>
                    <div className={s.currentInfo}>
                        <h2>
                            {t('vendor.current_plan', 'باقتك الحالية')}
                            <span className={s.currentBadge}>{currentPlan.name}</span>
                        </h2>
                        <p className={s.currentDesc}>{currentPlan.description}</p>
                        <div className={s.currentStats}>
                            <div className={s.currentStat}>
                                <span>{t('vendor.monthly_price', 'الاشتراك الشهري')}:</span>
                                <span>{currentPlan.monthly_price} {t('common.currency', 'ر.س')}</span>
                            </div>
                            <div className={s.currentStat}>
                                <span>{t('vendor.commission', 'العمولة')}:</span>
                                <span>{(currentPlan.commission_rate * 100).toFixed(1)}%</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Usage Stats */}
                <div className={s.usageBox}>
                    <div className={s.usageTitle}>{t('vendor.product_usage', 'استهلاك المنتجات')}</div>
                    <div className={s.usagePercent}>
                        {supplierInfo.plan_limit > 0 
                            ? Math.round((supplierInfo.total_products || 0) / supplierInfo.plan_limit * 100)
                            : 0}
                        <span>{t('auto_e81f4d', t('auto_e81f4d', '% مستخدم'))}</span>
                    </div>
                    <div className={s.barTrack}>
                        <div 
                            className={s.barFill}
                            style={{ 
                                width: `${supplierInfo.plan_limit > 0 
                                    ? Math.min(100, (supplierInfo.total_products || 0) / supplierInfo.plan_limit * 100)
                                    : 0}%` 
                            }}
                        ></div>
                    </div>
                    <div className={s.usageDetail}>
                        {supplierInfo.total_products || 0} / {supplierInfo.plan_limit || '∞'} {t('vendor.products', 'منتج')}
                    </div>
                </div>
            </div>
        )}

        {/* Available Plans Grid */}
        <div className={s.plansGrid}>
            {plans.map(plan => {
                const isCurrentPlan = currentPlan?.id === plan.id;
                const isUpgrade = currentPlan && plan.monthly_price > currentPlan.monthly_price;
                const isDowngrade = currentPlan && plan.monthly_price < currentPlan.monthly_price;

                return (
                    <div key={plan.id} className={`${s.planCard} ${isCurrentPlan ? s.isCurrent : ''}`}>
                        <div className={s.planHeader}>
                            <div className={s.planIcon}>{getPlanIcon(plan.name)}</div>
                            <h3 className={s.planName}>{plan.name}</h3>
                            <p className={s.planDesc}>{plan.description}</p>
                            <div className={s.planPrice}>
                                <span className={s.priceAmount}>{plan.monthly_price}</span>
                                <span className={s.priceTerm}>{t('common.currency', 'ر.س')} / {t('vendor.month', 'شهر')}</span>
                            </div>
                        </div>

                        <div className={s.featuresList}>
                            <div className={s.featureItem}>
                                <Check className={s.featureIcon} size={18} />
                                <span><strong>{plan.max_products}</strong> {t('vendor.max_products', 'حد المنتجات الأقصى')}</span>
                            </div>
                            <div className={s.featureItem}>
                                <Check className={s.featureIcon} size={18} />
                                <span><strong>{(plan.commission_rate * 100).toFixed(1)}%</strong> {t('vendor.commission_rate', 'نسبة استقطاع المنصة')}</span>
                            </div>
                            {plan.auto_approve_products && (
                                <div className={s.featureItem}>
                                    <Check className={s.featureIcon} size={18} />
                                    <span>{t('vendor.auto_approve', 'نشر المنتجات تلقائياً بدون موافقة مسبقة')}</span>
                                </div>
                            )}
                            {plan.can_customize_store && (
                                <div className={s.featureItem}>
                                    <Check className={s.featureIcon} size={18} />
                                    <span>{t('vendor.customize_store', 'تخصيص كامل لواجهة المتجر المتقدمة')}</span>
                                </div>
                            )}
                            {plan.can_access_advanced_analytics && (
                                <div className={s.featureItem}>
                                    <Check className={s.featureIcon} size={18} />
                                    <span>{t('vendor.advanced_analytics', 'إحصائيات متقدمة جداً للمبيعات والأداء')}</span>
                                </div>
                            )}
                            {plan.can_use_priority_support && (
                                <div className={s.featureItem}>
                                    <Check className={s.featureIcon} size={18} />
                                    <span>{t('vendor.priority_support', 'دعم فني سريع وأولوية في معالجة التذاكر')}</span>
                                </div>
                            )}
                        </div>

                        <div className={s.actionBtnWrap}>
                            {isCurrentPlan ? (
                                <button className={`${s.actionBtn} ${s.actionBtnDisabled}`} disabled>
                                    {t('vendor.current_plan', 'باقتك الحالية')}
                                </button>
                            ) : (
                                <button 
                                    className={`${s.actionBtn} ${isUpgrade ? s.actionBtnPrimary : s.actionBtnSecondary}`}
                                    onClick={() => handleUpgrade(plan)}
                                >
                                    {isUpgrade ? t('vendor.upgrade', 'ترقية الباقة') : 
                                     isDowngrade ? t('vendor.downgrade', 'تخفيض الباقة') : 
                                     t('vendor.select_plan', 'اختر الباقة')}
                                </button>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>

        {/* Upgrade Confirmation Modal */}
        {upgradeModal && (
            <div className={s.modalOverlay}>
                <div className={s.modalContent}>
                    <div className={s.modalCenter}>
                        <div className={s.planIcon}>{getPlanIcon(upgradeModal.name)}</div>
                        <h2 className={s.modalTitle}>
                            {currentPlan && upgradeModal.monthly_price > currentPlan.monthly_price 
                                ? t('vendor.confirm_upgrade', 'تأكيد الترقية') 
                                : t('vendor.confirm_downgrade', 'تأكيد تغيير الباقة')}
                        </h2>
                        <p className={s.modalDesc}>
                            {t('vendor.switch_to', 'هل أنت متأكد من تغيير الترقية إلى الباقة')} <strong>{upgradeModal.name}</strong>؟
                        </p>
                    </div>

                    <div className={s.modalSummary}>
                        <div className={s.modalRow}>
                            <span>{t('vendor.monthly_price', 'الاشتراك الشهري')}:</span>
                            <span>{upgradeModal.monthly_price} {t('common.currency', 'ر.س')}</span>
                        </div>
                        <div className={s.modalRow}>
                            <span>{t('vendor.max_products', 'حد المنتجات')}:</span>
                            <span>{upgradeModal.max_products}</span>
                        </div>
                        <div className={s.modalRow}>
                            <span>{t('vendor.commission', 'نسبة العمولة')}:</span>
                            <span>{(upgradeModal.commission_rate * 100).toFixed(1)}%</span>
                        </div>
                    </div>

                    <div className={s.modalActions}>
                        <button className={`${s.actionBtn} ${s.actionBtnSecondary}`} onClick={() => setUpgradeModal(null)}>
                            {t('common.cancel', 'إلغاء')}
                        </button>
                        <button className={`${s.actionBtn} ${s.actionBtnPrimary}`} onClick={confirmUpgrade}>
                            {t('common.confirm', 'تأكيد')}
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
}
