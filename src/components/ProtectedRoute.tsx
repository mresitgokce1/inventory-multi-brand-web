import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('ADMIN' | 'MANAGER')[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedRoles = ['ADMIN', 'MANAGER'] 
}) => {
  const { user, isHydrating, isAuthenticated } = useAuth();
  const location = useLocation();

  // Show loading state while hydrating - no redirects during this phase
  if (isHydrating()) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // After hydration, check authentication status
  if (!isAuthenticated()) {
    // Preserve the intended path in location state
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role-based access
  // ADMIN should be allowed even if user.brand_id is null
  if (user && !allowedRoles.includes(user.role)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;