import React, { useState, useEffect } from 'react';
import { 
  AppBar, 
  Box, 
  CssBaseline, 
  Divider, 
  Drawer, 
  IconButton, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  Toolbar, 
  Typography, 
  Button,
  useMediaQuery,
  useTheme,
  Collapse,
  Tooltip
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Business as BusinessIcon,
  Group as GroupIcon,
  Person as PersonIcon,
  Security as SecurityIcon,
  LocationOn as LocationIcon,
  AssignmentLate as TicketIcon,
  ExitToApp as LogoutIcon,
  Home as HomeIcon,
  StorefrontOutlined as VendorIcon,
  ReceiptLong as InvoiceIcon,
  CategoryOutlined as IssueTypeIcon,
  LockOutlined as NoAccessIcon
} from '@mui/icons-material';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import PermissionGuard from './PermissionGuard';
import { menuPermissionMap } from '../utils/permissionUtils';

// Drawer width
const drawerWidth = 240;

const Layout = ({ children }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { getOrganization } = useData();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const params = useParams();
  
  // State for mobile drawer
  const [mobileOpen, setMobileOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [inOrgContext, setInOrgContext] = useState(false);

  // Toggle drawer
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  // Check if we're in an organization context based on URL
  useEffect(() => {
    const orgId = params.id; // From /organizations/:id
    if (orgId) {
      const org = getOrganization(orgId);
      setSelectedOrg(org);
      setInOrgContext(true);
    } else {
      setInOrgContext(false);
    }
  }, [params, location.pathname, getOrganization]);
  
  // Always visible root navigation items
  const rootNavItems = [
    { text: 'Home', icon: <HomeIcon />, path: '/dashboard' },
    { text: 'Organizations', icon: <BusinessIcon />, path: '/organizations' },
    { text: 'Vendors', icon: <VendorIcon />, path: '/vendors' }
  ];
  
  // Organization menu items - these should align with tabs
  const orgContextNavItems = [
    { 
      text: 'Overview', 
      icon: <DashboardIcon />, 
      path: `/organizations/${params.id}`,
      tabIndex: 0, // Maps to the Overview tab
      permissionKey: 'org.overview' // Available to all authenticated users
    },
    { 
      text: 'Sub-Admins', 
      icon: <PersonIcon />, 
      path: `/organizations/${params.id}/subadmins`,
      tabIndex: 1, // Maps to the SUB-ADMINS tab
      permissionKey: 'org.subadmins' // Requires user management permissions
    },
    { 
      text: 'Locations', 
      icon: <LocationIcon />, 
      path: `/organizations/${params.id}/locations`,
      tabIndex: 2, // Maps to the LOCATIONS tab
      permissionKey: 'org.locations' // Requires location management permissions
    },
    { 
      text: 'Vendors', 
      icon: <VendorIcon />, 
      path: `/organizations/${params.id}/vendors`,
      tabIndex: 3, // Maps to the VENDORS tab
      permissionKey: 'org.vendors' // Requires vendor management permissions
    },
    { 
      text: 'Tickets', 
      icon: <TicketIcon />, 
      path: `/organizations/${params.id}/tickets`,
      tabIndex: 4, // Maps to the TICKETS tab
      permissionKey: 'org.tickets' // Requires ticket permissions
    },
    { 
      text: 'Issue Types', 
      icon: <IssueTypeIcon />, 
      path: `/organizations/${params.id}/issues`,
      tabIndex: 5, // Maps to the ISSUE TYPES tab
      permissionKey: 'org.issues' // Requires issue type management permissions
    },
    { 
      text: 'Invoices', 
      icon: <InvoiceIcon />, 
      path: `/organizations/${params.id}/invoices`,
      tabIndex: 6, // Maps to the INVOICES tab
      permissionKey: 'org.invoices' // Requires invoice permissions
    }
  ];

  // Handle navigate and close drawer (for mobile)
  const handleNavigate = (path, tabIndex = null) => {
    // For organization tabs, save the tab index in localStorage
    if (tabIndex !== null) {
      localStorage.setItem('orgDetailTab', tabIndex);
    }
    
    // Navigate to the path
    navigate(path);
    
    // Close mobile drawer if on mobile
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  // Handle logout
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Drawer content
  const drawerContent = (
    <>
      <Toolbar>
        <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => handleNavigate('/dashboard')}>
          <img src="/images/byzpal-logo.svg" alt="BYZPAL" height="40" />
        </Box>
      </Toolbar>
      <Divider />
      <List>
        {/* Always visible root navigation */}
        {rootNavItems.map((item) => {
          // Check permissions for this menu item
          const requiredPermissions = menuPermissionMap[item.path] || [];
          
          return (
            <PermissionGuard
              key={item.text}
              permissions={requiredPermissions}
              requireAll={false}
              fallback={null}
            >
              <ListItem 
                button 
                key={item.text} 
                onClick={() => handleNavigate(item.path)}
                selected={location.pathname === item.path}
                sx={{
                  '&.Mui-selected': {
                    backgroundColor: theme.palette.action.selected,
                  }
                }}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItem>
            </PermissionGuard>
          );
        })}
        
        {/* Organization context menu - aligns with tabs */}
        {inOrgContext && (
          <>
            <Divider sx={{ my: 1 }} />
            <ListItem>
              <Typography variant="subtitle2" color="text.secondary">
                ORGANIZATION MENU
              </Typography>
            </ListItem>
            
            {orgContextNavItems.map((item) => {
              // Get required permissions for this menu item
              const requiredPermissions = menuPermissionMap[item.permissionKey] || [];
              
              return (
                <PermissionGuard
                  key={item.text}
                  permissions={requiredPermissions}
                  requireAll={false}
                  fallback={null}
                >
                  <ListItem 
                    button 
                    key={item.text} 
                    onClick={() => handleNavigate(item.path, item.tabIndex)}
                    selected={location.pathname === item.path}
                    sx={{
                      '&.Mui-selected': {
                        backgroundColor: theme.palette.action.selected,
                      }
                    }}
                  >
                    <ListItemIcon>{item.icon}</ListItemIcon>
                    <ListItemText primary={item.text} />
                  </ListItem>
                </PermissionGuard>
              );
            })}
          </>
        )}
      </List>
    </>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', flexGrow: 1 }} onClick={() => handleNavigate('/dashboard')}>
            <img src="/images/byzpal-logo.svg" alt="BYZPAL" height="40" />
            <Typography variant="h6" noWrap component="div" sx={{ ml: 1 }}>
              {rootNavItems.find(item => location.pathname === item.path)?.text || 
                (location.pathname.includes('/organizations/') ? 'Organization Details' : '')}
            </Typography>
          </Box>
          
          {user && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="body2" sx={{ mr: 2, display: { xs: 'none', sm: 'block' } }}>
                {user.email}
              </Typography>
              <Button 
                color="inherit" 
                startIcon={<LogoutIcon />}
                onClick={handleLogout}
              >
                Logout
              </Button>
            </Box>
          )}
        </Toolbar>
      </AppBar>
      
      {/* Drawer for mobile */}
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant={isMobile ? "temporary" : "permanent"}
          open={isMobile ? mobileOpen : true}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile
          }}
          sx={{
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawerContent}
        </Drawer>
      </Box>
      
      {/* Main content */}
      <Box
        component="main"
        sx={{ 
          flexGrow: 1, 
          p: 3, 
          width: { sm: `calc(100% - ${drawerWidth}px)` }, 
          marginTop: '64px',
          minHeight: 'calc(100vh - 64px)' 
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default Layout;
