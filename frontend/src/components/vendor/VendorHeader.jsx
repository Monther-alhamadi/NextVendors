import React from 'react';
import { useAuth } from '../../store/authStore';
import { Link } from 'react-router-dom';
import s from './VendorHeader.module.css';
import { Bell, Search, Menu } from 'lucide-react';

export default function VendorHeader({ collapsed, setCollapsed }) {
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
          <input type="text" placeholder="ابحث في المتجر..." className={s.searchInput} />
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
            <span className={s.userRole}>بائع</span>
          </div>
        </Link>
      </div>
    </header>
  );
}
