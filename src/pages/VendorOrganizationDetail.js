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
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  FormHelperText
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  AssignmentLate as TicketIcon,
  Engineering as TechnicianIcon
} from '@mui/icons-material';
import { useData } from '../context/DataContext';

// Tab Panel component
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`vendor-org-tabpanel-${index}`}
      aria-labelledby={`vendor-org-tab-${index}`}
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

const VendorOrganizationDetail = () => {
  const { orgId } = useParams();
  const navigate = useNavigate();
  const { 
    getVendors,
    getOrganization, 
    getTechnicians,
    getLocations,
    getTickets,
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
    confirmPassword: ''
  });
  const [formErrors, setFormErrors] = useState({});

  // Get organization data
  const organization = getOrganization(orgId);
  if (!organization) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">Organization not found</Typography>
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={() => navigate('/vendor-dashboard')}
          sx={{ mt: 2 }}
        >
          Back to Organizations
        </Button>
      </Box>
    );
  }

  // Get vendor data (in a real app, would be from current user's vendor)
  const vendor = getVendors()[0]; // For demo, just use first vendor
  
  // Get related data
  const orgLocations = getLocations(orgId);
  
  // Get tickets for this organization
  const allTickets = getTickets();
  const orgTickets = allTickets.filter(ticket => {
    const location = getLocations().find(loc => loc.id === ticket.locationId);
    return location && location.orgId === orgId;
  });
  
  // Get technicians who are assigned to this organization
  const allTechnicians = getTechnicians(vendor ? vendor.id : null);
  const orgTechnicians = allTechnicians.filter(tech => 
    tech.orgContextIds && tech.orgContextIds.includes(orgId)
  );

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
      // Add technician - always assigned to this organization
      addTechnician({
        name: technicianForm.name,
        email: technicianForm.email,
        phone: technicianForm.phone,
        password: technicianForm.password,
        vendorId: vendor ? vendor.id : null,
        orgContextIds: [orgId]
      });

      // Reset form and close dialog
      setTechnicianForm({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: ''
      });
      setFormErrors({});
      setTechnicianDialog(false);
    } catch (error) {
      setFormErrors({ submit: error.message });
    }
  };

  // Get location name
  const getLocationName = (locationId) => {
    const location = orgLocations.find(loc => loc.id === locationId);
    return location ? location.name : 'Unknown Location';
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
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
              onClick={() => navigate('/vendor-dashboard')}
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
          onClick={() => navigate('/vendor-dashboard')}
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
          variant="fullWidth"
        >
          <Tab icon={<TicketIcon />} label="Tickets" />
          <Tab icon={<TechnicianIcon />} label="Technicians" />
        </Tabs>

        {/* Tickets Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6">Tickets for {organization.name}</Typography>
            <Typography variant="body2" color="text.secondary">
              Manage and respond to maintenance tickets for this organization
            </Typography>
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
                  <TableCell>Assigned Technician</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {orgTickets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      No tickets found for this organization
                    </TableCell>
                  </TableRow>
                ) : (
                  orgTickets.map((ticket) => (
                    <TableRow
                      key={ticket.id}
                      hover
                      sx={{ 
                        cursor: 'pointer',
                        backgroundColor: 
                          ticket.status === 'New' || ticket.status === 'Assigned' 
                            ? 'rgba(255, 152, 0, 0.05)'
                            : 'inherit'
                      }}
                      onClick={() => navigate(`/ticket/${ticket.id}`)}
                    >
                      <TableCell>{ticket.ticketNo}</TableCell>
                      <TableCell>{formatDate(ticket.dateTime)}</TableCell>
                      <TableCell>{getLocationName(ticket.locationId)}</TableCell>
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
                      <TableCell>
                        {ticket.assignedTechnicianId 
                          ? orgTechnicians.find(t => t.id === ticket.assignedTechnicianId)?.name || 'Unknown'
                          : 'Unassigned'
                        }
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="outlined" 
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/ticket/${ticket.id}`);
                          }}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Technicians Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box>
              <Typography variant="h6">Technicians for {organization.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                Manage technicians who can work on tickets for this organization
              </Typography>
            </Box>
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
                  <TableCell>Current Tickets</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {orgTechnicians.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      No technicians assigned to this organization
                    </TableCell>
                  </TableRow>
                ) : (
                  orgTechnicians.map((tech) => {
                    // Count active tickets for this technician
                    const activeTickets = orgTickets.filter(
                      t => t.assignedTechnicianId === tech.id && 
                      ['Assigned', 'In Progress', 'Paused'].includes(t.status)
                    ).length;
                    
                    return (
                      <TableRow key={tech.id}>
                        <TableCell>{tech.name}</TableCell>
                        <TableCell>{tech.email}</TableCell>
                        <TableCell>{tech.phone}</TableCell>
                        <TableCell>
                          {activeTickets > 0 ? (
                            <Chip 
                              label={`${activeTickets} Active`} 
                              color={activeTickets > 5 ? 'error' : 'primary'} 
                              size="small" 
                            />
                          ) : 'No active tickets'}
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="outlined" 
                            size="small"
                            onClick={() => navigate(`/technician/${tech.id}`)}
                          >
                            View Details
                          </Button>
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

      {/* Add Technician Dialog */}
      <Dialog 
        open={technicianDialog} 
        onClose={() => setTechnicianDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add Technician for {organization.name}</DialogTitle>
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
            label="Technician Name"
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

          <FormHelperText>
            This technician will be automatically assigned to work with {organization.name}
          </FormHelperText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTechnicianDialog(false)}>Cancel</Button>
          <Button onClick={handleTechnicianSubmit} variant="contained">
            Add Technician
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default VendorOrganizationDetail;
