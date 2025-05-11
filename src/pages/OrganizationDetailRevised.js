import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  Button,
  IconButton,
  Breadcrumbs,
  Link,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ListItemText,
  FormHelperText,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Rating,
  Divider,
  Checkbox,
  Grid,
  Tooltip
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Person as PersonIcon,
  Security as SecurityIcon,
  LocationOn as LocationIcon,
  Build as VendorIcon,
  AssignmentLate as TicketIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { useData } from '../context/DataContext';

// Tab Panel component
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`org-tabpanel-${index}`}
      aria-labelledby={`org-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const OrganizationDetailRevised = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { 
    data,
    getOrganization, 
    getSubAdmins, 
    getSecurityGroups,
    getLocations,
    getTickets,
    getVendors,
    addSubAdmin,
    addLocation,
    updateVendor,
    isEmailUnique,
    isPhoneUnique,
    isPasswordStrong
  } = useData();

  // User role templates with predefined permissions
  const userRoleTemplates = [
    {
      name: 'Property Manager',
      description: 'Can place and view tickets, manage locations',
      permissions: ['subadmin.placeTicket', 'subadmin.viewTickets', 'subadmin.addLocation', 'subadmin.assignLocation']
    },
    {
      name: 'Maintenance Coordinator',
      description: 'Can place, accept and assign tickets to vendors',
      permissions: ['subadmin.placeTicket', 'subadmin.viewTickets', 'subadmin.acceptTicket']
    },
    {
      name: 'Vendor Manager',
      description: 'Can manage vendors and their tiers',
      permissions: ['subadmin.viewTickets', 'subadmin.manageVendors']
    },
    {
      name: 'Accounting',
      description: 'Can review and approve invoices',
      permissions: ['subadmin.viewTickets', 'subadmin.acceptInvoice']
    },
    {
      name: 'Custom Role',
      description: 'Select individual permissions',
      permissions: [] // No default permissions
    }
  ];
  
  // Fallback list of permissions in case data.availablePermissions is not available
  const defaultPermissions = [
    { id: 'subadmin.placeTicket', description: 'Create a new maintenance ticket: fill in location, issue type, description, upload media, and submit it.' },
    { id: 'subadmin.acceptTicket', description: 'Pick up ("accept") an unassigned ticket at Tier 1: you see New tickets and can assign them to vendors.' },
    { id: 'subadmin.tier2AcceptTicket', description: 'Accept or reassign tickets that have escalated past Tier 1 (i.e. Tier 2 queue).' },
    { id: 'subadmin.tier3AcceptTicket', description: 'Accept or reassign tickets that have escalated past Tier 2 (i.e. Tier 3 queue).' },
    { id: 'subadmin.addVendor', description: 'Add a new vendor record to the org: enter name, email, phone, password, and link them to one/multiple orgs.' },
    { id: 'subadmin.addIssueType', description: 'Extend the "Type of Issue" lookup: add new categories like "Elevator" or "Electrical."' },
    { id: 'subadmin.acceptInvoice', description: 'Review and approve a vendor-generated invoice before it goes to accounts payable.' },
    { id: 'subadmin.addLocation', description: 'Create new locations (stores/sites) under the org: set name, address, contact info.' },
    { id: 'subadmin.assignLocation', description: 'Assign users (managers or sub-admins) to one or more locations so they can place/see tickets there.' },
    { id: 'subadmin.verifyJobCompleted', description: 'After a tech marks "Completed," verify the work order and close out the ticket.' },
    { id: 'subadmin.manageVendors', description: 'Adjust vendor tier/level, approve vendors, change which orgs they can serve.' }
  ];
  
  // Get available permissions (from data or fallback)
  const availablePermissions = data?.availablePermissions || defaultPermissions;

  // Get organization info
  const organization = getOrganization(id);

  // Check for stored tab value from localStorage (synced with sidebar navigation)
  const getInitialTab = () => {
    // Check URL path to determine active tab
    if (window.location.pathname.includes('/subadmins')) return 1;
    if (window.location.pathname.includes('/locations')) return 2;
    if (window.location.pathname.includes('/vendors')) return 3;
    if (window.location.pathname.includes('/tickets')) return 4;
    
    // If no URL path match, check localStorage
    const savedTab = localStorage.getItem('orgDetailTab');
    return savedTab ? parseInt(savedTab, 10) : 0;
  };

  // States
  const [value, setValue] = useState(getInitialTab);
  const [subAdminDialog, setSubAdminDialog] = useState(false);
  const [locationDialog, setLocationDialog] = useState(false);
  const [vendorDialog, setVendorDialog] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [vendorForm, setVendorForm] = useState({
    tier: 1,
    status: 'active'
  });
  
  // Vendor filtering state
  const [vendorFilter, setVendorFilter] = useState('all'); // 'all', 'active', or 'inactive'

  // Form errors
  const [formErrors, setFormErrors] = useState({});

  // State for the sub-admin form
  const [subAdminForm, setSubAdminForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: '', // Added role field
    permissions: []
  });

  // State for the location form
  const [locationForm, setLocationForm] = useState({
    name: '',
    address: ''
  });

  // Fetch vendors for this organization using the getVendors function
  const organizationVendors = getVendors(id) || [];

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setValue(newValue);

    // Store selected tab in localStorage to sync with sidebar
    localStorage.setItem('orgDetailTab', newValue);

    // Navigate to appropriate URL based on tab
    switch (newValue) {
      case 0: // Overview
        navigate(`/organizations/${id}`);
        break;
      case 1: // Sub-Admins
        navigate(`/organizations/${id}/subadmins`);
        break;
      case 2: // Locations
        navigate(`/organizations/${id}/locations`);
        break;
      case 3: // Vendors
        navigate(`/organizations/${id}/vendors`);
        break;
      case 4: // Tickets
        navigate(`/organizations/${id}/tickets`);
        break;
      default:
        break;
    }
  };

  // Handle input change for the sub-admin form
  const handleSubAdminInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'role') {
      // If role is changed, update permissions based on selected role
      const selectedRole = userRoleTemplates.find(role => role.name === value);
      const rolePermissions = selectedRole ? selectedRole.permissions : [];
      
      setSubAdminForm(prev => ({
        ...prev,
        role: value,
        permissions: value === 'Custom Role' ? prev.permissions : rolePermissions
      }));
    } else if (type === 'checkbox' && name === 'permissions') {
      // Handle permission checkbox changes
      handlePermissionChange(e);
    } else {
      // Handle other form fields
      setSubAdminForm(prev => ({ ...prev, [name]: value }));
    }
    
    // Clear errors
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Handle permission checkbox change
  const handlePermissionChange = (e) => {
    const { value, checked } = e.target;
    
    // When a role is selected, don't allow changing permissions directly
    // except for 'Custom Role'
    if (subAdminForm.role && subAdminForm.role !== 'Custom Role') {
      return;
    }
    
    setSubAdminForm(prev => {
      // Ensure prev.permissions is an array
      const currentPermissions = Array.isArray(prev.permissions) ? prev.permissions : [];
      
      if (checked) {
        // Add the permission if it's not already in the array
        return {
          ...prev,
          permissions: currentPermissions.includes(value) ? currentPermissions : [...currentPermissions, value]
        };
      } else {
        // Remove the permission
        return {
          ...prev,
          permissions: currentPermissions.filter(p => p !== value)
        };
      }
    });
  };

  // Handle location form change
  const handleLocationChange = (e) => {
    const { name, value } = e.target;
    setLocationForm(prev => ({ ...prev, [name]: value }));
    
    // Clear errors
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
  


  // Validate sub-admin form
  const validateSubAdminForm = () => {
    const errors = {};
    
    // Required fields
    if (!subAdminForm.name.trim()) {
      errors.name = 'Name is required';
    }
    
    if (!subAdminForm.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(subAdminForm.email)) {
      errors.email = 'Invalid email format';
    } else if (!isEmailUnique(subAdminForm.email)) {
      errors.email = 'Email is already in use';
    }
    
    if (!subAdminForm.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(subAdminForm.phone.replace(/\D/g, ''))) {
      errors.phone = 'Phone number must be 10 digits';
    } else if (!isPhoneUnique(subAdminForm.phone)) {
      errors.phone = 'Phone number is already in use';
    }
    
    if (!subAdminForm.password.trim()) {
      errors.password = 'Password is required';
    } else if (!isPasswordStrong(subAdminForm.password)) {
      errors.password = 'Password must be at least 8 characters';
    }
    
    // Permissions are required
    if (subAdminForm.permissions.length === 0) {
      errors.permissions = 'At least one permission is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Validate location form
  const validateLocationForm = () => {
    const errors = {};
    
    if (!locationForm.name.trim()) {
      errors.name = 'Location name is required';
    }
    
    if (!locationForm.address.trim()) {
      errors.address = 'Address is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  


  // Submit sub-admin form
  const handleSubAdminSubmit = () => {
    if (validateSubAdminForm()) {
      // Create sub-admin
      const newSubAdmin = {
        name: subAdminForm.name,
        email: subAdminForm.email,
        phone: subAdminForm.phone,
        password: subAdminForm.password,
        permissions: subAdminForm.permissions,
        role: subAdminForm.role || 'Custom Role', // Default to custom role if none selected
        organizationId: id
      };
      
      addSubAdmin(id, newSubAdmin);
      
      // Reset form and close dialog
      setSubAdminForm({
        name: '',
        email: '',
        phone: '',
        password: '',
        role: '',
        permissions: []
      });
      setSubAdminDialog(false);
    }
  };

  // Submit location form
  const handleLocationSubmit = () => {
    if (validateLocationForm()) {
      // Create location
      const newLocation = {
        name: locationForm.name,
        address: locationForm.address,
        organizationId: id
      };
      
      addLocation(newLocation);
      
      // Reset form and close dialog
      setLocationForm({
        name: '',
        address: ''
      });
      setLocationDialog(false);
    }
  };
  

  
  // Handle update vendor
  const handleUpdateVendor = () => {
    try {
      if (selectedVendor) {
        // Update only tier and status
        updateVendor(selectedVendor.id, {
          ...selectedVendor,
          tier: vendorForm.tier,
          status: vendorForm.status
        });
        
        setVendorDialog(false);
      }
    } catch (error) {
      console.error('Error updating vendor:', error);
      setFormErrors(prev => ({ ...prev, vendorUpdate: error.message }));
    }
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <IconButton 
          onClick={() => navigate('/organizations')} 
          sx={{ mr: 2 }}
          aria-label="back"
        >
          <ArrowBackIcon />
        </IconButton>
        
        <Breadcrumbs sx={{ flexGrow: 1 }}>
          <Link 
            onClick={() => navigate('/organizations')} 
            sx={{ cursor: 'pointer', color: 'text.secondary' }}
            underline="hover"
          >
            Organizations
          </Link>
          <Typography color="text.primary">{organization.name}</Typography>
        </Breadcrumbs>
      </Box>
      
      <Typography variant="h4" gutterBottom>
        {organization.name}
      </Typography>
      
      <Paper sx={{ mt: 3 }}>
        <Tabs
          value={value}
          onChange={handleTabChange}
          aria-label="organization tabs"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Overview" id="org-tab-0" aria-controls="org-tabpanel-0" />
          <Tab label="Sub-Admins" id="org-tab-1" aria-controls="org-tabpanel-1" />
          <Tab label="Locations" id="org-tab-2" aria-controls="org-tabpanel-2" />
          <Tab label="Vendors" id="org-tab-3" aria-controls="org-tabpanel-3" />
          <Tab label="Tickets" id="org-tab-4" aria-controls="org-tabpanel-4" />
        </Tabs>
        
        <TabPanel value={value} index={0}>
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>Organization Summary</Typography>
            <Grid container spacing={2}>
              {/* Sub-Admin Count */}
              <Grid item xs={12} sm={6} md={3}>
                <Paper 
                  elevation={2} 
                  sx={{ 
                    p: 2, 
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: 120,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': { boxShadow: 6 }
                  }}
                  onClick={() => navigate(`/organizations/${id}/subadmins`)}
                >
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h4" sx={{ mb: 1 }}>
                        {organization.subAdmins?.length || 0}
                      </Typography>
                      <Typography variant="body1" color="text.secondary">Sub-Admins</Typography>
                    </Box>
                    <PersonIcon color="primary" fontSize="large" />
                  </Box>
                  <Box sx={{ mt: 'auto', pt: 1, display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body2" color="primary" sx={{ mr: 0.5 }}>
                      View All Sub-Admins
                    </Typography>
                    <ArrowBackIcon sx={{ fontSize: '1rem', transform: 'rotate(180deg)' }} color="primary" />
                  </Box>
                </Paper>
              </Grid>
              
              {/* Locations Count */}
              <Grid item xs={12} sm={6} md={3}>
                <Paper 
                  elevation={2} 
                  sx={{ 
                    p: 2, 
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: 120,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': { boxShadow: 6 }
                  }}
                  onClick={() => navigate(`/organizations/${id}/locations`)}
                >
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h4" sx={{ mb: 1 }}>
                        {organization.locations?.length || 0}
                      </Typography>
                      <Typography variant="body1" color="text.secondary">Locations</Typography>
                    </Box>
                    <LocationIcon color="primary" fontSize="large" />
                  </Box>
                  <Box sx={{ mt: 'auto', pt: 1, display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body2" color="primary" sx={{ mr: 0.5 }}>
                      View All Locations
                    </Typography>
                    <ArrowBackIcon sx={{ fontSize: '1rem', transform: 'rotate(180deg)' }} color="primary" />
                  </Box>
                </Paper>
              </Grid>
              
              {/* Vendors Count */}
              <Grid item xs={12} sm={6} md={3}>
                <Paper 
                  elevation={2} 
                  sx={{ 
                    p: 2, 
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: 120,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': { boxShadow: 6 }
                  }}
                  onClick={() => {
                    // Store tab index 3 (Vendors) in localStorage to align with sidebar menu
                    localStorage.setItem('orgDetailTab', '3');
                    navigate(`/organizations/${id}/vendors`);
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h4" sx={{ mb: 1 }}>
                        {organizationVendors.length}
                      </Typography>
                      <Typography variant="body1" color="text.secondary">Vendors</Typography>
                    </Box>
                    <VendorIcon color="primary" fontSize="large" />
                  </Box>
                  <Box sx={{ mt: 'auto', pt: 1, display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body2" color="primary" sx={{ mr: 0.5 }}>
                      View All Vendors
                    </Typography>
                    <ArrowBackIcon sx={{ fontSize: '1rem', transform: 'rotate(180deg)' }} color="primary" />
                  </Box>
                </Paper>
              </Grid>
              
              {/* Tickets Count */}
              <Grid item xs={12} sm={6} md={3}>
                <Paper 
                  elevation={2} 
                  sx={{ 
                    p: 2, 
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: 120,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': { boxShadow: 6 }
                  }}
                  onClick={() => navigate(`/organizations/${id}/tickets`)}
                >
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h4" sx={{ mb: 1 }}>
                        {organization.tickets?.length || 0}
                      </Typography>
                      <Typography variant="body1" color="text.secondary">Tickets</Typography>
                    </Box>
                    <TicketIcon color="primary" fontSize="large" />
                  </Box>
                  <Box sx={{ mt: 'auto', pt: 1, display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body2" color="primary" sx={{ mr: 0.5 }}>
                      View All Tickets
                    </Typography>
                    <ArrowBackIcon sx={{ fontSize: '1rem', transform: 'rotate(180deg)' }} color="primary" />
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          </Box>
          
          {/* Recent Activity */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>Recent Activity</Typography>
            <Paper sx={{ p: 2 }}>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Type</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell>Location</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {organization.recentActivity ? (
                      organization.recentActivity.map((activity) => (
                        <TableRow key={activity.id}>
                          <TableCell>{activity.type}</TableCell>
                          <TableCell>{activity.description}</TableCell>
                          <TableCell>{activity.location}</TableCell>
                          <TableCell>{activity.date}</TableCell>
                          <TableCell>
                            <Chip 
                              label={activity.status} 
                              size="small"
                              color={
                                activity.status === 'Completed' ? 'success' :
                                activity.status === 'In Progress' ? 'primary' :
                                activity.status === 'Pending' ? 'warning' : 'default'
                              }
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          <Typography color="text.secondary">No recent activity to display</Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Box>
          
          {/* Quick Actions */}
          <Box>
            <Typography variant="h6" gutterBottom>Quick Actions</Typography>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => setSubAdminDialog(true)}
                  sx={{ py: 1.5 }}
                >
                  Add Sub-Admin
                </Button>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => setLocationDialog(true)}
                  sx={{ py: 1.5 }}
                >
                  Add Location
                </Button>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<TicketIcon />}
                  sx={{ py: 1.5 }}
                >
                  New Ticket
                </Button>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<EditIcon />}
                  sx={{ py: 1.5 }}
                >
                  Edit Org Info
                </Button>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>
        
        <TabPanel value={value} index={1}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">Sub-Administrators</Typography>
            <Button 
              variant="contained" 
              startIcon={<AddIcon />}
              onClick={() => setSubAdminDialog(true)}
            >
              Add Sub-Admin
            </Button>
          </Box>
          
          <Grid container spacing={2}>
            {organization.subAdmins && organization.subAdmins.map((subAdmin) => (
              <Grid item xs={12} md={6} key={subAdmin.id}>
                <Paper 
                  elevation={2} 
                  sx={{ 
                    p: 2, 
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: 120
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h6">{subAdmin.name}</Typography>
                      <Typography variant="body2">{subAdmin.email}</Typography>
                      <Typography variant="body2" color="text.secondary">{subAdmin.phone}</Typography>
                    </Box>
                    <PersonIcon color="primary" />
                  </Box>
                  
                  <Box sx={{ mt: 'auto', pt: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      Permissions: {subAdmin.permissions ? subAdmin.permissions.length : 0}
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </TabPanel>
        
        <TabPanel value={value} index={2}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">Locations</Typography>
            <Button 
              variant="contained" 
              startIcon={<AddIcon />}
              onClick={() => setLocationDialog(true)}
            >
              Add Location
            </Button>
          </Box>
          
          <Grid container spacing={2}>
            {organization.locations && organization.locations.map((location) => (
              <Grid item xs={12} md={6} key={location.id}>
                <Paper 
                  elevation={2} 
                  sx={{ 
                    p: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: 120
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <Box sx={{ maxWidth: 'calc(100% - 40px)' }}>
                      <Typography variant="h6">{location.name}</Typography>
                      <Typography 
                        variant="body2" 
                        color="text.secondary"
                        sx={{ 
                          maxWidth: '100%',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word'
                        }}
                      >
                        {location.address}
                      </Typography>
                    </Box>
                    <LocationIcon color="primary" />
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </TabPanel>
        
        <TabPanel value={value} index={3}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">Vendor Relationships</Typography>
            <Box>
              <Button
                variant={vendorFilter === 'all' ? 'contained' : 'outlined'}
                size="small" 
                onClick={() => setVendorFilter('all')}
                sx={{ mr: 1 }}
              >
                All
              </Button>
              <Button
                variant={vendorFilter === 'active' ? 'contained' : 'outlined'}
                size="small"
                color="success"
                onClick={() => setVendorFilter('active')}
                sx={{ mr: 1 }}
              >
                Active
              </Button>
              <Button
                variant={vendorFilter === 'inactive' ? 'contained' : 'outlined'}
                size="small"
                color="error"
                onClick={() => setVendorFilter('inactive')}
              >
                Inactive
              </Button>
            </Box>
          </Box>
          
          {organizationVendors.length === 0 ? (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="text.secondary">No vendors associated with this organization</Typography>
              <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                Vendors must be added by a root administrator and then will appear here for management
              </Typography>
            </Paper>
          ) : (
            <TableContainer component={Paper}>
              <Table sx={{ minWidth: 650 }} aria-label="vendor table">
                <TableHead>
                  <TableRow>
                    <TableCell>Vendor</TableCell>
                    <TableCell>Contact</TableCell>
                    <TableCell align="center">Tier</TableCell>
                    <TableCell align="center">Status</TableCell>
                    <TableCell align="center">Assigned Locations</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {organizationVendors
                    .filter(vendor => {
                      if (vendorFilter === 'all') return true;
                      if (vendorFilter === 'active') return vendor.status !== 'inactive';
                      if (vendorFilter === 'inactive') return vendor.status === 'inactive';
                      return true;
                    })
                    .map((vendor) => {
                      // Get assigned locations (in a real app, this would come from your data model)
                      const assignedLocations = data?.locations?.filter(loc => 
                        loc.organizationId === id && (loc.vendorIds?.includes(vendor.id) || false)
                      ) || [];
                      
                      return (
                        <TableRow key={vendor.id}>
                          <TableCell component="th" scope="row">
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <VendorIcon 
                                color="primary" 
                                sx={{ 
                                  mr: 1,
                                  opacity: vendor.status === 'inactive' ? 0.5 : 1
                                }} 
                              />
                              <Typography 
                                sx={{ 
                                  fontWeight: 'medium',
                                  textDecoration: vendor.status === 'inactive' ? 'line-through' : 'none',
                                  opacity: vendor.status === 'inactive' ? 0.7 : 1
                                }}
                              >
                                {vendor.name}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{vendor.email}</Typography>
                            <Typography variant="body2" color="text.secondary">{vendor.phone}</Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Chip 
                              label={`Tier ${vendor.tier || 1}`} 
                              color={
                                vendor.tier === 3 ? 'error' : 
                                vendor.tier === 2 ? 'warning' : 
                                'primary'
                              }
                              size="small"
                              sx={{ opacity: vendor.status === 'inactive' ? 0.5 : 1 }}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Chip 
                              label={vendor.status === 'inactive' ? 'Inactive' : 'Active'}
                              color={vendor.status === 'inactive' ? 'default' : 'success'}
                              size="small"
                              variant={vendor.status === 'inactive' ? 'outlined' : 'filled'}
                            />
                          </TableCell>
                          <TableCell align="center">
                            {assignedLocations.length > 0 ? (
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 0.5 }}>
                                {assignedLocations.slice(0, 2).map(loc => (
                                  <Chip key={loc.id} label={loc.name} size="small" variant="outlined" />
                                ))}
                                {assignedLocations.length > 2 && (
                                  <Chip label={`+${assignedLocations.length - 2} more`} size="small" />
                                )}
                              </Box>
                            ) : (
                              <Typography variant="caption" color="text.secondary">None assigned</Typography>
                            )}
                          </TableCell>
                          <TableCell align="right">
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => {
                                setSelectedVendor(vendor);
                                setVendorForm({
                                  tier: vendor.tier || 1,
                                  status: vendor.status || 'active'
                                });
                                setVendorDialog(true);
                              }}
                            >
                              Manage
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>
        
        <TabPanel value={value} index={4}>
          <Typography variant="h6" gutterBottom>Tickets</Typography>
          <Typography>
            View and manage maintenance tickets for this organization.
          </Typography>
        </TabPanel>
      </Paper>
      
      {/* Add Sub-Admin Dialog */}
      <Dialog
        open={subAdminDialog}
        onClose={() => setSubAdminDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add Sub-Administrator</DialogTitle>
        <DialogContent>
          <TextField
            margin="normal"
            required
            fullWidth
            id="name"
            label="Full Name"
            name="name"
            value={subAdminForm.name}
            onChange={handleSubAdminInputChange}
            error={!!formErrors.name}
            helperText={formErrors.name}
          />
          
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            type="email"
            value={subAdminForm.email}
            onChange={handleSubAdminInputChange}
            error={!!formErrors.email}
            helperText={formErrors.email}
          />
          
          <TextField
            margin="normal"
            required
            fullWidth
            id="phone"
            label="Phone Number"
            name="phone"
            value={subAdminForm.phone}
            onChange={handleSubAdminInputChange}
            error={!!formErrors.phone}
            helperText={formErrors.phone}
          />
          
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            value={subAdminForm.password}
            onChange={handleSubAdminInputChange}
            error={!!formErrors.password}
            helperText={formErrors.password}
          />
          
          <FormControl fullWidth margin="normal">
            <InputLabel id="role-label">Role</InputLabel>
            <Select
              labelId="role-label"
              id="role"
              name="role"
              value={subAdminForm.role}
              onChange={handleSubAdminInputChange}
              label="Role"
            >
              <MenuItem value=""><em>Select a role</em></MenuItem>
              {userRoleTemplates.map((role) => (
                <MenuItem key={role.name} value={role.name}>
                  <Box>
                    <Typography variant="body1">{role.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{role.description}</Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
            <FormHelperText>
              Select a predefined role or choose "Custom Role" to set individual permissions
            </FormHelperText>
          </FormControl>
          
          <Typography variant="h6" gutterBottom sx={{ mt: 3, mb: 2 }}>
            Permissions
          </Typography>
          
          {(subAdminForm.role === 'Custom Role' || !subAdminForm.role) && (!Array.isArray(subAdminForm.permissions) || subAdminForm.permissions.length === 0) && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Please select at least one permission for this sub-administrator
            </Alert>
          )}
          
          <Grid container spacing={1}>
            {availablePermissions.map((permission) => (
              <Grid item xs={12} sm={6} key={permission.id}>
                <Box 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'flex-start', 
                    border: '1px solid #e0e0e0',
                    borderRadius: 1,
                    p: 1.5,
                    mb: 2,
                    bgcolor: Array.isArray(subAdminForm.permissions) && subAdminForm.permissions.includes(permission.id) ? 'rgba(0, 128, 128, 0.08)' : 'transparent',
                    '&:hover': {
                      bgcolor: 'rgba(0, 128, 128, 0.04)'
                    }
                  }}
                >
                  <Checkbox
                    checked={Array.isArray(subAdminForm.permissions) && subAdminForm.permissions.includes(permission.id)}
                    onChange={(e) => handlePermissionChange(e)}
                    value={permission.id}
                    name="permissions"
                    disabled={subAdminForm.role && subAdminForm.role !== 'Custom Role'}
                  />
                  <Box sx={{ ml: 1, flexGrow: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: Array.isArray(subAdminForm.permissions) && subAdminForm.permissions.includes(permission.id) ? 'bold' : 'normal' }}>
                      {permission.id.replace('subadmin.', '').replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {permission.description}
                    </Typography>
                  </Box>
                  <Tooltip title={permission.description}>
                    <IconButton size="small">
                      <InfoIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSubAdminDialog(false)}>Cancel</Button>
          <Button onClick={handleSubAdminSubmit} variant="contained">
            Add
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Add Location Dialog */}
      <Dialog
        open={locationDialog}
        onClose={() => setLocationDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add Location</DialogTitle>
        <DialogContent>
          <TextField
            margin="normal"
            required
            fullWidth
            id="name"
            label="Location Name"
            name="name"
            value={locationForm.name}
            onChange={handleLocationChange}
            error={!!formErrors.name}
            helperText={formErrors.name}
          />

          <TextField
            margin="normal"
            required
            fullWidth
            id="address"
            label="Address"
            name="address"
            multiline
            rows={3}
            value={locationForm.address}
            onChange={handleLocationChange}
            error={!!formErrors.address}
            helperText={formErrors.address}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLocationDialog(false)}>Cancel</Button>
          <Button onClick={handleLocationSubmit} variant="contained">
            Add
          </Button>
        </DialogActions>
      </Dialog>

      {/* Manage Vendor Dialog */}
      <Dialog
        open={vendorDialog}
        onClose={() => setVendorDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Manage Vendor Relationship</DialogTitle>
        <DialogContent>
          {selectedVendor && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6">{selectedVendor.name}</Typography>
              <Typography variant="body2">{selectedVendor.email}</Typography>
              <Typography variant="body2" color="text.secondary">{selectedVendor.phone}</Typography>
              <Divider sx={{ my: 2 }} />
            </Box>
          )}

          <FormControl fullWidth margin="normal">
            <InputLabel id="tier-label">Vendor Tier</InputLabel>
            <Select
              labelId="tier-label"
              id="tier"
              value={vendorForm.tier}
              label="Vendor Tier"
              onChange={(e) => setVendorForm(prev => ({ ...prev, tier: e.target.value }))}
            >
              <MenuItem value={1}>
                <ListItemText
                  primary="Tier 1 (Standard)"
                  secondary="Regular maintenance and basic issues"
                />
              </MenuItem>
              <MenuItem value={2}>
                <ListItemText
                  primary="Tier 2 (Advanced)"
                  secondary="Complex repairs and specialty work"
                />
              </MenuItem>
              <MenuItem value={3}>
                <ListItemText
                  primary="Tier 3 (Critical)"
                  secondary="Emergency services and major systems"
                />
              </MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth margin="normal">
            <InputLabel id="status-label">Status</InputLabel>
            <Select
              labelId="status-label"
              id="status"
              value={vendorForm.status}
              label="Status"
              onChange={(e) => setVendorForm(prev => ({ ...prev, status: e.target.value }))}
            >
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive (Paused)</MenuItem>
            </Select>
            <FormHelperText>
              {vendorForm.status === 'inactive' ? 
                'Inactive vendors will not receive new ticket assignments' : 
                'Active vendors can receive new ticket assignments'}
            </FormHelperText>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVendorDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleUpdateVendor} 
            variant="contained"
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
      

    </Box>
  );
};

export default OrganizationDetailRevised;
