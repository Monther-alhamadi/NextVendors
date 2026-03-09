import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Users, TrendingUp, DollarSign, Copy, Lock, PlusCircle } from "lucide-react";
import api from "../services/api";
import CustomButton from "../components/common/CustomButton";
import { useToast } from "../components/common/ToastProvider";
import governanceService from "../services/governanceService";
import s from "./VendorAffiliate.module.css";
import { useNavigate } from "react-router-dom";

export default function VendorAffiliate() {
  const { t } = useTranslation();
  const toast = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [affiliateData, setAffiliateData] = useState(null);
  const [campaigns, setCampaigns] = useState([]);

  useEffect(() => {
    checkAccess();
  }, []);

  async function checkAccess() {
    try {
      const access = await governanceService.checkFeatureAccess('affiliate_coupons');
      setHasAccess(access.access);
      
      if (access.access) {
        await loadAffiliateData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function loadAffiliateData() {
    try {
      const res = await api.get('/affiliate/vendor/stats');
      setAffiliateData(res.data);
      
      const campaignsRes = await api.get('/affiliate/vendor/campaigns');
      setCampaigns(campaignsRes.data || []);
    } catch (e) {
      console.error(e);
    }
  }

  const copyReferralCode = (code) => {
    const link = `${window.location.origin}?ref=${code}`;
    navigator.clipboard.writeText(link);
    toast.push({ message: t('common.copied_to_clipboard', 'تم النسخ بنجاح!'), type: 'success' });
  };

  if (loading) {
    return (
      <div className={s.page} style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className={s.page}>
        <div className={s.upgradeCard}>
          <div className={s.lockIconWrap}>
            <Lock size={32} style={{ color: "var(--text-secondary)" }} />
          </div>
          <h2 className={s.upgradeTitle}>{t('vendor.affiliate_locked', 'برنامج التسويق بالعمولة - يتطلب ترقية')}</h2>
          <p className={s.upgradeDesc}>{t('vendor.affiliate_locked_desc', 'افتح نظام التسويق بالعمولة الاحترافي وصمم حملات تسويقية لزيادة مبيعاتك.')}</p>
          <CustomButton variant="primary" onClick={() => navigate('/vendor/plans')}>
            {t('vendor.upgrade_now', 'ترقية إلى الباقة الاحترافية')}
          </CustomButton>
        </div>
      </div>
    );
  }

  return (
    <div className={s.page}>
      <div className={s.header}>
        <h1 className={s.title}>{t('vendor.affiliate_program', 'نظام التسويق بالعمولة')}</h1>
        <p className={s.subtitle}>{t('vendor.affiliate_desc', 'إدارة المسوقين، تتبع الحملات، ومعرفة أداء الإحالات.')}</p>
      </div>

      {/* Stats Grid */}
      <div className={s.statsGrid}>
        <div className={s.statCard}>
          <div className={`${s.statIcon} ${s.statPurple}`}>
            <Users size={28} />
          </div>
          <div className={s.statContent}>
            <div className={s.statLabel}>{t('vendor.total_affiliates', 'إجمالي المسوقين')}</div>
            <div className={s.statValue}>{affiliateData?.total_affiliates || 0}</div>
          </div>
        </div>

        <div className={s.statCard}>
          <div className={`${s.statIcon} ${s.statGreen}`}>
            <TrendingUp size={28} />
          </div>
          <div className={s.statContent}>
            <div className={s.statLabel}>{t('vendor.total_conversions', 'التحويلات الناجحة')}</div>
            <div className={s.statValue}>{affiliateData?.total_conversions || 0}</div>
          </div>
        </div>

        <div className={s.statCard}>
          <div className={`${s.statIcon} ${s.statAmber}`}>
            <DollarSign size={28} />
          </div>
          <div className={s.statContent}>
            <div className={s.statLabel}>{t('vendor.commission_paid', 'العمولات المدفوعة')}</div>
            <div className={s.statValue}>{affiliateData?.total_commission?.toFixed(2) || '0.00'} {t('common.currency')}</div>
          </div>
        </div>
      </div>

      {/* Campaigns List */}
      <div className={s.campaignsCard}>
        <div className={s.campaignsHead}>
          <h2 className={s.campaignsTitle}>{t('vendor.affiliate_campaigns', 'الحملات التسويقية النشطة')}</h2>
          <CustomButton variant="primary" size="sm" onClick={() => navigate('/vendor/coupons')}>
             <PlusCircle size={16} /> إضافة حملة جديدة
          </CustomButton>
        </div>

        {campaigns.length === 0 ? (
          <div className={s.emptyState}>
            <p>{t('vendor.no_campaigns', 'لا توجد حملات تسويقية نشطة حتى الآن. يرجى إنشاء كوبون تسويقي للبدء.')}</p>
          </div>
        ) : (
          <div className={s.campaignsList}>
            {campaigns.map((campaign) => (
              <div key={campaign.id} className={s.campaignItem}>
                <div className={s.campaignInfo}>
                  <h3 className={s.campaignName}>{campaign.name}</h3>
                  <p className={s.campaignComm}>نسبة العمولة: {campaign.commission_rate}%</p>
                </div>
                <div className={s.campaignStats}>
                  <span className={s.badge}>{campaign.clicks} نقرة</span>
                  <span className={s.badgeSuccess}>{campaign.conversions} مبيعة</span>
                </div>
                <button className={s.copyBtn} onClick={() => copyReferralCode(campaign.code)}>
                  <Copy size={16} />
                  {t('common.copy', 'نسخ')}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
