import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Theme
import theme from './theme';

// Context Providers
import { AuthProvider } from './context/AuthContext';
import { DataProvider } from './context/DataContext';

// Components
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './components/LoginPage';

// Pages
import RootDashboard from './pages/RootDashboard';
import Organizations from './pages/Organizations';
import OrganizationDetailRevised from './pages/OrganizationDetailRevised';
import Vendors from './pages/Vendors';
import VendorDetail from './pages/VendorDetail';
import VendorOrganizationSelect from './pages/VendorOrganizationSelect';
import VendorOrganizationDetail from './pages/VendorOrganizationDetail';
// Keeping these for backwards compatibility
import SubAdmins from './pages/SubAdmins';
import SecurityGroups from './pages/SecurityGroups';
import Locations from './pages/Locations';
import Tickets from './pages/Tickets';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <DataProvider>
          <BrowserRouter>
            <Routes>
              {/* Public route */}
              <Route path="/login" element={<LoginPage />} />
              
              {/* Protected routes */}
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <Layout>
                      <RootDashboard />
                    </Layout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/organizations" 
                element={
                  <ProtectedRoute requiredRole="root">
                    <Layout>
                      <Organizations />
                    </Layout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/organizations/:id" 
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Navigate to={(location) => {
                        const id = location.pathname.split('/').pop();
                        return `/organizations/${id}/tickets`;
                      }} replace />
                    </Layout>
                  </ProtectedRoute>
                } 
              />
              {/* Organization-specific routes */}
              <Route 
                path="/organizations/:id/subadmins" 
                element={
                  <ProtectedRoute>
                    <Layout>
                      <SubAdmins />
                    </Layout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/organizations/:id/locations" 
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Locations />
                    </Layout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/organizations/:id/vendors" 
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Vendors />
                    </Layout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/organizations/:id/tickets" 
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Tickets />
                    </Layout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/vendors" 
                element={
                  <ProtectedRoute requiredPermissions={['subadmin.addVendor', 'subadmin.manageVendors']}>
                    <Layout>
                      <Vendors />
                    </Layout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/vendors/:id" 
                element={
                  <ProtectedRoute requiredPermissions={['subadmin.addVendor', 'subadmin.manageVendors']}>
                    <Layout>
                      <VendorDetail />
                    </Layout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/vendor-dashboard" 
                element={
                  <ProtectedRoute requiredRole="vendor">
                    <Layout>
                      <VendorOrganizationSelect />
                    </Layout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/vendor-organization/:orgId" 
                element={
                  <ProtectedRoute requiredRole="vendor">
                    <Layout>
                      <VendorOrganizationDetail />
                    </Layout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/subadmins" 
                element={
                  <ProtectedRoute requiredRole="root">
                    <Layout>
                      <SubAdmins />
                    </Layout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/security-groups" 
                element={
                  <ProtectedRoute requiredRole="root">
                    <Layout>
                      <SecurityGroups />
                    </Layout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/locations" 
                element={
                  <ProtectedRoute requiredPermissions={['subadmin.addLocation', 'subadmin.assignLocation']}>
                    <Layout>
                      <Locations />
                    </Layout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/tickets" 
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Tickets />
                    </Layout>
                  </ProtectedRoute>
                } 
              />
              
              {/* Redirect root to dashboard */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </BrowserRouter>
        </DataProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
