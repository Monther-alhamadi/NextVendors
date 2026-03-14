import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, Cell
} from "recharts";
import { 
  TrendingUp, TrendingDown, DollarSign, Users, ShoppingBag, 
  Activity, ArrowUpRight, Download, Calendar, PackageCheck,
  AlertCircle, Package, RefreshCw
} from 'lucide-react';
import PageContainer from "../components/PageContainer";
import styles from "./AdminDashboard.module.css";
import api from "../services/api";
import Skeleton from "../components/common/Skeleton";

const ACTIVITY_ICONS = {
  order: <ShoppingBag size={14} />,
  vendor: <Users size={14} />,
  product: <Package size={14} />,
  payment: <DollarSign size={14} />,
  alert: <AlertCircle size={14} />,
};

export default function AdminDashboard() {
  const { t } = useTranslation();

  const PERIOD_OPTIONS = [
    { key: "daily", label: t("dashboard.period_daily") },
    { key: "weekly", label: t("dashboard.period_weekly") },
    { key: "monthly", label: t("dashboard.period_monthly") },
    { key: "yearly", label: t("dashboard.period_yearly") },
  ];

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [activities, setActivities] = useState([]);
  const [period, setPeriod] = useState("monthly");

  useEffect(() => {
    loadDashboardData();
  }, [period]);

  async function loadDashboardData() {
    setLoading(true);
    try {
      const [analyticsRes, activityRes] = await Promise.all([
        api.get(`/analytics/admin?period=${period}`).catch(() => ({ data: {} })),
        api.get("/analytics/admin/activity?limit=15").catch(() => ({ data: [] })),
      ]);

      const data = analyticsRes.data || {};
      const activityData = activityRes.data || [];

      setStats({
        gmv: data.total_gmv || 0,
        gmv_growth: data.gmv_growth || 0,
        order_count: data.order_count || 0,
        order_growth: data.order_growth || 0,
        total_vendors: data.active_vendors || 0,
        profit: data.platform_net_profit || 0,
        profit_growth: data.profit_growth || 0,
        total_users: data.total_users || 0,
        avg_order: data.avg_order_value || 0,
      });

      if (data.sales_chart && data.sales_chart.length > 0) {
        setChartData(data.sales_chart.map(item => ({
          name: item.date,
          revenue: item.value,
        })));
      } else {
        setChartData([]);
      }

      setActivities(activityData);
    } catch (e) {
      console.error("Dashboard load failed", e);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className={styles.dashboard}>
        <Skeleton height="80px" className="mb-4 rounded-xl" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
          {[1,2,3,4].map(i => <Skeleton key={i} height="140px" style={{ borderRadius: '16px' }} />)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
           <Skeleton height="400px" style={{ borderRadius: '16px' }} />
           <Skeleton height="400px" style={{ borderRadius: '16px' }} />
        </div>
      </div>
    );
  }

  const KpiCard = ({ title, value, growth, prefix = '', suffix = '', icon: Icon, colorClass }) => {
    const isPositive = growth >= 0;
    return (
      <div className={styles.kpiCard}>
        <div className={styles.kpiHeader}>
          <span className={styles.kpiTitle}>{title}</span>
          <div className={`${styles.trendBadge} ${isPositive ? styles.trendUp : styles.trendDown}`}>
            {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {Math.abs(growth)}%
          </div>
        </div>
        <div className={styles.kpiValue}>
          {prefix}{typeof value === 'number' ? value.toLocaleString() : value}{suffix}
        </div>
        <div className={styles.kpiSubtext}>{t('dashboard.compare_prev_period')}</div>
        
        <div className={styles.kpiIconWrapper} style={{ color: colorClass }}>
          <Icon size={120} strokeWidth={1.5} />
        </div>
      </div>
    );
  };

  const timeAgo = (isoTime) => {
    if (!isoTime) return "";
    const diff = Date.now() - new Date(isoTime).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return t("dashboard.time_now");
    if (mins < 60) return t("dashboard.time_mins_ago", { count: mins });
    const hours = Math.floor(mins / 60);
    if (hours < 24) return t("dashboard.time_hours_ago", { count: hours });
    const days = Math.floor(hours / 24);
    return t("dashboard.time_days_ago", { count: days });
  };

  return (
    <div className={styles.dashboard}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>{t('admin.dashboard_title')}</h1>
          <p className={styles.pageSubtitle}>{t('admin.dashboard_subtitle')}</p>
        </div>
        <div className={styles.headerActions}>
          <div className={styles.periodSelector}>
            {PERIOD_OPTIONS.map(p => (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key)}
                className={`${styles.periodBtn} ${period === p.key ? styles.periodActive : ''}`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <button className={styles.actionBtn} onClick={loadDashboardData}>
            <RefreshCw size={16} /> {t('common.refresh')}
          </button>
        </div>
      </div>

      <div className={styles.kpiGrid}>
        <KpiCard 
          title={t("dashboard.kpi_gmv")} 
          value={stats.gmv} 
          growth={stats.gmv_growth} 
          suffix={' ' + t('common.currency')}
          icon={DollarSign}
          colorClass="#6366f1"
        />
        <KpiCard 
          title={t("dashboard.kpi_profit")} 
          value={stats.profit} 
          growth={stats.profit_growth} 
          suffix={' ' + t('common.currency')}
          icon={TrendingUp}
          colorClass="#10b981"
        />
        <KpiCard 
          title={t("dashboard.kpi_orders")} 
          value={stats.order_count} 
          growth={stats.order_growth} 
          icon={ShoppingBag}
          colorClass="#f59e0b"
        />
        <KpiCard 
          title={t("dashboard.kpi_avg_order")} 
          value={stats.avg_order} 
          growth={0}
          suffix={' ' + t('common.currency')}
          icon={Activity}
          colorClass="#8b5cf6"
        />
      </div>

      <div className={styles.chartsGrid}>
        <div className={styles.chartCard} style={{ gridColumn: 'span 2' }}>
          <div className={styles.chartHeader}>
            <h3 className={styles.chartTitle}>
              <Activity size={20} color="var(--primary)" />
              {t('dashboard.sales')} ({PERIOD_OPTIONS.find(p => p.key === period)?.label})
            </h3>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {t('dashboard.vendors_count')}: {stats.total_vendors} | {t('dashboard.users_count')}: {stats.total_users?.toLocaleString()}
              </span>
            </div>
          </div>
          <div className={styles.chartContainer}>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-light)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'var(--text-muted)', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: 'var(--text-muted)', fontSize: 12}} tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-md)' }}
                    formatter={(value) => [`${value.toLocaleString()} ${t("common.currency")}`, t('dashboard.sales')]}
                  />
                  <Area type="monotone" dataKey="revenue" name={t("dashboard.sales")} stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                {t('dashboard.no_sales_data')}
              </div>
            )}
          </div>
        </div>

        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h3 className={styles.chartTitle}>
              <TrendingUp size={20} color="#10b981" />
              {t('dashboard.recent_activity')}
            </h3>
            <span className={styles.trendBadge} style={{ background: '#d1fae5', color: '#10b981' }}>
              {activities.length > 0 ? t('admin.live') : '—'}
            </span>
          </div>
          <div className={styles.activityList}>
            {activities.length > 0 ? (
              activities.map((activity) => (
                <div key={activity.id} className={styles.activityItem}>
                  <div className={styles.activityIcon} style={{ background: activity.color || '#6366f1' }}>
                    {ACTIVITY_ICONS[activity.type] || <Activity size={14} />}
                  </div>
                  <div className={styles.activityContent}>
                    <p className={styles.activityText}>
                      {activity.text} {activity.detail && <span>{activity.detail}</span>}
                    </p>
                    <div className={styles.activityTime}>{timeAgo(activity.time)}</div>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                {t('dashboard.no_recent_activity')}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
