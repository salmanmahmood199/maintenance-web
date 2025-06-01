import React from 'react';
import { useAuth } from '../context/AuthContext';

/**
 * PermissionGuard component to conditionally render UI elements based on user permissions
 * 
 * @param {string|array} permissions - Required permission(s) to view the content
 * @param {boolean} requireAll - If true, requires all permissions when an array is provided (default: false)
 * @param {React.ReactNode} children - The content to render if user has permission
 * @param {React.ReactNode} fallback - Optional fallback content to render if user doesn't have permission
 * @returns {React.ReactNode}
 */
const PermissionGuard = ({ 
  permissions, 
  requireAll = false, 
  children, 
  fallback = null 
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions, user } = useAuth();
  
  // Check if user has the required permissions
  const hasAccess = () => {
    // If user is root, they always have access
    if (user?.role === 'root') return true;
    
    // If no permissions required, everyone has access
    if (!permissions) return true;
    
    if (typeof permissions === 'string') {
      return hasPermission(permissions);
    }
    
    if (Array.isArray(permissions)) {
      return requireAll 
        ? hasAllPermissions(permissions) 
        : hasAnyPermission(permissions);
    }
    
    return false;
  };
  
  // Render children if user has access, otherwise render fallback or null
  return hasAccess() ? children : fallback;
};

export default PermissionGuard;
