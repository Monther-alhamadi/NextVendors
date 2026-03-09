import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Search, Package, ShoppingCart, Users, UserCheck, Settings, 
  FileText, ArrowLeftRight, LifeBuoy, Megaphone, Banknote, Undo2
} from 'lucide-react';
import styles from './CommandPalette.module.css';

const adminActions = [
  { id: 'dashboard', title: 'Dashboard', desc: 'Overview and analytics', path: '/admin', icon: <Search size={20} />, group: 'Overview' },
  { id: 'products', title: 'Manage Products', desc: 'Add, edit, or delete products', path: '/admin/products', icon: <Package size={20} />, group: 'Commerce' },
  { id: 'orders', title: 'Manage Orders', desc: 'View and fulfill customer orders', path: '/admin/orders', icon: <ShoppingCart size={20} />, group: 'Commerce' },
  { id: 'import', title: 'Import Products', desc: 'Bulk import from Excel/CSV', path: '/admin/import', icon: <FileText size={20} />, group: 'Commerce' },
  
  { id: 'users', title: 'Manage Users', desc: 'View customers and accounts', path: '/admin/users', icon: <Users size={20} />, group: 'Users' },
  { id: 'vendors', title: 'Vendor Approvals', desc: 'Approve or reject new sellers', path: '/admin/vendors', icon: <UserCheck size={20} />, group: 'Users' },
  
  { id: 'support', title: 'Helpdesk & Complaints', desc: 'Resolve user tickets', path: '/admin/support', icon: <LifeBuoy size={20} />, group: 'Support' },
  { id: 'broadcast', title: 'Send Broadcast', desc: 'Send notifications to users', path: '/admin/broadcast', icon: <Megaphone size={20} />, group: 'Support' },
  
  { id: 'ledger', title: 'Financial Ledger', desc: 'View platform transactions', path: '/admin/ledger', icon: <Banknote size={20} />, group: 'Finance' },
  { id: 'payouts', title: 'Vendor Payouts', desc: 'Manage withdrawal requests', path: '/admin/payouts', icon: <ArrowLeftRight size={20} />, group: 'Finance' },
  { id: 'rma', title: 'Returns (RMA)', desc: 'Manage refund requests', path: '/admin/rma', icon: <Undo2 size={20} />, group: 'Finance' },
  
  { id: 'settings', title: 'System Settings', desc: 'Global configurations', path: '/admin/settings', icon: <Settings size={20} />, group: 'System' }
];

export default function CommandPalette({ isOpen, onClose }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  // Filter actions based on search
  const filteredActions = query === '' 
    ? adminActions 
    : adminActions.filter((action) => 
        action.title.toLowerCase().includes(query.toLowerCase()) || 
        action.desc.toLowerCase().includes(query.toLowerCase()) ||
        action.group.toLowerCase().includes(query.toLowerCase())
      );

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredActions.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredActions.length) % filteredActions.length);
      } else if (e.key === 'Enter' && filteredActions.length > 0) {
        e.preventDefault();
        handleSelect(filteredActions[selectedIndex]);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredActions, selectedIndex, onClose]);

  const handleSelect = (action) => {
    navigate(action.path);
    onClose();
  };

  if (!isOpen) return null;

  // Group filtered results
  const groupedResults = filteredActions.reduce((acc, action) => {
    if (!acc[action.group]) acc[action.group] = [];
    acc[action.group].push(action);
    return acc;
  }, {});

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.palette} onClick={(e) => e.stopPropagation()}>
        <div className={styles.searchHeader}>
          <Search size={22} className={styles.searchIcon} />
          <input
            ref={inputRef}
            type="text"
            className={styles.searchInput}
            placeholder={t('admin.search_commands', 'ابحث بكلمة مفتاحية للحصول على أوامر النظام...')}
            value={query}
            onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
            }}
          />
          <span className={styles.searchShortcut}>ESC</span>
        </div>

        <div className={styles.resultsArea}>
          {filteredActions.length === 0 ? (
            <div className={styles.emptyState}>
              <Search size={40} opacity={0.3} />
              <p>لا توجد نتائج مطابقة لبحثك.</p>
            </div>
          ) : (
            Object.entries(groupedResults).map(([group, actions]) => (
              <div key={group}>
                <div className={styles.groupTitle}>{group}</div>
                {actions.map((action) => {
                  const globalIndex = filteredActions.indexOf(action);
                  return (
                    <div
                      key={action.id}
                      className={`${styles.resultItem} ${selectedIndex === globalIndex ? styles.selected : ''}`}
                      onClick={() => handleSelect(action)}
                      onMouseEnter={() => setSelectedIndex(globalIndex)}
                    >
                      <div className={styles.itemIcon}>{action.icon}</div>
                      <div className={styles.itemInfo}>
                        <div className={styles.itemTitle}>{action.title}</div>
                        <div className={styles.itemDesc}>{action.desc}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>
        
        <div className={styles.footer}>
            <span><span className={styles.kbd}>↑</span> <span className={styles.kbd}>↓</span> للتنقل</span>
            <span><span className={styles.kbd}>↵</span> للاختيار</span>
            <span><span className={styles.kbd}>ESC</span> للإغلاق</span>
        </div>
      </div>
    </div>
  );
}
