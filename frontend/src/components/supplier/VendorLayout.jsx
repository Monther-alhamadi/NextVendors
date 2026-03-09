import React, { useState } from 'react';
import SupplierSidebar from './SupplierSidebar';

export default function VendorLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="vendor-layout">
      <SupplierSidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <main className={`main-content ${collapsed ? 'collapsed' : ''}`}>
        {children}
      </main>

      <style jsx>{`
        .vendor-layout {
          min-height: 100vh;
          background: #f8fafc;
        }

        .main-content {
          margin-left: 280px;
          transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          min-height: 100vh;
        }

        .main-content.collapsed {
          margin-left: 80px;
        }

        @media (max-width: 1024px) {
          .main-content {
            margin-left: 0;
          }
          .main-content.collapsed {
            margin-left: 0;
          }
        }
      `}</style>
    </div>
  );
}
