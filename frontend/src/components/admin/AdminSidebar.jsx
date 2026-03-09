import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  BarChart3, LayoutDashboard, ShoppingBag, ShoppingCart, 
  Users, UserCheck, Settings, Package, Percent, FileText, 
  HelpCircle, MessageCircle, Megaphone, LifeBuoy, FileCheck, 
  Database, Activity, Banknote, Undo2, ArrowLeftRight, Image as ImageIcon,
  ShieldAlert, Monitor
} from 'lucide-react';
import styles from './AdminSidebar.module.css';

export default function AdminSidebar({ isMobileOpen, setMobileOpen }) {
  const { t } = useTranslation();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  // Auto-close on route change for mobile
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const menuGroups = [
    {
      title: t('admin.overview', 'نظرة عامة'),
      items: [
        { path: '/admin', icon: <LayoutDashboard size={20} />, label: t('admin.dashboard_title', 'لوحة القيادة'), exact: true },
        { path: '/admin/analytics', icon: <BarChart3 size={20} />, label: t('admin.bi_insights', 'تحليلات الأداء والتقارير') },
      ]
    },
    {
      title: t('admin.commerce', 'التجارة والمبيعات'),
      items: [
        { path: '/admin/products', icon: <Package size={20} />, label: t('admin.manage_products', 'إدارة المنتجات') },
        { path: '/admin/orders', icon: <ShoppingCart size={20} />, label: t('admin.manage_orders', 'الطلبات والمبيعات') },
        { path: '/admin/import', icon: <FileText size={20} />, label: t('admin.import_products', 'استيراد المنتجات') },
      ]
    },
    {
      title: t('admin.users_vendors', 'المستخدمون والشركاء'),
      items: [
        { path: '/admin/users', icon: <Users size={20} />, label: t('admin.manage_users', 'العملاء والمستخدمين') },
        { path: '/admin/roles', icon: <ShieldAlert size={20} />, label: t('admin.manage_roles', 'الصلاحيات والأدوار') },
        { path: '/admin/vendors', icon: <UserCheck size={20} />, label: t('admin.manage_vendors', 'طلبات البائعين') },
        { path: '/admin/plans', icon: <FileCheck size={20} />, label: t('admin.plans_management', 'باقات الاشتراكات') },
      ]
    },
    {
      title: t('admin.helpdesk', 'مكتب المساعدة والتواصل'),
      items: [
        { path: '/admin/support', icon: <LifeBuoy size={20} />, label: t('admin.customer_support', 'مكتب التذاكر والشكاوى') },
        { path: '/admin/broadcast', icon: <Megaphone size={20} />, label: t('admin.broadcast', 'الرسائل الجماعية') },
        { path: '/admin/reviews', icon: <MessageCircle size={20} />, label: t('admin.manage_reviews', 'التقييمات والمراجعات') },
      ]
    },
    {
      title: t('admin.operations', 'العمليات والمالية'),
      items: [
        { path: '/admin/ledger', icon: <Banknote size={20} />, label: t('admin.financial_ledger', 'المحفظة والسجلات المالية') },
        { path: '/admin/payouts', icon: <ArrowLeftRight size={20} />, label: t('admin.payouts', 'طلبات سحب الرصيد') },
        { path: '/admin/rma', icon: <Undo2 size={20} />, label: t('admin.returns_rma', 'طلبات الإرجاع') },
      ]
    },
    {
      title: t('admin.system', 'التكوين والنظام'),
      items: [
        { path: '/admin/content', icon: <ImageIcon size={20} />, label: t('admin.manage_content', 'إدارة المحتوى والإعلانات') },
        { path: '/admin/storebuilder', icon: <Monitor size={20} />, label: t('admin.visual_builder', 'منشئ المتجر المرئي') },
        { path: '/admin/ads', icon: <Megaphone size={20} />, label: t('admin.manage_vendor_ads', 'إعلانات التجّار المدفوعة') },
        { path: '/admin/settings', icon: <Settings size={20} />, label: t('admin.system_settings', 'إعدادات النظام العامة') },
        { path: '/admin/audit', icon: <Activity size={20} />, label: t('admin.audit_trail', 'سجلات المراقبة والنظام') },
        { path: '/admin/cache', icon: <Database size={20} />, label: t('admin.cache_management', 'إدارة الذاكرة المؤقتة') },
      ]
    }
  ];

  const isActive = (path, exact = false) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  return (
    <>
      <div 
        className={`${styles.mobileOverlay} ${isMobileOpen ? styles.isOpen : ''}`}
        onClick={() => setMobileOpen(false)}
      />

      <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''} ${isMobileOpen ? styles.mobileOpen : ''}`}>
        <div className={styles.header}>
          <Link to="/admin" className={styles.logo}>
            <div className={styles.logoIcon}>A</div>
            {!collapsed && <span className={styles.logoText}>لوحة القيادة</span>}
          </Link>
          <button 
            className={styles.collapseBtn}
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? '←' : '→'}
          </button>
        </div>

        <nav className={styles.nav}>
          {menuGroups.map((group, groupIdx) => (
            <div key={groupIdx} className={styles.menuGroup}>
              {!collapsed && (
                <div className={styles.groupTitle}>{group.title}</div>
              )}
              <ul className={styles.menuList}>
                {group.items.map((item) => (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className={`${styles.menuItem} ${isActive(item.path, item.exact) ? styles.active : ''}`}
                      title={collapsed ? item.label : ''}
                    >
                      <span className={styles.menuIcon}>{item.icon}</span>
                      {!collapsed && <span className={styles.menuLabel}>{item.label}</span>}
                      {!collapsed && isActive(item.path, item.exact) && (
                        <div className={styles.activeIndicator} />
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {!collapsed && (
          <div className={styles.footer}>
            <Link to="/" className={styles.returnBtn}>
              <span className={styles.returnLabel}>{t('admin.return_to_site', 'العودة للمتجر')} &larr;</span>
            </Link>
          </div>
        )}
      </aside>
    </>
  );
}
