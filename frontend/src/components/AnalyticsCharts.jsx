import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend
} from 'recharts';

export function SalesChart({ data }) {
  const { t } = useTranslation();
  if (!data || data.length === 0) return <div className="p-4 text-center text-gray-500">{t('common.no_data') || "No data available"}</div>;

  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <XAxis dataKey="date" />
          <YAxis />
          <CartesianGrid strokeDasharray="3 3" />
          <Tooltip />
          <Area type="monotone" dataKey="total" stroke="#8884d8" fillOpacity={1} fill="url(#colorSales)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function VendorPerformanceChart({ data }) {
    const { t } = useTranslation();
    if (!data || data.length === 0) return <div className="p-4 text-center text-gray-500">{t('common.no_data') || "No data available"}</div>;

    return (
      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="sales" fill="var(--primary)" name={`${t('product.price')} (${t('common.currency')})`} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
}
export function GrowthChart({ data, color = "#8884d8" }) {
    const { t } = useTranslation();
    if (!data || data.length === 0) return <div className="p-4 text-center text-gray-500">{t('common.no_data') || "No data available"}</div>;

    return (
      <div style={{ width: '100%', height: 120 }}>
        <ResponsiveContainer>
          <AreaChart data={data}>
            <Tooltip />
            <Area type="monotone" dataKey="count" stroke={color} fill={color} fillOpacity={0.1} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    );
}
