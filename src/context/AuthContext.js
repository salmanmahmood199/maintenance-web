import React, { createContext, useState, useContext, useEffect } from 'react';

// Create context
const AuthContext = createContext();

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is logged in on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('maintenanceAppUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  // Login function - works with all users in the system
  const login = async (email, password) => {
    // Check for the root admin first
    if (email === 'root@mail.com' && password === 'admin') {
      const userData = {
        email,
        role: 'root',
        name: 'System Administrator',
      };
      
      // Save to localStorage
      localStorage.setItem('maintenanceAppUser', JSON.stringify(userData));
      setUser(userData);
      return true;
    }
    
    try {
      // Try to find user by email in MongoDB
      const apiUrl = `http://localhost:3001/api/users/login`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      if (!response.ok) {
        // If we get a non-200 response, throw an error
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }
      
      // Parse the user data
      const userData = await response.json();
      
      // For each role, get additional data if needed
      if (userData.role === 'subadmin') {
        // Get subAdmin data
        const subAdminResponse = await fetch(`http://localhost:3001/subAdmins/email/${encodeURIComponent(email)}`);
        if (subAdminResponse.ok) {
          const subAdmins = await subAdminResponse.json();
          if (subAdmins && subAdmins.length > 0) {
            const subAdmin = subAdmins[0];
            userData.name = subAdmin.name;
            userData.organizationId = subAdmin.organizationId;
            // Ensure all sub-admins have at least basic ticket permissions
            const ticketBasePermissions = ['subadmin.placeTicket', 'subadmin.viewTickets'];
            const existingPermissions = subAdmin.permissions || [];
            userData.permissions = [...new Set([...existingPermissions, ...ticketBasePermissions])];
            userData.userType = 'Office Staff'; // Default user type
          }
        }
      } 
      else if (userData.role === 'vendor') {
        // Get vendor data
        const vendorResponse = await fetch(`http://localhost:3001/vendors/email/${encodeURIComponent(email)}`);
        if (vendorResponse.ok) {
          const vendors = await vendorResponse.json();
          if (vendors && vendors.length > 0) {
            const vendor = vendors[0];
            userData.name = vendor.name;
            userData.vendorId = vendor.id;
          }
        }
      } 
      else if (userData.role === 'technician') {
        // Get technician data
        const techResponse = await fetch(`http://localhost:3001/technicians?email=${encodeURIComponent(email)}`);
        if (techResponse.ok) {
          const technicians = await techResponse.json();
          if (technicians && technicians.length > 0) {
            const tech = technicians[0];
            userData.name = tech.name;
            userData.technicianId = tech.id;
            userData.vendorId = tech.vendorId;
          }
        }
      }
      
      // Save user data to local storage
      localStorage.setItem('maintenanceAppUser', JSON.stringify(userData));
      setUser(userData);
      return userData;
    } catch (error) {
      console.log('Login error:', error);
      return false;
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('maintenanceAppUser');
    setUser(null);
  };

  // Check if user has a specific permission
  const hasPermission = (permissionId) => {
    if (!user) return false;
    
    // Root admin has all permissions
    if (user.role === 'root') return true;
    
    // For subadmins, check their permissions array
    if (user.role === 'subadmin' && Array.isArray(user.permissions)) {
      return user.permissions.includes(permissionId);
    }
    
    return false;
  };
  
  // Check if user has any of the specified permissions
  const hasAnyPermission = (permissionIds) => {
    if (!Array.isArray(permissionIds) || permissionIds.length === 0) return false;
    
    return permissionIds.some(permissionId => hasPermission(permissionId));
  };
  
  // Check if user has all of the specified permissions
  const hasAllPermissions = (permissionIds) => {
    if (!Array.isArray(permissionIds) || permissionIds.length === 0) return false;
    
    return permissionIds.every(permissionId => hasPermission(permissionId));
  };
  
  // Context value
  const value = {
    user,
    loading,
    login,
    logout,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
