import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Lock } from 'lucide-react';
import { usePermissions } from '../../hooks/usePermissions';
import s from './VendorSidebar.module.css';

export default function VendorSidebar({ collapsed, setCollapsed }) {
  const { t } = useTranslation();
  const location = useLocation();
  const { can } = usePermissions();

  const menuGroups = [
    {
      title: t('vendor.overview', 'نظرة عامة'),
      items: [
        { path: '/vendor', icon: '📊', label: t('vendor.dashboard', 'لوحة التحكم'), exact: true },
      ]
    },
    {
      title: t('vendor.products', 'المنتجات'),
      items: [
        { path: '/vendor/products', icon: '📦', label: t('vendor.my_products', 'منتجاتي') },
        { path: '/vendor/products/add', icon: '➕', label: t('vendor.add_product', 'إضافة منتج') },
        { path: '/vendor/dropshipping', icon: '🌍', label: t('vendor.dropshipping_import', 'استيراد دروب شيبينج') },
        { path: '/vendor/reviews', icon: '⭐', label: t('vendor.reviews', 'التقييمات') }
      ]
    },
    {
      title: t('vendor.financial', 'المالية'),
      items: [
        { path: '/vendor/wallet', icon: '💰', label: t('vendor.wallet', 'المحفظة') },
        { path: '/vendor/payouts', icon: '💸', label: t('vendor.payout_requests', 'طلبات السحب') },
        { 
          path: '/vendor/affiliate', 
          icon: '🤝', 
          label: t('vendor.affiliate_program', 'نظام المسوقين'),
          locked: !can('access_advanced_analytics'), // Or maybe another permission
          tooltip: t('vendor.upgrade_to_pro', 'قم بالترقية للباقة الاحترافية')
        }
      ]
    },
    {
      title: t('vendor.operations', 'العمليات'),
      items: [
        { path: '/vendor/orders', icon: '🧾', label: t('vendor.orders', 'الطلبات') },
        { path: '/vendor/shipping', icon: '🚚', label: t('vendor.shipping', 'الشحن') },
        { path: '/vendor/coupons', icon: '🎟️', label: t('vendor.coupons', 'الكوبونات') },
        { path: '/vendor/support', icon: '🎧', label: t('vendor.support', 'دعم الشركاء') }
      ]
    },
    {
      title: t('vendor.marketing', 'التسويق'),
      items: [
        { path: '/vendor/ads', icon: '📢', label: t('vendor.advertising', 'الترويج والإعلانات') }
      ]
    },
    {
      title: t('vendor.settings', 'الإعدادات'),
      items: [
        { path: '/vendor/editor', icon: '🏪', label: t('vendor.store_profile', 'ملف المتجر') },
        { path: '/vendor/plans', icon: '📋', label: t('vendor.subscription', 'الاشتراك') },
        { path: '/vendor/settings', icon: '⚙️', label: t('vendor.account_settings', 'إعدادات الحساب') }
      ]
    }
  ];

  const isActive = (path, exact = false) => {
    if (exact) {
      return location.pathname === path || location.pathname === path + '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {!collapsed && (
        <div 
          className={s.overlay}
          onClick={() => setCollapsed(true)}
        />
      )}

      <aside className={`${s.sidebar} ${collapsed ? s.collapsed : ''}`}>
        <div className={s.header}>
          <div className={s.logo}>
            <span className={s.logoIcon}>🏬</span>
            {!collapsed && <span className={s.logoText}>{t('vendor.vendor_panel', 'لوحة البائع')}</span>}
          </div>
          <button 
            className={s.collapseBtn}
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <span>{collapsed ? '→' : '←'}</span>
          </button>
        </div>

        {!collapsed && (
          <div className={s.returnToSite}>
            <Link to="/" className={s.returnLink}>
              <span>🏠</span>
              <span>{t('admin.return_to_site', 'العودة للمتجر')}</span>
            </Link>
          </div>
        )}

        <nav className={s.nav}>
          {menuGroups.map((group, groupIdx) => (
            <div key={groupIdx} className={s.menuGroup}>
              {!collapsed && (
                <div className={s.groupTitle}>
                  {group.title}
                </div>
              )}
              <ul className={s.menuList}>
                {group.items.map((item) => (
                  <li key={item.path}>
                    {item.locked ? (
                      <div className={`${s.menuItem} ${s.locked}`} title={item.tooltip}>
                        <span className={s.menuIcon}>{item.icon}</span>
                        {!collapsed && (
                          <>
                            <span className={s.menuLabel}>{item.label}</span>
                            <Lock size={14} className={s.lockIcon} />
                          </>
                        )}
                      </div>
                    ) : (
                      <Link
                        to={item.path}
                        className={`${s.menuItem} ${isActive(item.path, item.exact) ? s.active : ''}`}
                        title={collapsed ? item.label : ''}
                      >
                        <span className={s.menuIcon}>{item.icon}</span>
                        {!collapsed && <span className={s.menuLabel}>{item.label}</span>}
                        {!collapsed && isActive(item.path, item.exact) && (
                          <span className={s.activeIndicator} />
                        )}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}
