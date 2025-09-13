import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { hasRoleAccess, normalizeRole } from '../utils/roles';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedRoles = ['ADMIN', 'BRAND_MANAGER', 'MANAGER'] // Updated defaults 
}) => {
  const { user} = useAuth();
  const location = useLocation();
  // Check role-based access using normalized roles
  // ADMIN should be allowed even if user.brand_id is null
  if (user && !hasRoleAccess(user.role, allowedRoles)) {
    // Development diagnostic logging
    if (import.meta.env.DEV) {
      console.warn('ProtectedRoute Access Denied:', {
        route: location.pathname,
        userRole: {
          raw: user.role,
          normalized: normalizeRole(user.role)
        },
        allowedRoles: allowedRoles,
        normalizedAllowedRoles: allowedRoles.map(role => normalizeRole(role)),
        brandId: user.brand_id,
        userId: user.id
      });
    }

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