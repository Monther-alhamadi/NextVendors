import React, { useState, useEffect } from 'react';
import { useAuth } from '../../store/authStore';
import AdminSidebar from './AdminSidebar';
import CommandPalette from './CommandPalette';
import { Menu, Search, Bell, Settings } from 'lucide-react';
import styles from './AdminLayout.module.css';

export default function AdminLayout({ children }) {
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className={styles.adminLayout}>
      <AdminSidebar 
        isMobileOpen={mobileMenuOpen} 
        setMobileOpen={setMobileMenuOpen} 
      />
      
      <main className={styles.mainContent}>
        {/* Top Header */}
        <header className={styles.header}>
            <div className={styles.headerLeft}>
                <button 
                  className={styles.menuToggle} 
                  onClick={() => setMobileMenuOpen(true)}
                >
                  <Menu size={24} />
                </button>
                <div className={styles.searchBar} onClick={() => setCommandPaletteOpen(true)} style={{cursor: 'pointer'}}>
                    <Search size={18} />
                    <span style={{flex: 1, color: 'var(--text-muted)'}}>ابحث في النظام...</span>
                    <span className={styles.searchShortcut}>Ctrl+K</span>
                </div>
            </div>
            
            <div className={styles.headerRight}>
                <button className={styles.iconBtn}>
                    <Bell size={20} />
                    <span className={styles.badge}>3</span>
                </button>
                <div className={styles.adminProfile}>
                    <div className={styles.adminInfo}>
                        <span className={styles.adminName}>{user?.name || 'مدير النظام'}</span>
                        <span className={styles.adminRole}>Administrator</span>
                    </div>
                    <div className={styles.adminAvatar}>
                        {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
                    </div>
                </div>
            </div>
        </header>

        <div className={styles.contentInner}>
            {children}
        </div>
      </main>
      
      <CommandPalette 
        isOpen={commandPaletteOpen} 
        onClose={() => setCommandPaletteOpen(false)} 
      />
    </div>
  );
}
