import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../store/authStore.jsx";

export default function ProtectedRoute({ children, requiredRole = null, requiredPermission = null }) {

  // Allow an explicit opt-in bypass for E2E tests or local debugging.
  const search = typeof window !== "undefined" ? window.location.search : "";
  const e2eBypass =
    search.includes("e2e_bypass_auth=1") ||
    (import.meta &&
      import.meta.env &&
      import.meta.env.VITE_DISABLE_AUTH === "1");
      
  if (e2eBypass) {
    return children;
  }

  const { accessToken, user, isLoading, hasPermission } = useAuth();

  if (isLoading) {
     return (
       <div className="flex items-center justify-center min-h-screen">
         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
       </div>
     );
  }

  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }

  if (accessToken && !user) {
    return <div className="p-10 text-center font-bold text-slate-400">Loading Profile...</div>;
  }

  // Role check
  if (requiredRole && !(user && user.role === requiredRole)) {
    return <Navigate to="/" replace />;
  }

  // Permission check
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
