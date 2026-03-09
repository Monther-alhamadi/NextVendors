import React from 'react';
import AdminLayout from '../components/admin/AdminLayout';
import ProtectedRoute from './ProtectedRoute';

// Helper component to wrap admin pages with AdminLayout
export default function AdminRoute({ children }) {
  return (
    <ProtectedRoute requiredRole="admin">
      <AdminLayout>
        {children}
      </AdminLayout>
    </ProtectedRoute>
  );
}
