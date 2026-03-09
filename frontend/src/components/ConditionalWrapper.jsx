import React from 'react';
import { useLocation } from 'react-router-dom';

export default function ConditionalWrapper({ children }) {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  
  return (
    <>
      {children({ isAdminRoute })}
    </>
  );
}
