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
  Alert,
  FormHelperText,
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
      id={`vendor-tabpanel-${index}`}
      aria-labelledby={`vendor-tab-${index}`}
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

const VendorDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { 
    getVendor, 
    getOrganizations,
    getTechnicians,
    addTechnician,
    isEmailUnique,
    isPhoneUnique,
    isPasswordStrong
  } = useData();

  // State
  const [tabValue, setTabValue] = useState(0);
  const [technicianDialog, setTechnicianDialog] = useState(false);
  const [technicianForm, setTechnicianForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    orgContextIds: []
  });
  const [formErrors, setFormErrors] = useState({});

  // Get vendor data
  const vendor = getVendor(id);
  if (!vendor) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">Vendor not found</Typography>
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={() => navigate('/vendors')}
          sx={{ mt: 2 }}
        >
          Back to Vendors
        </Button>
      </Box>
    );
  }

  // Get related data
  const technicians = getTechnicians(id);
  const organizations = getOrganizations();
  const vendorOrgs = organizations.filter(org => vendor.orgIds.includes(org.id));

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Handle technician form change
  const handleTechnicianChange = (e) => {
    const { name, value } = e.target;
    setTechnicianForm(prev => ({ ...prev, [name]: value }));

    // Clear any previous errors for this field
    if (formErrors[name]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Handle org context selection
  const handleOrgContextChange = (event) => {
    const {
      target: { value },
    } = event;
    setTechnicianForm(prev => ({
      ...prev,
      orgContextIds: typeof value === 'string' ? value.split(',') : value,
    }));
  };

  // Validate technician form
  const validateTechnicianForm = () => {
    const errors = {};

    // Check required fields
    if (!technicianForm.name) errors.name = 'Name is required';
    if (!technicianForm.email) errors.email = 'Email is required';
    if (!technicianForm.phone) errors.phone = 'Phone is required';
    if (!technicianForm.password) errors.password = 'Password is required';
    if (!technicianForm.confirmPassword) errors.confirmPassword = 'Please confirm password';

    // Check email format
    if (technicianForm.email && !/\S+@\S+\.\S+/.test(technicianForm.email)) {
      errors.email = 'Email is not valid';
    }

    // Check email uniqueness
    if (technicianForm.email && !isEmailUnique(technicianForm.email)) {
      errors.email = 'Email is already in use';
    }

    // Check phone uniqueness
    if (technicianForm.phone && !isPhoneUnique(technicianForm.phone)) {
      errors.phone = 'Phone number is already in use';
    }

    // Check password strength
    if (technicianForm.password && !isPasswordStrong(technicianForm.password)) {
      errors.password = 'Password must be at least 8 characters with at least one letter and one number';
    }

    // Check if passwords match
    if (technicianForm.password && technicianForm.confirmPassword && 
        technicianForm.password !== technicianForm.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    return errors;
  };

  // Submit technician form
  const handleTechnicianSubmit = () => {
    // Validate form
    const errors = validateTechnicianForm();
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      // Add technician
      addTechnician({
        name: technicianForm.name,
        email: technicianForm.email,
        phone: technicianForm.phone,
        password: technicianForm.password,
        vendorId: id,
        orgContextIds: technicianForm.orgContextIds
      });

      // Reset form and close dialog
      setTechnicianForm({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        orgContextIds: []
      });
      setFormErrors({});
      setTechnicianDialog(false);
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
              onClick={() => navigate('/vendors')}
              sx={{ cursor: 'pointer' }}
            >
              Vendors
            </Link>
            <Typography color="text.primary">{vendor.name}</Typography>
          </Breadcrumbs>
          <Typography variant="h4" component="h1" sx={{ mt: 1 }}>
            {vendor.name}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {vendor.email} • {vendor.phone}
          </Typography>
        </Box>
        <IconButton 
          aria-label="back"
          onClick={() => navigate('/vendors')}
        >
          <ArrowBackIcon />
        </IconButton>
      </Box>

      {/* Associated Organizations */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Associated Organizations
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {vendorOrgs.length > 0 ? (
            vendorOrgs.map(org => (
              <Chip 
                key={org.id} 
                label={org.name} 
                color="primary" 
                onClick={() => navigate(`/organizations/${org.id}`)}
                sx={{ cursor: 'pointer' }}
              />
            ))
          ) : (
            <Typography variant="body2" color="text.secondary">
              Not associated with any organizations
            </Typography>
          )}
        </Box>
      </Paper>

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
          <Tab label="Technicians" />
          <Tab label="Work Orders" disabled />
          <Tab label="Invoices" disabled />
        </Tabs>

        {/* Technicians Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Technicians</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setTechnicianDialog(true)}
            >
              Add Technician
            </Button>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Organization Context</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {technicians.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      No technicians found
                    </TableCell>
                  </TableRow>
                ) : (
                  technicians.map((tech) => (
                    <TableRow key={tech.id}>
                      <TableCell>{tech.name}</TableCell>
                      <TableCell>{tech.email}</TableCell>
                      <TableCell>{tech.phone}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {tech.orgContextIds && tech.orgContextIds.map(orgId => {
                            const org = organizations.find(o => o.id === orgId);
                            return org ? (
                              <Chip 
                                key={orgId} 
                                label={org.name} 
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

        {/* Work Orders Tab (Disabled for MVP) */}
        <TabPanel value={tabValue} index={1}>
          <Typography variant="body1">
            Work Orders functionality will be available in a future update.
          </Typography>
        </TabPanel>

        {/* Invoices Tab (Disabled for MVP) */}
        <TabPanel value={tabValue} index={2}>
          <Typography variant="body1">
            Invoices functionality will be available in a future update.
          </Typography>
        </TabPanel>
      </Paper>

      {/* Add Technician Dialog */}
      <Dialog 
        open={technicianDialog} 
        onClose={() => setTechnicianDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add Technician</DialogTitle>
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
            label="Name"
            name="name"
            value={technicianForm.name}
            onChange={handleTechnicianChange}
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
            value={technicianForm.email}
            onChange={handleTechnicianChange}
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
            value={technicianForm.phone}
            onChange={handleTechnicianChange}
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
            value={technicianForm.password}
            onChange={handleTechnicianChange}
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
            value={technicianForm.confirmPassword}
            onChange={handleTechnicianChange}
            error={!!formErrors.confirmPassword}
            helperText={formErrors.confirmPassword}
          />

          <FormControl sx={{ mt: 2, width: '100%' }}>
            <InputLabel id="org-context-label">Organization Context</InputLabel>
            <Select
              labelId="org-context-label"
              id="orgContextIds"
              multiple
              value={technicianForm.orgContextIds}
              onChange={handleOrgContextChange}
              input={<OutlinedInput label="Organization Context" />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((orgId) => {
                    const org = organizations.find(o => o.id === orgId);
                    return org ? (
                      <Chip key={orgId} label={org.name} size="small" />
                    ) : null;
                  })}
                </Box>
              )}
            >
              {vendorOrgs.map((org) => (
                <MenuItem key={org.id} value={org.id}>
                  <Checkbox checked={technicianForm.orgContextIds.indexOf(org.id) > -1} />
                  <ListItemText primary={org.name} />
                </MenuItem>
              ))}
            </Select>
            <FormHelperText>
              Assign organizations where this technician can work
            </FormHelperText>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTechnicianDialog(false)}>Cancel</Button>
          <Button onClick={handleTechnicianSubmit} variant="contained">
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default VendorDetail;
