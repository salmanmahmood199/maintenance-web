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
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  OutlinedInput,
  FormHelperText,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Grid
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import PermissionGuard from '../components/PermissionGuard';
import { menuPermissionMap } from '../utils/permissionUtils';

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

const OrganizationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { 
    getOrganization, 
    getSubAdmins, 
    getSecurityGroups,
    getLocations,
    getTickets,
    addSubAdmin,
    addLocation,
    isEmailUnique,
    isPhoneUnique,
    isPasswordStrong
  } = useData();

  // State
  const [tabValue, setTabValue] = useState(0);
  const [subAdminDialog, setSubAdminDialog] = useState(false);
  const [locationDialog, setLocationDialog] = useState(false);
  const [subAdminForm, setSubAdminForm] = useState({
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    securityGroupIds: []
  });
  const [locationForm, setLocationForm] = useState({
    name: '',
    address: ''
  });
  const [formErrors, setFormErrors] = useState({});

  // Get organization data
  const organization = getOrganization(id);
  if (!organization) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">Organization not found</Typography>
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={() => navigate('/organizations')}
          sx={{ mt: 2 }}
        >
          Back to Organizations
        </Button>
      </Box>
    );
  }

  // Get related data
  const subAdmins = getSubAdmins(id);
  const securityGroups = getSecurityGroups();
  const locations = getLocations(id);
  const tickets = getTickets();
  const orgTickets = tickets.filter(ticket => {
    const location = getLocations().find(loc => loc.id === ticket.locationId);
    return location && location.orgId === id;
  });

  // Define available tabs with their required permissions
  const tabs = [
    { 
      id: "org-tab-0", 
      label: "SUB-ADMINS", 
      index: 0,
      requiredPermissions: menuPermissionMap['org.subadmins'] || ['subadmin.assignLocation']
    },
    { 
      id: "org-tab-1", 
      label: "LOCATIONS", 
      index: 1,
      requiredPermissions: menuPermissionMap['org.locations'] || []
    },
    { 
      id: "org-tab-2", 
      label: "VENDORS", 
      index: 2,
      requiredPermissions: menuPermissionMap['org.vendors'] || []
    },
    { 
      id: "org-tab-3", 
      label: "TICKETS", 
      index: 3,
      requiredPermissions: menuPermissionMap['org.tickets'] || ['subadmin.placeTicket', 'subadmin.viewTickets']
    }
  ];

  // Filter tabs based on user permissions
  const visibleTabs = tabs.filter(tab => {
    // Root user sees everything
    if (user?.role === 'root') return true;
    
    // If no permissions required, show to all
    if (!tab.requiredPermissions || tab.requiredPermissions.length === 0) return true;
    
    // Otherwise check if user has any of the required permissions
    return tab.requiredPermissions.some(permission => user?.permissions?.includes(permission));
  });
  
  // Create a mapping of original tab indices to visible tab indices
  const tabIndexMap = visibleTabs.reduce((map, tab, idx) => {
    map[tab.index] = idx;
    return map;
  }, {});

  // Ensure tabValue is valid for available tabs
  if (tabValue >= visibleTabs.length) {
    setTabValue(0);
  }

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Handle sub-admin form change
  const handleSubAdminChange = (e) => {
    const { name, value } = e.target;
    setSubAdminForm(prev => ({ ...prev, [name]: value }));

    // Clear any previous errors for this field
    if (formErrors[name]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Handle security groups selection
  const handleSecurityGroupChange = (event) => {
    const {
      target: { value },
    } = event;
    setSubAdminForm(prev => ({
      ...prev,
      securityGroupIds: typeof value === 'string' ? value.split(',') : value,
    }));
  };

  // Handle location form change
  const handleLocationChange = (e) => {
    const { name, value } = e.target;
    setLocationForm(prev => ({ ...prev, [name]: value }));

    // Clear any previous errors for this field
    if (formErrors[name]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Validate sub-admin form
  const validateSubAdminForm = () => {
    const errors = {};

    // Check required fields
    if (!subAdminForm.email) errors.email = 'Email is required';
    if (!subAdminForm.phone) errors.phone = 'Phone is required';
    if (!subAdminForm.password) errors.password = 'Password is required';
    if (!subAdminForm.confirmPassword) errors.confirmPassword = 'Confirm Password is required';

    // Check email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (subAdminForm.email && !emailRegex.test(subAdminForm.email)) {
      errors.email = 'Invalid email format';
    }

    // Check phone format (simple check)
    const phoneRegex = /^\d{10,15}$/;
    if (subAdminForm.phone && !phoneRegex.test(subAdminForm.phone.replace(/\D/g, ''))) {
      errors.phone = 'Invalid phone number';
    }

    // Check password match
    if (subAdminForm.password !== subAdminForm.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    // Check password strength
    if (subAdminForm.password && !isPasswordStrong(subAdminForm.password)) {
      errors.password = 'Password must be at least 8 characters with one letter and one number';
    }

    // Set errors and return valid status
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Validate location form
  const validateLocationForm = () => {
    const errors = {};

    // Check required fields
    if (!locationForm.name) errors.name = 'Name is required';
    if (!locationForm.address) errors.address = 'Address is required';

    // Set errors and return valid status
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit sub-admin form
  const handleSubAdminSubmit = async () => {
    if (!validateSubAdminForm()) return;

    try {
      // Check if email is unique
      if (!isEmailUnique(subAdminForm.email)) {
        setFormErrors({ email: 'Email is already in use' });
        return;
      }

      // Check if phone is unique
      if (!isPhoneUnique(subAdminForm.phone)) {
        setFormErrors({ phone: 'Phone number is already in use' });
        return;
      }

      // Add sub-admin
      await addSubAdmin({
        ...subAdminForm,
        organizationId: id
      });

      // Reset form and close dialog
      setSubAdminForm({
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        securityGroupIds: []
      });
      setSubAdminDialog(false);
    } catch (error) {
      setFormErrors({ submit: error.message });
    }
  };

  // Submit location form
  const handleLocationSubmit = async () => {
    if (!validateLocationForm()) return;

    try {
      // Add location
      await addLocation({
        ...locationForm,
        organizationId: id
      });

      // Reset form and close dialog
      setLocationForm({
        name: '',
        address: ''
      });
      setLocationDialog(false);
    } catch (error) {
      setFormErrors({ submit: error.message });
    }
  };

  // Check permissions for actions
  const canAddSubAdmins = user?.role === 'root' || user?.permissions?.includes('subadmin.assignLocation');
  const canAddLocations = user?.role === 'root' || (user?.permissions && menuPermissionMap['org.locations']?.some(p => user.permissions.includes(p)));

  return (
    <Box>
      {/* Breadcrumb Navigation */}
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
        <Link 
          underline="hover" 
          color="inherit" 
          sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          onClick={() => navigate('/organizations')}
        >
          <ArrowBackIcon sx={{ mr: 0.5 }} fontSize="small" />Organizations
        </Link>
        <Typography color="text.primary">{organization.name}</Typography>
      </Breadcrumbs>
      
      <Typography variant="h4" component="h1" gutterBottom>
        {organization.name}
      </Typography>
      
      {/* Organization Details */}
      <Paper sx={{ mb: 3 }}>

        {/* Overview tab has been removed */}

        {/* Sub-Admins Management */}
        <TabPanel value={tabValue} index={tabIndexMap[0] !== undefined ? tabIndexMap[0] : -1}>
          <PermissionGuard 
            permissions={menuPermissionMap['org.subadmins']} 
            fallback={null}
          >
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h5" gutterBottom>
                Sub-Admins
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setSubAdminDialog(true)}
              >
                Add Sub-Admin
              </Button>
            </Box>

            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Email</TableCell>
                    <TableCell>Phone</TableCell>
                    <TableCell>Security Groups</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {subAdmins.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3}>
                        <Typography align="center" color="text.secondary">
                          No sub-admins found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    subAdmins.map(admin => (
                      <TableRow key={admin.id}>
                        <TableCell>{admin.email}</TableCell>
                        <TableCell>{admin.phone}</TableCell>
                        <TableCell>
                          {admin.securityGroupIds?.map(groupId => {
                            const group = securityGroups.find(g => g.id === groupId);
                            return group ? (
                              <Chip 
                                key={groupId} 
                                label={group.name} 
                                size="small" 
                                sx={{ mr: 0.5, mb: 0.5 }} 
                              />
                            ) : null;
                          })}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </PermissionGuard>
        </TabPanel>

        {/* Locations Management */}
        <TabPanel value={tabValue} index={tabIndexMap[1] !== undefined ? tabIndexMap[1] : -1}>
          <PermissionGuard 
            permissions={menuPermissionMap['org.locations']} 
            fallback={null}
          >
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h5" gutterBottom>
                Locations
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setLocationDialog(true)}
              >
                Add Location
              </Button>
            </Box>

            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Address</TableCell>
                    <TableCell>Active Tickets</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {locations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3}>
                        <Typography align="center" color="text.secondary">
                          No locations found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    locations.map(location => {
                      const locationTickets = tickets.filter(t => t.locationId === location.id);
                      const activeTickets = locationTickets.filter(t => 
                        t.status !== 'completed' && t.status !== 'cancelled'
                      ).length;
                      
                      return (
                        <TableRow key={location.id}>
                          <TableCell>{location.name}</TableCell>
                          <TableCell>{location.address}</TableCell>
                          <TableCell>
                            <Chip 
                              label={activeTickets} 
                              color={activeTickets > 0 ? 'primary' : 'default'}
                              size="small" 
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </PermissionGuard>
        </TabPanel>

        {/* Vendors Management */}
        <TabPanel value={tabValue} index={tabIndexMap[2] !== undefined ? tabIndexMap[2] : -1}>
          <PermissionGuard 
            permissions={menuPermissionMap['org.vendors']} 
            fallback={null}
          >
            <Typography variant="h5" gutterBottom>
              Vendors
            </Typography>
            <Typography color="text.secondary">
              Vendor management functionality will be available soon.
            </Typography>
          </PermissionGuard>
        </TabPanel>

        {/* Tickets Overview */}
        <TabPanel value={tabValue} index={tabIndexMap[3] !== undefined ? tabIndexMap[3] : -1}>
          <PermissionGuard 
            permissions={menuPermissionMap['org.tickets']} 
            fallback={null}
          >
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h5" gutterBottom>
                Tickets
              </Typography>
              <PermissionGuard 
                permissions={['subadmin.placeTicket']} 
                fallback={null}
              >
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => navigate(`/organizations/${id}/tickets/new`)}
                >
                  Create Ticket
                </Button>
              </PermissionGuard>
            </Box>

            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Location</TableCell>
                    <TableCell>Issue</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {orgTickets.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6}>
                        <Typography align="center" color="text.secondary">
                          No tickets found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    orgTickets.map(ticket => {
                      const location = locations.find(l => l.id === ticket.locationId);
                      return (
                        <TableRow key={ticket.id}>
                          <TableCell>{ticket.id.slice(0, 8)}</TableCell>
                          <TableCell>{location ? location.name : 'Unknown'}</TableCell>
                          <TableCell>{ticket.issueType}</TableCell>
                          <TableCell>
                            <Chip
                              label={ticket.status}
                              color={
                                ticket.status === 'completed' ? 'success' :
                                ticket.status === 'in_progress' ? 'primary' :
                                ticket.status === 'cancelled' ? 'error' : 'default'
                              }
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            {new Date(ticket.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="small"
                              onClick={() => navigate(`/organizations/${id}/tickets/${ticket.id}`)}
                            >
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </PermissionGuard>
        </TabPanel>
      </Paper>

      {/* Add Sub-Admin Dialog */}
      <Dialog 
        open={subAdminDialog} 
      onClose={() => setSubAdminDialog(false)}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>Add Sub-Admin</DialogTitle>
      <DialogContent>
        {formErrors.submit && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {formErrors.submit}
          </Alert>
        )}
        
        <TextField
          margin="normal"
          required
          fullWidth
          id="email"
          label="Email Address"
          name="email"
          type="email"
          value={subAdminForm.email}
          onChange={handleSubAdminChange}
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
          type="tel"
          value={subAdminForm.phone}
          onChange={handleSubAdminChange}
          error={!!formErrors.phone}
          helperText={formErrors.phone}
        />

        <TextField
          margin="normal"
          required
          fullWidth
          id="password"
          label="Password"
          name="password"
          type="password"
          value={subAdminForm.password}
          onChange={handleSubAdminChange}
          error={!!formErrors.password}
          helperText={formErrors.password || 'Must be at least 8 characters with at least one letter and one number'}
        />

        <TextField
          margin="normal"
          required
          fullWidth
          id="confirmPassword"
          label="Confirm Password"
          name="confirmPassword"
          type="password"
          value={subAdminForm.confirmPassword}
          onChange={handleSubAdminChange}
          error={!!formErrors.confirmPassword}
          helperText={formErrors.confirmPassword}
        />

        <FormControl sx={{ mt: 2, width: '100%' }}>
          <InputLabel id="security-groups-label">Security Groups</InputLabel>
          <Select
            labelId="security-groups-label"
            id="securityGroupIds"
            multiple
            value={subAdminForm.securityGroupIds}
            onChange={handleSecurityGroupChange}
            input={<OutlinedInput label="Security Groups" />}
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {selected.map((groupId) => {
                  const group = securityGroups.find(g => g.id === groupId);
                  return group ? (
                    <Chip key={groupId} label={group.name} size="small" />
                  ) : null;
                })}
              </Box>
            )}
          >
            {securityGroups.map((group) => (
              <MenuItem key={group.id} value={group.id}>
                <Checkbox checked={subAdminForm.securityGroupIds.indexOf(group.id) > -1} />
                <ListItemText 
                  primary={group.name} 
                  secondary={group.description}
                />
              </MenuItem>
            ))}
          </Select>
          <FormHelperText>
            Assign relevant security groups to this sub-admin
          </FormHelperText>
        </FormControl>
        <DialogTitle>Add Sub-Admin</DialogTitle>
        <DialogContent>
          {formErrors.submit && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {formErrors.submit}
            </Alert>
          )}

          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email"
            name="email"
            type="email"
            value={subAdminForm.email}
            onChange={handleSubAdminChange}
            error={!!formErrors.email}
            helperText={formErrors.email}
          />

          <TextField
            margin="normal"
            required
            fullWidth
            id="phone"
            label="Phone"
            name="phone"
            value={subAdminForm.phone}
            onChange={handleSubAdminChange}
            error={!!formErrors.phone}
            helperText={formErrors.phone}
          />

          <TextField
            margin="normal"
            required
            fullWidth
            id="password"
            label="Password"
            name="password"
            type="password"
            value={subAdminForm.password}
            onChange={handleSubAdminChange}
            error={!!formErrors.password}
            helperText={formErrors.password || 'Must be at least 8 characters with at least one letter and one number'}
          />

          <TextField
            margin="normal"
            required
            fullWidth
            id="confirmPassword"
            label="Confirm Password"
            name="confirmPassword"
            type="password"
            value={subAdminForm.confirmPassword}
            onChange={handleSubAdminChange}
            error={!!formErrors.confirmPassword}
            helperText={formErrors.confirmPassword}
          />

          <FormControl sx={{ mt: 2, width: '100%' }}>
            <InputLabel id="security-groups-label">Security Groups</InputLabel>
            <Select
              labelId="security-groups-label"
              id="securityGroupIds"
              multiple
              value={subAdminForm.securityGroupIds}
              onChange={handleSecurityGroupChange}
              input={<OutlinedInput label="Security Groups" />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((groupId) => {
                    const group = securityGroups.find(g => g.id === groupId);
                    return group ? (
                      <Chip key={groupId} label={group.name} size="small" />
                    ) : null;
                  })}
                </Box>
              )}
            >
              {securityGroups.map((group) => (
                <MenuItem key={group.id} value={group.id}>
                  <Checkbox checked={subAdminForm.securityGroupIds.indexOf(group.id) > -1} />
                  <ListItemText 
                    primary={group.name} 
                    secondary={group.description}
                  />
                </MenuItem>
              ))}
            </Select>
            <FormHelperText>
              Assign relevant security groups to this sub-admin
            </FormHelperText>
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
          {formErrors.submit && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {formErrors.submit}
            </Alert>
          )}

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
    </Box>
  );
};

export default OrganizationDetail;
