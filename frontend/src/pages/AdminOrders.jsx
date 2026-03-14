import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Download, ShoppingBag, Eye, Search, Filter } from "lucide-react";
import api from "../services/api";
import PageContainer from "../components/PageContainer";
import Skeleton from "../components/common/Skeleton";
import { useToast } from "../components/common/ToastProvider";
import styles from "./AdminOrders.module.css";

export default function AdminOrders() {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: "",
    user_id: "",
    vendor_id: "",
    date_from: "",
    date_to: ""
  });

  useEffect(() => {
    const timer = setTimeout(() => loadOrders(), 300);
    return () => clearTimeout(timer);
  }, [filters]);

  async function loadOrders() {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (filters.status) queryParams.append("status", filters.status);
      if (filters.user_id) queryParams.append("user_id", filters.user_id);
      if (filters.vendor_id) queryParams.append("vendor_id", filters.vendor_id);
      if (filters.date_from) queryParams.append("date_from", filters.date_from);
      if (filters.date_to) queryParams.append("date_to", filters.date_to);

      const res = await api.get(`/admin/orders/?${queryParams.toString()}`);
      setOrders(res.data || []);
    } catch (e) {
      console.error(e);
      toast.push({ message: t('common.error_loading_data'), type: "error" });
    } finally {
      setLoading(false);
    }
  }

  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return styles.statusPending;
      case 'shipped': return styles.statusShipped;
      case 'completed': return styles.statusCompleted;
      case 'cancelled': return styles.statusCancelled;
      default: return styles.statusProcessing;
    }
  };

  return (
    <PageContainer>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>{t('admin.manage_orders')}</h1>
          <p className={styles.pageSubtitle}>{t('admin.orders_overview_desc')}</p>
        </div>
        <div className={styles.headerActions}>
           <button className={styles.filterBtn}>
              <Download size={16} /> {t('admin.export_csv')}
           </button>
        </div>
      </div>

      <div className={styles.tableCard}>
        <div className={styles.toolbar}>
           <div className={styles.searchBox}>
              <Search size={18} color="var(--text-muted)" />
              <input 
                 type="text" 
                 placeholder={t('admin.search_users')}
                 className={styles.searchInput}
                 onChange={(e) => setFilters({...filters, user_id: e.target.value})}
              />
           </div>
           <div className={styles.filters}>
              <select 
                className={styles.statusSelect}
                value={filters.status}
                onChange={(e) => setFilters({...filters, status: e.target.value})}
              >
                <option value="">{t('common.all')}</option>
                <option value="pending">{t('orders.status_pending')}</option>
                <option value="processing">{t('orders.status_processing')}</option>
                <option value="shipped">{t('orders.status_shipped')}</option>
                <option value="completed">{t('orders.status_completed')}</option>
                <option value="cancelled">{t('orders.status_cancelled')}</option>
              </select>
           </div>
        </div>

        {loading ? (
          <div style={{ padding: '2rem' }}>
            {[1,2,3,4,5].map(i => <Skeleton key={i} height="60px" className="mb-2" />)}
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.dataGrid}>
              <thead>
                <tr>
                  <th>{t('orders.order_id')}</th>
                  <th>{t('common.customer')}</th>
                  <th>{t('common.date')}</th>
                  <th>{t('orders.total')}</th>
                  <th>{t('common.status')}</th>
                  <th style={{ textAlign: 'left' }}>{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order.id}>
                    <td><strong>#{order.id}</strong></td>
                    <td>
                        <div className={styles.customerCell}>
                            <span>{order.user?.username || order.user_id}</span>
                        </div>
                    </td>
                    <td>{new Date(order.created_at).toLocaleDateString(i18n.language === 'ar' ? 'ar-EG' : 'en-US')}</td>
                    <td>{order.total_amount?.toFixed(0)} {t('common.currency')}</td>
                    <td>
                        <span className={`${styles.statusBadge} ${getStatusClass(order.status)}`}>
                            {t(`orders.status_${order.status?.toLowerCase()}`, order.status)}
                        </span>
                    </td>
                    <td style={{ textAlign: 'left' }}>
                        <Link to={`/admin/orders/${order.id}`} className={styles.actionLink}>
                            <Eye size={16} />
                            {t('common.view_details')}
                        </Link>
                    </td>
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
