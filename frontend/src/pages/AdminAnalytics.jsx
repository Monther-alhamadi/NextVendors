import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area 
} from "recharts";
import PageContainer from "../components/PageContainer";
import api from "../services/api";
import Skeleton from "../components/common/Skeleton";
import s from "./AdminAnalytics.module.css";


const PERIOD_OPTIONS = [
  { key: "daily", label: t("admin.period_daily", "يومي") },
  { key: "weekly", label: t("admin.period_weekly", "أسبوعي") },
  { key: "monthly", label: t("admin.period_monthly", "شهري") },
  { key: "yearly", label: t("admin.period_yearly", "سنوي") },
];

export default function AdminAnalytics() {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [period, setPeriod] = useState("monthly");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [period]);

  async function loadAnalytics() {
    setLoading(true);
    try {
      const resp = await api.get(`/analytics/admin?period=${period}`);
      setData(resp.data);
    } catch (e) {
      console.error("Analytics load failed", e);
    } finally {
      setLoading(false);
    }
  }

  const StatCard = ({ title, value, detail, color, icon }) => (
    <div className={s.statCard}>
      <div className={s.statHeader}>
        <div className={s.statIcon} style={{ background: `${color}15`, color }}>
          {icon}
        </div>
        <span className={s.statLabel}>{title}</span>
      </div>
      <div className={s.statValue} style={{ color }}>{value}</div>
      <p className={s.statDetail}>{detail}</p>
      <div className={s.bgOrb} style={{ backgroundColor: color }} />
    </div>
  );

  const chartData = data?.sales_chart?.map(item => ({
    date: item.date,
    value: item.value,
  })) || [];

  return (
    <PageContainer>
      <div className={s.analytics}>
        {/* Header */}
        <div className={s.pageHeader}>
          <div>
            <h1 className={s.pageTitle}>{t('admin.business_intelligence', 'ذكاء الأعمال')}</h1>
            <p className={s.pageSubtitle}>{t('admin.financial_indicators', 'المؤشرات المالية والأداء')}</p>
          </div>
          <div className={s.periodSelector}>
            {PERIOD_OPTIONS.map(p => (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key)}
                className={`${s.periodBtn} ${period === p.key ? s.periodActive : ''}`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* KPI Cards */}
        {loading ? (
          <div className={s.kpiGrid}>
            {[1,2,3,4].map(i => <Skeleton key={i} height="160px" style={{ borderRadius: '16px' }} />)}
          </div>
        ) : (
          <div className={s.kpiGrid}>
            <StatCard
              title={t('admin.gmv', 'إجمالي المبيعات')}
              value={`${(data?.total_gmv || 0).toLocaleString()} ${t('common.currency', 'ر.س')}`}
              detail={`${data?.order_count || 0} {t("admin.order_lbl_short", "طلب")} | {t("admin.growth_lbl", "نمو")} ${data?.gmv_growth || 0}%`}
              color="#6366f1"
              icon="💰"
            />
            <StatCard
              title={t('admin.platform_profit', 'أرباح المنصة')}
              value={`${(data?.platform_net_profit || 0).toLocaleString()} ${t('common.currency', 'ر.س')}`}
              detail={`${t("admin.growth_lbl", "نمو")} ${data?.profit_growth || 0}%`}
              color="#10b981"
              icon="📊"
            />
            <StatCard
              title={t('admin.avg_order', 'متوسط الطلب')}
              value={`${(data?.avg_order_value || 0).toLocaleString()} ${t('common.currency', 'ر.س')}`}
              detail={`${data?.active_vendors || 0} ${t("admin.active_store_lbl", "متجر نشط")}`}
              color="#f59e0b"
              icon="🏷️"
            />
            <StatCard
              title={t("admin.users_title", "المستخدمين")}
              value={(data?.total_users || 0).toLocaleString()}
              detail={`${data?.active_vendors || 0} ${t("admin.vendor_lbl", "تاجر")} | ${(data?.total_users || 0) - (data?.active_vendors || 0)} {t("admin.customer_lbl", "عميل")}`}
              color="#8b5cf6"
              icon="👥"
            />
          </div>
        )}

        {/* Charts */}
        <div className={s.chartsRow}>
          {/* Revenue Distribution Chart */}
          <div className={s.chartCard}>
            <div className={s.chartHeader}>
              <h3 className={s.chartTitle}>
                <span className={s.chartIndicator} style={{ background: '#6366f1' }} />
                {t('admin.revenue_distribution', 'توزيع الإيرادات')}
              </h3>
            </div>
            <div className={s.chartBody}>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="analyticsFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px 20px' }}
                      formatter={(value) => [`${value.toLocaleString()} ${t("common.currency", "ر.س")}`, t("admin.revenue_lbl", "الإيرادات")]}
                      cursor={{stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '4 4'}}
                    />
                    <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#analyticsFill)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className={s.emptyState}>{t("admin.no_data_period", "لا توجد بيانات للفترة المحددة")}</div>
              )}
            </div>
          </div>

          {/* Sales Performance Bar Chart */}
          <div className={s.chartCard}>
            <div className={s.chartHeader}>
              <h3 className={s.chartTitle}>
                <span className={s.chartIndicator} style={{ background: '#10b981' }} />
                {t('admin.sales_performance', 'أداء المبيعات')}
              </h3>
            </div>
            <div className={s.chartBody}>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                    <Tooltip 
                      cursor={{fill: '#f8fafc', radius: 4}}
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px 20px' }}
                      formatter={(value) => [`${value.toLocaleString()} ${t("common.currency", "ر.س")}`, t("admin.sales_count", "المبيعات")]}
                    />
                    <Bar dataKey="value" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={50} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className={s.emptyState}>{t("admin.no_data", "لا توجد بيانات")}</div>
              )}
            </div>
          </div>
        </div>

        {/* Top Vendors Table */}
        {data?.top_vendors && data.top_vendors.length > 0 && (
          <div className={s.chartCard}>
            <div className={s.chartHeader}>
              <h3 className={s.chartTitle}>
                <span className={s.chartIndicator} style={{ background: '#f59e0b' }} />
                {t("admin.top_performing_stores", "أفضل المتاجر أداءً")}
              </h3>
            </div>
            <table className={s.vendorsTable}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>{t("admin.store_col", "المتجر")}</th>
                  <th>{t("admin.revenue_lbl", "الإيرادات")}</th>
                  <th>{t("admin.sales_count", "عدد المبيعات")}</th>
                </tr>
              </thead>
              <tbody>
                {data.top_vendors.map((v, i) => (
                  <tr key={v.id}>
                    <td><span className={s.rank}>{i + 1}</span></td>
                    <td style={{ fontWeight: 600 }}>{v.name}</td>
                    <td>{v.revenue.toLocaleString()} {t("common.currency", "ر.س")}</td>
                    <td>{v.sales}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
