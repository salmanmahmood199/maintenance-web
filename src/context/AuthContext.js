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
  const login = (email, password) => {
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
    
    // Get all users from localStorage
    const storedData = localStorage.getItem('maintenanceAppData');
    if (!storedData) return false;
    
    const appData = JSON.parse(storedData);
    
    // Find the user with matching email and password
    const users = Array.isArray(appData.users) ? appData.users : [];
    const foundUser = users.find(u => u.email === email && u.password === password);
    
    if (foundUser) {
      // Get additional info based on role
      let userData = { ...foundUser };
      
      // For subadmins, get their name from subAdmins collection
      if (foundUser.role === 'subadmin') {
        const subAdmins = Array.isArray(appData.subAdmins) ? appData.subAdmins : [];
        const subAdmin = subAdmins.find(sa => sa.email === email);
        if (subAdmin) {
          userData.name = subAdmin.name;
          userData.organizationId = subAdmin.organizationId;
          // Ensure all sub-admins have at least basic ticket permissions
          const ticketBasePermissions = ['subadmin.placeTicket', 'subadmin.viewTickets'];
          const existingPermissions = subAdmin.permissions || [];
          userData.permissions = [...new Set([...existingPermissions, ...ticketBasePermissions])];
          userData.userType = 'Office Staff'; // Default user type
        }
      }
      // For vendors, get their name from vendors collection
      else if (foundUser.role === 'vendor') {
        const vendors = Array.isArray(appData.vendors) ? appData.vendors : [];
        const vendor = vendors.find(v => v.email === email);
        if (vendor) {
          userData.name = vendor.name;
          userData.vendorId = vendor.id;
        }
      }
      // For technicians, get their name from technicians collection
      else if (foundUser.role === 'technician') {
        const technicians = Array.isArray(appData.technicians) ? appData.technicians : [];
        const tech = technicians.find(t => t.email === email);
        if (tech) {
          userData.name = tech.name;
          userData.technicianId = tech.id;
          userData.vendorId = tech.vendorId;
        }
      }
      
      // Save to localStorage
      localStorage.setItem('maintenanceAppUser', JSON.stringify(userData));
      setUser(userData);
      return true;
    }
    
    return false;
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('maintenanceAppUser');
    setUser(null);
  };

  // Context value
  const value = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
    loading,
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
