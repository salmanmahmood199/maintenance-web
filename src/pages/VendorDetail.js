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
  Alert,
  FormHelperText,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  FormGroup,
  FormControlLabel,
  Divider,
  Menu,
  Drawer,
  Grid,
  Card,
  CardContent,
  Stepper,
  Step,
  StepLabel
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  ArrowDropDown as ArrowDropDownIcon,
  Close as CloseIcon,
  OpenInNew as OpenInNewIcon
} from '@mui/icons-material';
import { useData } from '../context/DataContext';
import AssignmentIcon from '@mui/icons-material/Assignment';

// Ticket workflow stages
const TICKET_WORKFLOW = [
  { key: 'created', label: 'Ticket Placed', description: 'Maintenance request submitted', status: 'New' },
  { key: 'pending_approval', label: 'Pending Approval', description: 'Waiting for approval from admin', status: 'New' },
  { key: 'assigned', label: 'Vendor Assigned', description: 'Ticket assigned to vendor', status: 'Assigned' },
  { key: 'waiting_vendor_response', label: 'Awaiting Vendor Response', description: 'Waiting for vendor to accept, reject, or request more info', status: 'Assigned' },
  { key: 'vendor_accepted', label: 'Vendor Accepted', description: 'Vendor accepted the ticket', status: 'Assigned' },
  { key: 'vendor_rejected', label: 'Vendor Rejected', description: 'Vendor rejected the ticket', status: 'Rejected' },
  { key: 'more_info_requested', label: 'More Info Requested', description: 'Vendor requested more information', status: 'More Info Needed' },
  { key: 'work_order', label: 'Work Order Created', description: 'Vendor created work order', status: 'Assigned' },
  { key: 'in_progress', label: 'Work In Progress', description: 'Vendor is working on the issue', status: 'In Progress' },
  { key: 'invoice_uploaded', label: 'Invoice Uploaded', description: 'Work completed and invoice uploaded', status: 'Completed' },
  { key: 'awaiting_approval', label: 'Awaiting Approval', description: 'Waiting for final approval', status: 'Completed' },
  { key: 'completed', label: 'Order Complete', description: 'All work verified and completed', status: 'Verified' }
];

