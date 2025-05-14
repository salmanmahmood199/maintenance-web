import React, { useState, useEffect } from 'react';
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
  FormControlLabel,
  FormGroup,
  FormLabel,
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

// Format phone number to (XXX) XXX-XXXX format
const formatPhoneNumber = (phoneNumberString) => {
  if (!phoneNumberString) return '';
  
  // Strip all non-numeric characters
  const cleaned = ('' + phoneNumberString).replace(/\D/g, '');
  
  // Check if the input is of correct length
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  
  if (match) {
    return '(' + match[1] + ') ' + match[2] + '-' + match[3];
  }
  
  return phoneNumberString; // Return original if formatting fails
};

// Clean email address by removing any timestamp after +
const formatEmail = (email) => {
  if (!email) return '';
  
  // If email contains a + character followed by numbers before @, clean it up
  const match = email.match(/^([^+]+)\+\d+(@.*)$/);
  if (match) {
    return match[1] + match[2];
  }
  
  return email; // Return original if no formatting needed
};

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
  
  // Add state to store vendors
  const [organizationVendors, setOrganizationVendors] = useState([]);

  // Define available roles - matching the roles in SubAdmins.js for consistency
  const availableRoles = [
    { id: 'subadmin.placeTicket', label: 'Place Ticket', description: 'Create a new maintenance ticket: fill in location, issue type, description, upload media, and submit it.' },
    { id: 'subadmin.acceptTicket', label: 'Accept Ticket', description: 'Pick up ("accept") an unassigned ticket at Tier 1: you see New tickets and can assign them to vendors.' },
    { id: 'subadmin.tier2AcceptTicket', label: 'Tier 2 Accept Ticket', description: 'Accept or reassign tickets that have escalated past Tier 1 (i.e. Tier 2 queue).' },
    { id: 'subadmin.tier3AcceptTicket', label: 'Tier 3 Accept Ticket', description: 'Accept or reassign tickets that have escalated past Tier 2 (i.e. Tier 3 queue).' },
    { id: 'subadmin.addVendor', label: 'Add Vendor', description: 'Add a new vendor record to the org: enter name, email, phone, password, and link them to one/multiple orgs.' },
    { id: 'subadmin.addIssueType', label: 'Add Issue Type', description: 'Extend the "Type of Issue" lookup: add new categories like "Elevator" or "Electrical."' },
    { id: 'subadmin.acceptInvoice', label: 'Accept Invoice', description: 'Review and approve a vendor-generated invoice before it goes to accounts payable.' },
    { id: 'subadmin.addLocation', label: 'Add Location', description: 'Create new locations (stores/sites) under the org: set name, address, contact info.' },
    { id: 'subadmin.assignLocation', label: 'Assign Location', description: 'Assign users (managers or sub-admins) to one or more locations so they can place/see tickets there.' },
    { id: 'subadmin.verifyJobCompleted', label: 'Verify Job Completed', description: 'After a tech marks "Completed," verify the work order and close out the ticket.' },
    { id: 'subadmin.manageVendors', label: 'Manage Vendors', description: 'Adjust vendor tier/level, approve vendors, change which orgs they can serve.' }
  ];
  
  // Get available permissions from the availableRoles
  const availablePermissions = availableRoles;

  // Get organization info
  const organization = getOrganization(id);
  
  // Fetch vendors for this organization
  useEffect(() => {
    const fetchVendors = async () => {
      try {
        const vendors = await getVendors(id);
        setOrganizationVendors(vendors || []);
      } catch (error) {
        console.error('Error fetching vendors:', error);
        setOrganizationVendors([]);
      }
    };
    
    fetchVendors();
  }, [id, getVendors]);

  // Check for stored tab value from localStorage (synced with sidebar navigation)
  const getInitialTab = () => {
    // Check URL path to determine active tab
    if (window.location.pathname.includes('/subadmins')) return 1;
    if (window.location.pathname.includes('/locations')) return 2;
    if (window.location.pathname.includes('/vendors')) return 3;
    if (window.location.pathname.includes('/tickets')) return 4;
    
    // If no URL path match, check localStorage or default to tickets (4)
    const savedTab = localStorage.getItem('orgDetailTab');
    return savedTab ? parseInt(savedTab, 10) : 4;
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
  // Vendors are now fetched via useEffect

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setValue(newValue);

    // Store selected tab in localStorage to sync with sidebar
    localStorage.setItem('orgDetailTab', newValue);

    // Navigate to appropriate URL based on tab
    switch (newValue) {
      case 0: // Sub-Admins
        navigate(`/organizations/${id}/subadmins`);
        break;
      case 1: // Locations
        navigate(`/organizations/${id}/locations`);
        break;
      case 2: // Vendors
        navigate(`/organizations/${id}/vendors`);
        break;
      case 3: // Tickets
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
      const selectedRole = availableRoles.find(role => role.id === value);
      const rolePermissions = selectedRole ? [selectedRole.id] : [];
      
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
    const { name, checked } = e.target;
    
    setSubAdminForm(prev => {
      // Ensure permissions is always an array
      const currentPermissions = Array.isArray(prev.permissions) ? [...prev.permissions] : [];
      
      if (checked) {
        // Add permission if checked
        if (!currentPermissions.includes(name)) {
          return {
            ...prev,
            permissions: [...currentPermissions, name]
          };
        }
      } else {
        // Remove permission if unchecked
        return {
          ...prev,
          permissions: currentPermissions.filter(p => p !== name)
        };
      }
      
      return prev; // No change needed
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
  
  // Handle form reset for both forms
  useEffect(() => {
    // Initialize forms if needed
  }, []);
  
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
        role: 'subadmin', // Simplified role handling
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
  const handleUpdateVendor = async () => {
    try {
      if (selectedVendor) {
        // Update only tier and status - don't include the entire vendor object
        await updateVendor(selectedVendor.id, {
          tier: vendorForm.tier,
          status: vendorForm.status
        });
        
        // Refresh vendors data after update
        const vendors = await getVendors(id);
        setOrganizationVendors(vendors || []);
        
        // Show success message or indicator here if desired
        console.log('Vendor updated successfully');
        
        setVendorDialog(false);
      }
    } catch (error) {
      console.error('Error updating vendor:', error);
      setFormErrors(prev => ({ ...prev, vendorUpdate: error.message }));
      alert(`Error updating vendor: ${error.message}`);
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
        
        <TabPanel value={value} index={0}>
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
        
        <TabPanel value={value} index={1}>
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
        
        <TabPanel value={value} index={2}>
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
                            <Typography variant="body2">{formatEmail(vendor.email)}</Typography>
                            <Typography variant="body2" color="text.secondary">{formatPhoneNumber(vendor.phone)}</Typography>
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
        
        <TabPanel value={value} index={3}>
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
          
          {/* Role permissions section - matches SubAdmins.js format */}
          <FormControl component="fieldset" fullWidth margin="normal" sx={{ mt: 3 }}>
            <FormLabel component="legend">Role Permissions</FormLabel>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 1.5 }}>
              Select the permissions this sub-admin should have:
            </Typography>
            
            {(!Array.isArray(subAdminForm.permissions) || subAdminForm.permissions.length === 0) && (
              <Alert severity="info" sx={{ mb: 2 }}>
                Please select at least one permission for this sub-administrator
              </Alert>
            )}
            
            <FormGroup>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1 }}>
                {availableRoles.map(role => (
                  <FormControlLabel
                    key={role.id}
                    control={
                      <Checkbox
                        checked={Array.isArray(subAdminForm.permissions) && subAdminForm.permissions.includes(role.id)}
                        onChange={handlePermissionChange}
                        name={role.id}
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="body2">{role.label}</Typography>
                        <Typography variant="caption" color="text.secondary">{role.description}</Typography>
                      </Box>
                    }
                  />
                ))}
              </Box>
            </FormGroup>
          </FormControl>
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
