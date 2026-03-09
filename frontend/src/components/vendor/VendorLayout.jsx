import React, { useState } from 'react';
import VendorSidebar from './VendorSidebar';
import VendorHeader from './VendorHeader';
import s from './VendorLayout.module.css';

export default function VendorLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={s.layout}>
      <VendorSidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <main className={`${s.mainContent} ${collapsed ? s.collapsed : ''}`}>
        <VendorHeader collapsed={collapsed} setCollapsed={setCollapsed} />
        <div className={s.pageContent}>
          {children}
        </div>
      </main>
    </div>
  );
}
