import React from 'react';
import { useTranslation } from "react-i18next";
import { useAuth } from '../../store/authStore';
import { Link } from 'react-router-dom';
import s from './VendorHeader.module.css';
import { Bell, Search, Menu } from 'lucide-react';

export default function VendorHeader({ collapsed, setCollapsed }) {
  const { t } = useTranslation();
  const { user } = useAuth();

  return (
    <header className={s.header}>
      <div className={s.left}>
        <button 
          className={s.menuBtn}
          onClick={() => setCollapsed(!collapsed)}
          aria-label="Toggle Menu"
        >
          <Menu size={20} />
        </button>
        <div className={s.searchBox}>
          <Search size={18} className={s.searchIcon} />
          <input 
            type="text" 
            placeholder={t('common.search_store_ph', 'ابحث في المتجر...')} 
            className={s.searchInput} 
          />
        </div>
      </div>

      <div className={s.right}>
        <button className={s.iconBtn}>
          <Bell size={20} />
          <span className={s.badge}>3</span>
        </button>

        <div className={s.divider}></div>

        <Link to="/vendor/settings" className={s.profileLink}>
          <div className={s.avatar}>
            {user?.name?.charAt(0) || 'V'}
          </div>
          <div className={s.userInfo}>
            <span className={s.userName}>{user?.name}</span>
            <span className={s.userRole}>{t('common.vendor_role', 'بائع')}</span>
          </div>
        </Link>
      </div>
    </header>
  );
}
