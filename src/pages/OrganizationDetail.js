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
  Chip
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Add as AddIcon
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

const OrganizationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
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
    if (!subAdminForm.confirmPassword) errors.confirmPassword = 'Please confirm password';

    // Check email format
    if (subAdminForm.email && !/\S+@\S+\.\S+/.test(subAdminForm.email)) {
      errors.email = 'Email is not valid';
    }

    // Check email uniqueness
    if (subAdminForm.email && !isEmailUnique(subAdminForm.email)) {
      errors.email = 'Email is already in use';
    }

    // Check phone uniqueness
    if (subAdminForm.phone && !isPhoneUnique(subAdminForm.phone)) {
      errors.phone = 'Phone number is already in use';
    }

    // Check password strength
    if (subAdminForm.password && !isPasswordStrong(subAdminForm.password)) {
      errors.password = 'Password must be at least 8 characters with at least one letter and one number';
    }

    // Check if passwords match
    if (subAdminForm.password && subAdminForm.confirmPassword && 
        subAdminForm.password !== subAdminForm.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    return errors;
  };

  // Validate location form
  const validateLocationForm = () => {
    const errors = {};

    // Check required fields
    if (!locationForm.name) errors.name = 'Location name is required';
    if (!locationForm.address) errors.address = 'Address is required';

    return errors;
  };

  // Submit sub-admin form
  const handleSubAdminSubmit = () => {
    // Validate form
    const errors = validateSubAdminForm();
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      // Add sub-admin
      addSubAdmin({
        email: subAdminForm.email,
        phone: subAdminForm.phone,
        password: subAdminForm.password,
        orgId: id,
        securityGroupIds: subAdminForm.securityGroupIds
      });

      // Reset form and close dialog
      setSubAdminForm({
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        securityGroupIds: []
      });
      setFormErrors({});
      setSubAdminDialog(false);
    } catch (error) {
      setFormErrors({ submit: error.message });
    }
  };

  // Submit location form
  const handleLocationSubmit = () => {
    // Validate form
    const errors = validateLocationForm();
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      // Add location
      addLocation({
        name: locationForm.name,
        address: locationForm.address,
        orgId: id
      });

      // Reset form and close dialog
      setLocationForm({
        name: '',
        address: ''
      });
      setFormErrors({});
      setLocationDialog(false);
    } catch (error) {
      setFormErrors({ submit: error.message });
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Breadcrumbs aria-label="breadcrumb">
            <Link 
              underline="hover" 
              color="inherit" 
              onClick={() => navigate('/organizations')}
              sx={{ cursor: 'pointer' }}
            >
              Organizations
            </Link>
            <Typography color="text.primary">{organization.name}</Typography>
          </Breadcrumbs>
          <Typography variant="h4" component="h1" sx={{ mt: 1 }}>
            {organization.name}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {organization.contactEmail} • {organization.contactPhone}
          </Typography>
        </Box>
        <IconButton 
          aria-label="back"
          onClick={() => navigate('/organizations')}
        >
          <ArrowBackIcon />
        </IconButton>
      </Box>

      {/* Tabs navigation */}
      <Paper sx={{ width: '100%', mb: 2 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Sub-Admins" />
          <Tab label="Security Groups" />
          <Tab label="Locations" />
          <Tab label="Tickets" />
        </Tabs>

        {/* Sub-Admins Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Sub-Admins</Typography>
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
                    <TableCell colSpan={3} align="center">
                      No sub-admins found
                    </TableCell>
                  </TableRow>
                ) : (
                  subAdmins.map((admin) => (
                    <TableRow key={admin.id}>
                      <TableCell>{admin.email}</TableCell>
                      <TableCell>{admin.phone}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {admin.securityGroupIds && admin.securityGroupIds.map(groupId => {
                            const group = securityGroups.find(g => g.id === groupId);
                            return group ? (
                              <Chip 
                                key={groupId} 
                                label={group.name} 
                                size="small" 
                                color="primary" 
                                variant="outlined" 
                              />
                            ) : null;
                          })}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Security Groups Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6">Security Groups</Typography>
            <Typography variant="body2" color="text.secondary">
              Pre-defined security groups used for sub-admin permissions
            </Typography>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Group Name</TableCell>
                  <TableCell>Description</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {securityGroups.map((group) => (
                  <TableRow key={group.id}>
                    <TableCell>{group.name}</TableCell>
                    <TableCell>{group.description}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Locations Tab */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Locations</Typography>
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
                </TableRow>
              </TableHead>
              <TableBody>
                {locations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} align="center">
                      No locations found
                    </TableCell>
                  </TableRow>
                ) : (
                  locations.map((location) => (
                    <TableRow key={location.id}>
                      <TableCell>{location.name}</TableCell>
                      <TableCell>{location.address}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Tickets Tab */}
        <TabPanel value={tabValue} index={3}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6">Tickets</Typography>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Ticket #</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Issue Type</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {orgTickets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      No tickets found
                    </TableCell>
                  </TableRow>
                ) : (
                  orgTickets.map((ticket) => {
                    const location = getLocations().find(loc => loc.id === ticket.locationId);
                    return (
                      <TableRow key={ticket.id}>
                        <TableCell>{ticket.ticketNo}</TableCell>
                        <TableCell>{new Date(ticket.dateTime).toLocaleDateString()}</TableCell>
                        <TableCell>{location ? location.name : 'Unknown'}</TableCell>
                        <TableCell>{ticket.issueType}</TableCell>
                        <TableCell>
                          <Chip 
                            label={ticket.status} 
                            color={
                              ticket.status === 'New' ? 'error' :
                              ticket.status === 'Assigned' ? 'warning' :
                              ticket.status === 'In Progress' ? 'info' :
                              ticket.status === 'Completed' ? 'success' :
                              ticket.status === 'Verified' ? 'secondary' :
                              'default'
                            } 
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
