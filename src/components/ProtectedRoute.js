import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, requiredPermissions = [], requiredRole = null }) => {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  // Show nothing while checking authentication status
  if (loading) {
    return null;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // Root/admin users have full access to everything
  if (user?.role === 'root') {
    return children;
  }
  
  // Check if specific role is required
  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/dashboard" replace />;
  }
  
  // For permission-based access (applies mainly to subadmins)
  if (requiredPermissions.length > 0 && user?.role === 'subadmin') {
    // Check if user has at least one of the required permissions
    const hasRequiredPermission = requiredPermissions.some(permission => 
      user.permissions && user.permissions.includes(permission)
    );
    
    if (!hasRequiredPermission) {
      // Redirect to dashboard if user doesn't have required permissions
      return <Navigate to="/dashboard" replace />;
    }
  }

  // Render children if all checks pass
  return children;
};

export default ProtectedRoute;