// Issue types
const ISSUE_TYPES = [
  { value: 'electrical', label: 'Electrical' },
  { value: 'plumbing', label: 'Plumbing' },
  { value: 'hvac', label: 'HVAC' },
  { value: 'structural', label: 'Structural' },
  { value: 'cleaning', label: 'Cleaning' },
  { value: 'other', label: 'Other' }
];

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
    isPasswordStrong,
    getTickets
  } = useData();

  // State - ALL useState hooks need to be at the top level before any conditionals
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
  // State for organization filter
  const [selectedOrgId, setSelectedOrgId] = useState(null);
  // State for technician filtering and actions
  const [selectedTechOrgId, setSelectedTechOrgId] = useState(null);
  const [passwordResetDialog, setPasswordResetDialog] = useState(false);
  const [selectedTechnician, setSelectedTechnician] = useState(null);
  const [passwordResetForm, setPasswordResetForm] = useState({
    password: '',
    confirmPassword: ''
  });
  const [passwordResetError, setPasswordResetError] = useState('');
  const [orgContextDialog, setOrgContextDialog] = useState(false);
  const [techOrgSelections, setTechOrgSelections] = useState({});
  // For the more intuitive tickets filter
  const [ticketsFilterMenuAnchor, setTicketsFilterMenuAnchor] = useState(null);
  // State for technicians list - moved up from conditional position
  const [technicians, setTechnicians] = useState([]);
  // State for selected ticket and drawer
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Load technicians when component mounts - moved up from conditional position
  useEffect(() => {
    if (id) {
      setTechnicians(getTechnicians(id));
    }
  }, [id, getTechnicians]);

  // Get vendor data and other data needed for ticket details
  const vendor = getVendor(id);
  const { getLocations, getVendors } = useData();
  const locations = getLocations();
  
  // Determine current step in ticket workflow
  const determineCurrentStep = (ticket) => {
    if (!ticket || !ticket.status) return 0;
    
    const status = ticket.status.toLowerCase();
    const stepIndex = TICKET_WORKFLOW.findIndex(step => step.key === status || step.status === ticket.status);
    return stepIndex >= 0 ? stepIndex : 0;
  };
  
  // Get location name by ID
  const getLocationName = (locationId) => {
    if (!locationId) return '';
    const location = locations.find(loc => loc.id === locationId);
    return location ? location.name : '';
  };
  
  // Get assigned vendor name
  const getAssignedVendor = (ticket) => {
    if (!ticket) return 'Unassigned';
    const vendorId = ticket.vendorId || ticket.assignedVendorId;
    if (!vendorId) return 'Unassigned';
    const vendor = getVendors().find(v => v.id === vendorId);
    return vendor ? vendor.name : 'Unknown Vendor';
  };
  
  // Early return if vendor not found - now safe because all hooks are declared above
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
  const organizations = getOrganizations();
  const vendorOrgs = organizations.filter(org => vendor.orgIds.includes(org.id));
  
  // Get tickets assigned to this vendor - check both assignedVendorId and vendorId fields
  const allTickets = getTickets();
  const vendorTickets = allTickets.filter(ticket => 
    ticket.assignedVendorId === id || ticket.vendorId === id
  );
  
  // Log for debugging
  console.log('All tickets count:', allTickets.length);
  console.log('Vendor tickets count:', vendorTickets.length);
  console.log('Vendor tickets:', vendorTickets);
  
  // Function to get consistent color for organization
  const getOrgColor = (orgId) => {
    if (!orgId) return { bg: '#f5f5f5', border: '#e0e0e0' };
    
    // Create a deterministic hash from the orgId
    const hash = orgId.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);
    
    // Generate a hue value from 0-360 based on the hash
    const hue = Math.abs(hash % 360);
    
    return {
      bg: `hsla(${hue}, 70%, 90%, 0.2)`,
      border: `hsla(${hue}, 70%, 50%, 0.5)`
    };
  };
  
  // Filter tickets by selected organization
  const filteredTickets = selectedOrgId 
    ? vendorTickets.filter(ticket => ticket.orgId === selectedOrgId)
    : vendorTickets;

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
      const result = addTechnician({
        ...technicianForm,
        vendorId: id
      });
      
      if (result.success) {
        // Close dialog and reset form
        setTechnicianDialog(false);
        setTechnicianForm({
          name: '',
          email: '',
          phone: '',
          password: '',
          confirmPassword: '',
          orgContextIds: []
        });
        setFormErrors({});
      } else {
        setFormErrors({
          ...formErrors,
          submit: result.error || 'Failed to add technician'
        });
      }
    } catch (error) {
      console.error('Error adding technician:', error);
      setFormErrors({
        ...formErrors,
        submit: 'An unexpected error occurred'
      });
    }
  };

  // Handle password reset dialog open
  const handlePasswordResetOpen = (technician) => {
    setSelectedTechnician(technician);
    setPasswordResetForm({
      password: '',
      confirmPassword: ''
    });
    setPasswordResetError('');
    setPasswordResetDialog(true);
  };

  // Handle password reset form change
  const handlePasswordResetChange = (e) => {
    const { name, value } = e.target;
    setPasswordResetForm(prev => ({ ...prev, [name]: value }));
  };

  // Handle password reset submit
  const handlePasswordResetSubmit = () => {
    // Validate password
    if (!passwordResetForm.password) {
      setPasswordResetError('Password is required');
      return;
    }

    if (passwordResetForm.password !== passwordResetForm.confirmPassword) {
      setPasswordResetError('Passwords do not match');
      return;
    }

    if (!isPasswordStrong(passwordResetForm.password)) {
      setPasswordResetError('Password must be at least 8 characters with at least one letter and number');
      return;
    }

    // In a real app, this would call an API to update the password
    // For this demo, we'll just show a success message
    alert(`Password for ${selectedTechnician.name} has been reset successfully`);
    setPasswordResetDialog(false);
  };

  // Open organization context management dialog
  const handleOpenOrgContextDialog = (technician) => {
    setSelectedTechnician(technician);
    
    // Initialize the selections based on current org assignments
    const techOrgIds = technician.orgContextIds || [];
    const initialSelections = {};
    
    // Create an object with all orgs and their selection status
    vendorOrgs.forEach(org => {
      initialSelections[org.id] = techOrgIds.includes(org.id);
    });
    
    setTechOrgSelections(initialSelections);
    setOrgContextDialog(true);
  };
  
  // Handle checkbox change for technician org context
  const handleOrgSelectionChange = (orgId) => {
    setTechOrgSelections(prev => ({
      ...prev,
      [orgId]: !prev[orgId]
    }));
  };
  
  // Save technician organization contexts
  const handleSaveOrgContexts = () => {
    // In a real app, this would update the technician's organization associations in the database
    // For this demo, we'll just show a success message and update the UI
    
    if (!selectedTechnician) return;
    
    // Get the selected org IDs
    const newOrgContextIds = Object.entries(techOrgSelections)
      .filter(([_, isSelected]) => isSelected)
      .map(([orgId]) => orgId);
    
    // Find the technician and update their org contexts
    const techIndex = technicians.findIndex(t => t.id === selectedTechnician.id);
    if (techIndex !== -1) {
      const updatedTech = { ...technicians[techIndex] };
      updatedTech.orgContextIds = newOrgContextIds;
      
      // Update the technicians array (this is just for UI demo - would be handled by API in real app)
      const updatedTechnicians = [...technicians];
      updatedTechnicians[techIndex] = updatedTech;
      
      // Set the updated technicians state to trigger a re-render
      setTechnicians(updatedTechnicians);
      
      alert(`Organization contexts updated for ${updatedTech.name}`);
      setOrgContextDialog(false);
    }
  };
  
  // Handle filter menu open for tickets
  const handleFilterMenuOpen = (event) => {
    setTicketsFilterMenuAnchor(event.currentTarget);
  };
  
  // Handle filter menu close
  const handleFilterMenuClose = () => {
    setTicketsFilterMenuAnchor(null);
  };
  
  // Handle organization filter selection
  const handleOrgFilterSelect = (orgId) => {
    setSelectedOrgId(selectedOrgId === orgId ? null : orgId);
    handleFilterMenuClose();
  };
  
  // Handle clearing ticket filter
  const handleClearTicketFilter = () => {
    setSelectedOrgId(null);
    handleFilterMenuClose();
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
                variant="outlined"
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
          <Tab label="Tickets" />
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

          {/* Organization filter for technicians */}
          <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
            <FormControl variant="outlined" size="small" sx={{ minWidth: 200 }}>
              <InputLabel id="tech-org-filter-label">Filter by Organization</InputLabel>
              <Select
                labelId="tech-org-filter-label"
                id="tech-org-filter"
                value={selectedTechOrgId || ''}
                onChange={(e) => setSelectedTechOrgId(e.target.value || null)}
                label="Filter by Organization"
              >
                <MenuItem value="">All Organizations</MenuItem>
                {vendorOrgs.map(org => (
                  <MenuItem key={org.id} value={org.id}>{org.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            
            {selectedTechOrgId && (
              <Button 
                variant="outlined" 
                size="small" 
                onClick={() => setSelectedTechOrgId(null)}
              >
                Clear Filter
              </Button>
            )}
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Organization Context</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {technicians.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      No technicians found
                    </TableCell>
                  </TableRow>
                ) : (
                  technicians
                    .filter(tech => selectedTechOrgId ? tech.orgContextIds?.includes(selectedTechOrgId) : true)
                    .map((tech) => (
                    <TableRow key={tech.id}>
                      <TableCell>{tech.name}</TableCell>
                      <TableCell>{tech.email}</TableCell>
                      <TableCell>{tech.phone}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Box>
                            {tech.orgContextIds && tech.orgContextIds.length > 0 ? (
                              <Typography variant="body2">
                                {tech.orgContextIds.length} organization{tech.orgContextIds.length !== 1 ? 's' : ''} assigned
                              </Typography>
                            ) : (
                              <Typography variant="body2" color="text.secondary">
                                No organizations assigned
                              </Typography>
                            )}
                          </Box>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => handleOpenOrgContextDialog(tech)}
                          >
                            Manage Organizations
                          </Button>
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Button
                          size="small"
                          onClick={() => handlePasswordResetOpen(tech)}
                          color="primary"
                        >
                          Reset Password
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Tickets Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Tickets Assigned to {vendor.name}</Typography>
          </Box>
          
          {/* Organization filter dropdown */}
          <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button
              variant="outlined"
              endIcon={<ArrowDropDownIcon />}
              onClick={handleFilterMenuOpen}
              sx={{ minWidth: 220, justifyContent: 'space-between' }}
            >
              {selectedOrgId 
                ? `Filter: ${organizations.find(o => o.id === selectedOrgId)?.name}` 
                : "Filter by Organization"}
            </Button>
            
            {selectedOrgId && (
              <Button 
                variant="outlined" 
                size="small" 
                onClick={handleClearTicketFilter}
              >
                Clear Filter
              </Button>
            )}
            
            <Menu
              anchorEl={ticketsFilterMenuAnchor}
              open={Boolean(ticketsFilterMenuAnchor)}
              onClose={handleFilterMenuClose}
            >
              <MenuItem onClick={handleClearTicketFilter}>
                <Typography sx={{ fontWeight: !selectedOrgId ? 'bold' : 'normal' }}>
                  All Organizations
                </Typography>
              </MenuItem>
              <Divider />
              {vendorOrgs.map(org => {
                const colors = getOrgColor(org.id);
                return (
                  <MenuItem 
                    key={org.id} 
                    onClick={() => handleOrgFilterSelect(org.id)}
                    sx={{
                      backgroundColor: selectedOrgId === org.id ? colors.bg : 'transparent',
                    }}
                  >
                    <Typography sx={{ fontWeight: selectedOrgId === org.id ? 'bold' : 'normal' }}>
                      {org.name}
                    </Typography>
                  </MenuItem>
                );
              })}
            </Menu>
            
            {selectedOrgId && (
              <Typography variant="body2" color="text.secondary">
                Showing {filteredTickets.length} ticket(s)
              </Typography>
            )}
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Ticket ID</TableCell>
                  <TableCell>Title</TableCell>
                  <TableCell>Organization</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell>Created</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredTickets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      No tickets are currently assigned to this vendor
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTickets.map((ticket) => {
                    const org = organizations.find(o => o.id === ticket.orgId);
                    const location = org?.locations?.find(l => l.id === ticket.locationId);
                    
                    return (
                      <TableRow 
                        key={ticket.id}
                        hover
                        sx={{ 
                          cursor: 'pointer',
                          '&:hover': { backgroundColor: 'action.hover' } 
                        }}
                        onClick={() => {
                          setSelectedTicket(ticket);
                          setIsDrawerOpen(true);
                        }}
                      >
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <AssignmentIcon color="primary" sx={{ mr: 1 }} />
                            {ticket.id.slice(0, 8)}
                          </Box>
                        </TableCell>
                        <TableCell>{ticket.title}</TableCell>
                        <TableCell>
                          <Chip 
                            label={org?.name || 'Unknown'} 
                            size="small"
                            sx={{
                              backgroundColor: getOrgColor(ticket.orgId).bg,
                              border: '1px solid',
                              borderColor: getOrgColor(ticket.orgId).border
                            }}
                          />
                        </TableCell>
                        <TableCell>{location?.name || 'Unknown'}</TableCell>
                        <TableCell>
                          <Chip 
                            label={ticket.status} 
                            color={
                              ticket.status === 'completed' ? 'success' : 
                              ticket.status === 'in_progress' ? 'primary' : 
                              ticket.status === 'cancelled' ? 'error' : 
                              'default'
                            }
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={ticket.priority} 
                            color={
                              ticket.priority === 'high' ? 'error' : 
                              ticket.priority === 'medium' ? 'warning' : 
                              'info'
                            }
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {new Date(ticket.createdAt).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Work Orders Tab (Disabled for MVP) */}
        <TabPanel value={tabValue} index={2}>
          <Typography variant="body1">
            Work Orders functionality will be available in a future update.
          </Typography>
        </TabPanel>

        {/* Invoices Tab (Disabled for MVP) */}
        <TabPanel value={tabValue} index={3}>
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

      {/* Password Reset Dialog */}
      <Dialog
        open={passwordResetDialog}
        onClose={() => setPasswordResetDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Reset Password for {selectedTechnician?.name}</DialogTitle>
        <DialogContent>
          {passwordResetError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {passwordResetError}
            </Alert>
          )}

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Enter a new password for this technician. They will need to use this password for their next login.
          </Typography>

          <TextField
            margin="normal"
            required
            fullWidth
            id="password"
            label="New Password"
            name="password"
            type="password"
            value={passwordResetForm.password}
            onChange={handlePasswordResetChange}
            helperText="Must be at least 8 characters with at least one letter and number"
          />

          <TextField
            margin="normal"
            required
            fullWidth
            id="confirmPassword"
            label="Confirm New Password"
            name="confirmPassword"
            type="password"
            value={passwordResetForm.confirmPassword}
            onChange={handlePasswordResetChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPasswordResetDialog(false)}>Cancel</Button>
          <Button onClick={handlePasswordResetSubmit} variant="contained" color="primary">
            Reset Password
          </Button>
        </DialogActions>
      </Dialog>

      {/* Organization Context Dialog */}
      <Dialog
        open={orgContextDialog}
        onClose={() => setOrgContextDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Manage Organizations for {selectedTechnician?.name}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, mt: 1 }}>
            Select organizations where this technician can access tickets and perform work:
          </Typography>
          
          <FormControl component="fieldset" sx={{ width: '100%' }}>
            <FormGroup>
              {vendorOrgs.map(org => {
                const colors = getOrgColor(org.id);
                return (
                  <FormControlLabel
                    key={org.id}
                    control={
                      <Checkbox 
                        checked={!!techOrgSelections[org.id]} 
                        onChange={() => handleOrgSelectionChange(org.id)}
                        sx={{
                          '&.Mui-checked': {
                            color: colors.border,
                          }
                        }}
                      />
                    }
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body1">{org.name}</Typography>
                      </Box>
                    }
                    sx={{
                      padding: '8px',
                      margin: '2px 0',
                      borderRadius: '4px',
                      '&:hover': { backgroundColor: 'rgba(0,0,0,0.04)' },
                      ...(!!techOrgSelections[org.id] ? {
                        backgroundColor: colors.bg,
                        borderColor: colors.border,
                      } : {})
                    }}
                  />
                );
              })}
            </FormGroup>
          </FormControl>
          
          {vendorOrgs.length === 0 && (
            <Alert severity="info" sx={{ mt: 2 }}>
              No organizations available for this vendor.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOrgContextDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveOrgContexts} variant="contained" color="primary">
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Ticket Details Drawer */}
      <Drawer
        anchor="right"
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        sx={{
          '& .MuiDrawer-paper': {
            width: '50%',
            minWidth: 600,
            p: 3,
            overflowY: 'auto',
          },
        }}
      >
        {selectedTicket && (
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h5" gutterBottom>
                Ticket Details
              </Typography>
              <IconButton onClick={() => setIsDrawerOpen(false)}>
                <CloseIcon />
              </IconButton>
            </Box>
            
            <Divider sx={{ mb: 2 }} />
            
            {/* Ticket Progress Bar */}
            <Card variant="outlined" sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                  Ticket Progress
                </Typography>
                <Stepper activeStep={determineCurrentStep(selectedTicket)} orientation="vertical" sx={{ mt: 2 }}>
                  {TICKET_WORKFLOW.map((step, index) => (
                    <Step key={step.key} completed={index <= determineCurrentStep(selectedTicket)}>
                      <StepLabel 
                        optional={<Typography variant="caption">{step.description}</Typography>}
                      >
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontWeight: index === determineCurrentStep(selectedTicket) ? 'bold' : 'normal',
                            color: index === determineCurrentStep(selectedTicket) ? 'primary.main' : 'inherit'
                          }}
                        >
                          {step.label}
                        </Typography>
                      </StepLabel>
                    </Step>
                  ))}
                </Stepper>
              </CardContent>
            </Card>
            
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="subtitle2">Ticket #</Typography>
                <Typography variant="body1" gutterBottom>{selectedTicket.ticketNo || selectedTicket.id}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2">Status</Typography>
                <Chip 
                  label={selectedTicket.status} 
                  color={
                    selectedTicket.status === 'completed' ? 'success' : 
                    selectedTicket.status === 'in_progress' ? 'primary' : 
                    selectedTicket.status === 'cancelled' ? 'error' : 'default'
                  }
                  size="small"
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2">Date/Time</Typography>
                <Typography variant="body1" gutterBottom>
                  {new Date(selectedTicket.dateTime || selectedTicket.createdAt).toLocaleString()}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2">Location</Typography>
                <Typography variant="body1" gutterBottom>
                  {getLocationName(selectedTicket.locationId) || 'Not specified'}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2">Issue Type</Typography>
                <Typography variant="body1" gutterBottom>
                  {ISSUE_TYPES.find(type => type.value === selectedTicket.issueType)?.label || selectedTicket.issueType || 'Not specified'}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2">Description</Typography>
                <Typography variant="body1" gutterBottom>
                  {selectedTicket.description || 'No description provided'}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2">Placed By</Typography>
                <Typography variant="body1" gutterBottom>
                  {selectedTicket.placedBy || 'Unknown'}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2">Assigned To</Typography>
                <Typography variant="body1" gutterBottom>
                  {getAssignedVendor(selectedTicket) || 'Unassigned'}
                </Typography>
              </Grid>
            </Grid>
            
            <Divider sx={{ my: 2 }} />
            
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button 
                variant="outlined" 
                onClick={() => navigate(`/tickets/${selectedTicket.id}`)}
                startIcon={<OpenInNewIcon />}
                sx={{ mt: 2 }}
              >
                Open Full Details
              </Button>
            </Box>
          </Box>
        )}
      </Drawer>
    </Box>
  );
};

export default VendorDetail;
