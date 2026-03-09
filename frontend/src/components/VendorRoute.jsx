import React from 'react';
import VendorLayout from './vendor/VendorLayout';
import ProtectedRoute from './ProtectedRoute';

// Helper component to wrap vendor pages with VendorLayout
export default function VendorRoute({ children }) {
  // We can add specific vendor role checks here if needed, 
  // but ProtectedRoute can handle the basic role check if passed requiredRole="vendor" exists.
  // Currently ProtectedRoute checks for general authentication. 
  // We might want to enforce vendor role here or relies on the page to handle unauthorized access (like SupplierDashboard does).
  
  return (
    <ProtectedRoute>
      <VendorLayout>
        {children}
      </VendorLayout>
    </ProtectedRoute>
  );
}
