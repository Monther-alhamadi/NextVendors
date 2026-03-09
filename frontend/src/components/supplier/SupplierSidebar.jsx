import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Lock } from 'lucide-react';

export default function SupplierSidebar({ vendorPlan = 'basic', collapsed, setCollapsed }) {
  const { t } = useTranslation();
  const location = useLocation();

  const menuGroups = [
    {
      title: t('vendor.overview', 'Overview'),
      items: [
        { path: '/supplier', icon: '📊', label: t('vendor.dashboard', 'Dashboard'), exact: true },
        { path: '/supplier/analytics', icon: '📈', label: t('vendor.analytics', 'Analytics') }
      ]
    },
    {
      title: t('vendor.products', 'Products'),
      items: [
        { path: '/supplier/products', icon: '📦', label: t('vendor.my_products', 'My Products') },
        { path: '/supplier/products/add', icon: '➕', label: t('vendor.add_product', 'Add Product') },
        { path: '/supplier/reviews', icon: '⭐', label: t('vendor.reviews', 'Reviews') }
      ]
    },
    {
      title: t('vendor.financial', 'Financial'),
      items: [
        { path: '/supplier/wallet', icon: '💰', label: t('vendor.wallet', 'Wallet') },
        { path: '/supplier/payouts', icon: '💸', label: t('vendor.payout_requests', 'Payout Requests') },
        { 
          path: '/supplier/affiliate', 
          icon: '🤝', 
          label: t('vendor.affiliate_program', 'Affiliate Program'),
          locked: vendorPlan === 'basic',
          tooltip: t('vendor.upgrade_to_pro', 'Upgrade to Pro Plan')
        }
      ]
    },
    {
      title: t('vendor.operations', 'Operations'),
      items: [
        { path: '/supplier/orders', icon: '🧾', label: t('vendor.orders', 'Orders') },
        { path: '/supplier/shipping', icon: '🚚', label: t('vendor.shipping', 'Shipping') },
        { path: '/supplier/coupons', icon: '🎟️', label: t('vendor.coupons', 'Coupons') }
      ]
    },
    {
      title: t('vendor.settings', 'Settings'),
      items: [
        { path: '/supplier/store', icon: '🏪', label: t('vendor.store_settings', 'Store Settings') },
        { path: '/supplier/plans', icon: '📋', label: t('vendor.subscription', 'Subscription') }
      ]
    }
  ];

  const isActive = (path, exact = false) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Mobile Overlay */}
      {!collapsed && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setCollapsed(true)}
        />
      )}

      <aside className={`supplier-sidebar ${collapsed ? 'collapsed' : ''}`}>
        {/* Header */}
        <div className="sidebar-header">
          <div className="logo">
            <span className="logo-icon">🏭</span>
            {!collapsed && <span className="logo-text">{t('vendor.vendor_panel', 'Vendor Panel')}</span>}
          </div>
          <button 
            className="collapse-btn"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <span>{collapsed ? '→' : '←'}</span>
          </button>
        </div>

        {/* Return to Site Link */}
        {!collapsed && (
          <div className="return-to-site">
            <Link to="/" className="return-link">
              <span>🏠</span>
              <span>{t('admin.return_to_site', 'Return to Site')}</span>
            </Link>
          </div>
        )}

        {/* Navigation */}
        <nav className="nav">
          {menuGroups.map((group, groupIdx) => (
            <div key={groupIdx} className="menu-group">
              {!collapsed && (
                <div className="group-title">
                  {group.title}
                </div>
              )}
              <ul className="menu-list">
                {group.items.map((item) => (
                  <li key={item.path}>
                    {item.locked ? (
                      <div className="menu-item locked" title={item.tooltip}>
                        <span className="menu-icon">{item.icon}</span>
                        {!collapsed && (
                          <>
                            <span className="menu-label">{item.label}</span>
                            <Lock size={14} className="lock-icon" />
                          </>
                        )}
                      </div>
                    ) : (
                      <Link
                        to={item.path}
                        className={`menu-item ${isActive(item.path, item.exact) ? 'active' : ''}`}
                        title={collapsed ? item.label : ''}
                      >
                        <span className="menu-icon">{item.icon}</span>
                        {!collapsed && <span className="menu-label">{item.label}</span>}
                        {!collapsed && isActive(item.path, item.exact) && (
                          <span className="active-indicator" />
                        )}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <style jsx>{`
          .supplier-sidebar {
            position: fixed;
            left: 0;
            top: 0;
            bottom: 0;
            width: 280px;
            background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
            border-right: 1px solid #e2e8f0;
            display: flex;
            flex-direction: column;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            z-index: 50;
            box-shadow: 2px 0 8px rgba(0, 0, 0, 0.05);
          }

          .supplier-sidebar.collapsed {
            width: 80px;
          }

          @media (max-width: 1024px) {
            .supplier-sidebar {
              transform: translateX(-100%);
            }
            .supplier-sidebar:not(.collapsed) {
              transform: translateX(0);
            }
          }

          .sidebar-header {
            padding: 1.5rem;
            border-bottom: 1px solid #e2e8f0;
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);
            color: white;
          }

          .logo {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            flex: 1;
          }

          .logo-icon {
            font-size: 1.75rem;
          }

          .logo-text {
            font-weight: 700;
            font-size: 1.1rem;
            white-space: nowrap;
          }

          .collapse-btn {
            background: rgba(255, 255, 255, 0.2);
            border: none;
            width: 32px;
            height: 32px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.2s;
            color: white;
          }

          .collapse-btn:hover {
            background: rgba(255, 255, 255, 0.3);
          }

          .return-to-site {
            padding: 1rem;
            border-bottom: 1px solid #e2e8f0;
          }

          .return-link {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 0.75rem 1rem;
            border-radius: 0.75rem;
            background: #f1f5f9;
            text-decoration: none;
            color: #475569;
            font-weight: 600;
            transition: all 0.2s;
          }

          .return-link:hover {
            background: #e2e8f0;
            color: #1e293b;
          }

          .nav {
            flex: 1;
            overflow-y: auto;
            padding: 1rem 0;
          }

          .menu-group {
            margin-bottom: 1.5rem;
          }

          .group-title {
            font-size: 0.75rem;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #94a3b8;
            padding: 0 1.5rem;
            margin-bottom: 0.5rem;
          }

          .menu-list {
            list-style: none;
            padding: 0;
            margin: 0;
          }

          .menu-item {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 0.75rem 1.5rem;
            text-decoration: none;
            color: #475569;
            font-weight: 500;
            transition: all 0.2s;
            position: relative;
            cursor: pointer;
          }

          .menu-item:hover {
            background: #f1f5f9;
            color: #1e293b;
          }

          .menu-item.active {
            background: linear-gradient(90deg, #ede9fe 0%, transparent 100%);
            color: #6366f1;
            font-weight: 700;
          }

          .menu-item.locked {
            color: #cbd5e1;
            cursor: not-allowed;
            opacity: 0.6;
          }

          .menu-icon {
            font-size: 1.25rem;
            flex-shrink: 0;
          }

          .menu-label {
            flex: 1;
            white-space: nowrap;
          }

          .lock-icon {
            color: #f59e0b;
            flex-shrink: 0;
          }

          .active-indicator {
            position: absolute;
            right: 0;
            top: 50%;
            transform: translateY(-50%);
            width: 4px;
            height: 24px;
            background: #6366f1;
            border-radius: 4px 0 0 4px;
          }

          .supplier-sidebar.collapsed .menu-item {
            justify-content: center;
            padding: 0.75rem;
          }

          .supplier-sidebar.collapsed .lock-icon {
            position: absolute;
            top: 4px;
            right: 4px;
            width: 12px;
            height: 12px;
          }
        `}</style>
      </aside>
    </>
  );
}
