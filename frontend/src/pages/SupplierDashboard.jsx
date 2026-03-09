import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Package, DollarSign, TrendingUp, Truck, BarChart3, Settings, ShoppingBag, ClipboardList, AlertCircle } from 'lucide-react';
import api from '../services/api';
import PageContainer from '../components/PageContainer';
import Skeleton from '../components/common/Skeleton';
import styles from './SupplierDashboard.module.css';

export default function SupplierDashboard() {
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, productsRes, walletRes, ordersRes] = await Promise.allSettled([
        api.get('/supplier/stats'),
        api.get('/supplier/products'),
        api.get('/supplier/wallet'),
        api.get('/supplier/fulfillment-orders'),
      ]);
      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data);
      if (productsRes.status === 'fulfilled') setProducts(productsRes.value.data || []);
      if (walletRes.status === 'fulfilled') setWallet(walletRes.value.data);
      if (ordersRes.status === 'fulfilled') setOrders(ordersRes.value.data || []);
    } catch (e) {
      setError(t('common.error_loading_data', 'Failed to load data'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const statusClass = (s) => {
    if (s === 'shipped' || s === 'completed') return styles.badgeShipped;
    if (s === 'cancelled') return styles.badgeCancelled;
    return styles.badgePending;
  };

  if (loading) {
    return (
      <PageContainer>
        <Skeleton variant="rect" style={{ height: 120, marginBottom: '2rem' }} />
        <div className={styles.statsGrid}>
          {[1,2,3].map(i => <Skeleton key={i} variant="rect" style={{ height: 100 }} />)}
        </div>
        <Skeleton variant="rect" style={{ height: 300, marginTop: '2rem' }} />
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>
          <AlertCircle size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
          <p>{error}</p>
          <button onClick={fetchData} style={{ marginTop: '1rem', padding: '0.75rem 2rem', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 700, cursor: 'pointer' }}>
            {t('common.retry', 'Retry')}
          </button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>{t('supplier.dashboard_title', 'Supplier Command Center')}</h1>
          <p className={styles.subtitle}>{t('supplier.dashboard_subtitle', 'Manage your inventory, orders, and earnings')}</p>
        </div>
      </div>

      {/* Wallet Card */}
      {wallet && (
        <div className={`${styles.walletHeaderCard} ${styles.animateSlideUp}`}>
          <div>
            <div className={styles.walletLabel}>{t('vendor.wallet', 'Wallet Balance')}</div>
            <div className={styles.walletBalance}>
              {Number(wallet.balance || 0).toFixed(2)} <span>{t('common.currency', 'SAR')}</span>
            </div>
            <div className={styles.walletPending}>
              {t('supplier.pending_earnings', 'Pending')}: {Number(wallet.pending || 0).toFixed(2)}
            </div>
          </div>
          <Link to="/supplier/payouts" className={styles.payoutBtn}>
            {t('vendor.payout_request_success', 'Request Payout')}
          </Link>
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className={styles.statsGrid}>
          <div className={`${styles.statCard} ${styles.animateSlideUp}`} style={{ animationDelay: '0.1s' }}>
            <div className={styles.statIcon} style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1' }}>
              <Package size={28} />
            </div>
            <div className={styles.statContent}>
              <h3>{stats.total_products}</h3>
              <p>{t('admin.total_products', 'Total Products')}</p>
            </div>
          </div>
          <div className={`${styles.statCard} ${styles.animateSlideUp}`} style={{ animationDelay: '0.2s' }}>
            <div className={styles.statIcon} style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
              <TrendingUp size={28} />
            </div>
            <div className={styles.statContent}>
              <h3>{stats.total_inventory}</h3>
              <p>{t('product.inventory', 'Total Inventory')}</p>
            </div>
          </div>
          <div className={`${styles.statCard} ${styles.animateSlideUp}`} style={{ animationDelay: '0.3s' }}>
            <div className={styles.statIcon} style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>
              <DollarSign size={28} />
            </div>
            <div className={styles.statContent}>
              <h3>{Number(stats.total_sales || 0).toFixed(2)}</h3>
              <p>{t('vendor.total_sales', 'Total Sales')}</p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className={styles.quickActionsSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>{t('vendor.quick_actions', 'Quick Actions')}</h2>
        </div>
        <div className={styles.actionsGrid}>
          <Link to="/supplier/products" className={styles.actionCard}>
            <div className={styles.actionIcon}><ShoppingBag size={28} /></div>
            {t('vendor.manage_products', 'Manage Products')}
          </Link>
          <Link to="/supplier/orders" className={styles.actionCard}>
            <div className={styles.actionIcon}><Truck size={28} /></div>
            {t('vendor.fulfill_orders', 'Fulfill Orders')}
          </Link>
          <Link to="/supplier/analytics" className={`${styles.actionCard} ${styles.disabledAction}`}>
            <span className={styles.proBadge}>PRO</span>
            <div className={styles.actionIcon}><BarChart3 size={28} /></div>
            {t('admin.analytics', 'Analytics')}
            <span className={styles.tooltip}>{t('supplier.upgrade_for_analytics', 'Upgrade your plan for analytics')}</span>
          </Link>
          <Link to="/supplier/settings" className={styles.actionCard}>
            <div className={styles.actionIcon}><Settings size={28} /></div>
            {t('profile.settings', 'Settings')}
          </Link>
        </div>
      </div>

      {/* Recent Fulfillment Orders */}
      <div className={styles.recentOrdersSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>{t('vendor.recent_orders', 'Recent Orders')}</h2>
          <Link to="/supplier/orders" className={styles.viewAllLink}>{t('home.trending.view_all', 'View All')}</Link>
        </div>
        <div className={styles.tableWrap}>
          {orders.length > 0 ? (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>{t('orders.order_id', 'Order')}</th>
                  <th>{t('common.status', 'Status')}</th>
                  <th>{t('common.date', 'Date')}</th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 5).map(o => (
                  <tr key={o.id}>
                    <td>{o.id}</td>
                    <td>#{o.order_id}</td>
                    <td><span className={`${styles.statusBadge} ${statusClass(o.status)}`}>{o.status}</span></td>
                    <td>{new Date(o.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <ClipboardList size={40} style={{ marginBottom: '1rem', opacity: 0.4 }} />
              <p>{t('vendor.no_orders', 'No orders yet')}</p>
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
