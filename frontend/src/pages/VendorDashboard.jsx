import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';
import s from './VendorDashboard.module.css';
import { Package, DollarSign, TrendingUp, TrendingDown, ShoppingCart, Users, Activity, PackageCheck } from 'lucide-react';
import api from '../services/api';

export default function VendorDashboard() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/analytics/vendor/dashboard');
      setData(res.data);
    } catch (err) {
      console.error('Failed to fetch vendor dashboard:', err);
      setError(t('vendor.dashboard_error', 'حدث خطأ أثناء تحميل البيانات'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className={s.dashboard}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={s.dashboard}>
        <p style={{ color: 'var(--color-error, #ef4444)', textAlign: 'center', padding: '40px' }}>
          {error || t('vendor.no_data', 'لا توجد بيانات')}
        </p>
        <button onClick={fetchDashboard} className={`${s.actionBtn} ${s.primaryBtn}`} style={{ margin: '0 auto', display: 'block' }}>
          {t('common.retry', 'إعادة المحاولة')}
        </button>
      </div>
    );
  }

  const stats = [
    { title: t('vendor.total_earnings', 'إجمالي أرباحك'), value: data.total_earnings?.toLocaleString() || '0', suffix: ` ${t('common.currency', 'ر.س')}`, icon: DollarSign, colorClass: "#6366f1" },
    { title: t('vendor.active_orders', 'الطلبات النشطة'), value: data.active_orders || 0, icon: ShoppingCart, colorClass: "#10b981" },
    { title: t('vendor.pending_payouts', 'أرباح معلقة'), value: data.pending_payouts?.toLocaleString() || '0', suffix: ` ${t('common.currency', 'ر.س')}`, icon: TrendingUp, colorClass: "#f59e0b" },
    { title: t('vendor.low_stock', 'منتجات منخفضة المخزون'), value: data.low_stock_count || 0, icon: Package, colorClass: "#ef4444" },
  ];

  const KpiCard = ({ title, value, prefix = '', suffix = '', icon: Icon, colorClass }) => {
    return (
      <div className={s.kpiCard} style={{ '--card-color': colorClass }}>
        <div className={s.kpiHeader}>
          <span className={s.kpiTitle}>{title}</span>
        </div>
        <div className={s.kpiValue}>
          {prefix}{typeof value === 'number' ? value.toLocaleString() : value}{suffix}
        </div>
        
        <div className={s.kpiIconWrapper} style={{ color: colorClass }}>
          <Icon size={120} strokeWidth={1.5} />
        </div>
      </div>
    );
  };

  // Format chart data from API
  const chartData = (data.sales_chart_data || []).map(item => ({
    name: item.date,
    revenue: item.value,
  }));

  return (
    <div className={s.dashboard}>
      <header className={s.pageHeader}>
        <div>
          <h1 className={s.pageTitle}>{t('vendor.dashboard_title', 'لوحة التحكم')}</h1>
          <p className={s.pageSubtitle}>
            {data.store_name ? `${t('vendor.welcome_back', 'مرحباً بك')}, ${data.store_name}` : t('vendor.welcome_subtitle', 'إليك ملخص أداء متجرك')}
          </p>
        </div>
        <div className={s.headerActions}>
          <button onClick={fetchDashboard} className={`${s.actionBtn} ${s.primaryBtn}`}>
            {t('vendor.refresh_data', 'تحديث البيانات')}
          </button>
        </div>
      </header>

      {/* Stats Grid */}
      <div className={s.kpiGrid}>
        {stats.map((stat, i) => (
          <KpiCard 
            key={i}
            title={stat.title} 
            value={stat.value} 
            suffix={stat.suffix}
            icon={stat.icon}
            colorClass={stat.colorClass}
          />
        ))}
      </div>

      {/* Charts Section */}
      <div className={s.chartsGrid}>
        <div className={s.chartCard}>
          <div className={s.chartHeader}>
            <h3 className={s.chartTitle}>
              <TrendingUp size={20} className="text-primary" /> 
              {t('vendor.earnings_chart', 'أرباحك (آخر 30 يوم)')}
            </h3>
          </div>
          <div className={s.chartContainer}>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-light)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} dx={-10} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-lg)' }}
                    labelStyle={{ fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '8px' }}
                  />
                  <Area type="monotone" dataKey="revenue" name={t('vendor.earnings', 'أرباح')} stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>
                {t('vendor.no_chart_data', 'لا توجد بيانات مبيعات حتى الآن')}
              </p>
            )}
          </div>
        </div>

        <div className={s.chartCard}>
          <div className={s.chartHeader}>
            <h3 className={s.chartTitle}>
              <Activity size={20} className="text-emerald-500" /> 
              {t('vendor.recent_activity', 'نشاط حديث')}
            </h3>
          </div>
          <div className={s.activityList}>
            {(data.recent_activities || []).length > 0 ? (
              data.recent_activities.map(act => (
                <div key={act.id} className={s.activityItem}>
                  <div className={s.activityIcon} style={{ background: act.status === 'pending' ? '#f59e0b' : act.status === 'shipped' ? '#6366f1' : '#10b981' }}>
                    <ShoppingCart size={14}/>
                  </div>
                  <div className={s.activityContent}>
                    <p className={s.activityText}>
                      {act.text} <span>{act.amount?.toLocaleString()} {t('common.currency', 'ر.س')}</span>
                    </p>
                    <p className={s.activityTime}>
                      {act.time ? new Date(act.time).toLocaleDateString('ar') : ''}
                      {' — '}
                      {t(`order.status.${act.status}`, act.status)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>
                {t('vendor.no_activity', 'لا يوجد نشاط حديث')}
              </p>
            )}
          </div>
        </div>

        {/* Top Products */}
        {(data.top_products || []).length > 0 && (
          <div className={s.chartCard}>
            <div className={s.chartHeader}>
              <h3 className={s.chartTitle}>
                <PackageCheck size={20} /> 
                {t('vendor.top_products', 'أكثر المنتجات مبيعاً')}
              </h3>
            </div>
            <div className={s.chartContainer}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.top_products} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-light)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                  <Tooltip />
                  <Bar dataKey="sold" name={t('vendor.units_sold', 'وحدات مباعة')} fill="#6366f1" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
