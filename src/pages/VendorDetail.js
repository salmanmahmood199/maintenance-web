import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box,
  Container,
  Typography,
  Button,
  Tabs,
  Tab,
  Divider,
  Chip,
  Avatar,
  Paper,
  Grid,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Checkbox,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormGroup,
  Stepper,
  Step,
  StepLabel,
  Drawer,
  Breadcrumbs,
  Link,
  FormControl,
  InputLabel,
  Select,
  OutlinedInput,
  ListItemText,
  FormHelperText
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  ArrowDropDown as ArrowDropDownIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useData } from '../context/DataContext';
import RefreshIcon from '@mui/icons-material/Refresh';
import AssignmentIcon from '@mui/icons-material/Assignment';

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
    getTickets,
    refreshData
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
  // State for ticket details drawer
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);

  // Load technicians when component mounts - moved up from conditional position
  useEffect(() => {
    if (id) {
      setTechnicians(getTechnicians(id));
    }
  }, [id, getTechnicians]);

  // Get vendor data
  const vendor = getVendor(id);
  const { getLocations, getVendors } = useData();
  const locations = getLocations();
  
  // Determine current step in ticket workflow
  const determineCurrentStep = (ticket) => {
    if (!ticket || !ticket.status) return 0;
    
    const status = ticket.status.toLowerCase();
    // Define workflow steps similar to Habeeb's implementation
    const TICKET_WORKFLOW = [
      { key: 'new', label: 'New', description: 'Ticket created', status: 'New' },
      { key: 'assigned', label: 'Assigned', description: 'Assigned to vendor', status: 'Assigned' },
      { key: 'in_progress', label: 'In Progress', description: 'Work in progress', status: 'In Progress' },
      { key: 'completed', label: 'Completed', description: 'Work completed', status: 'Completed' },
      { key: 'verified', label: 'Verified', description: 'Work verified', status: 'Verified' }
    ];
    
    const stepIndex = TICKET_WORKFLOW.findIndex(step => 
      step.key === status || 
      step.status.toLowerCase() === status
    );
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
    const assignedVendor = getVendors().find(v => v.id === vendorId);
    return assignedVendor ? assignedVendor.name : 'Unknown Vendor';
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
  
  // Function to refresh data
  const handleRefreshData = async () => {
    console.log('Refreshing vendor data...');
    console.log('Current vendor ID:', id);
    await refreshData();
    
    // After refresh, log the tickets for debugging
    const refreshedTickets = getTickets();
    console.log('All tickets after refresh:', refreshedTickets);
    console.log('TICK-2873 ticket:', refreshedTickets.find(t => t.ticketNo === 'TICK-2873'));
    
    // Check if the vendor can see the ticket
    const vendorVisibleTickets = refreshedTickets.filter(ticket => 
      ticket.assignedVendorId === id || ticket.vendorId === id
    );
    console.log('Vendor visible tickets:', vendorVisibleTickets);
  };
  
  // Get tickets assigned to this vendor - check both assignedVendorId and vendorId fields
  const allTickets = getTickets();
  
  // Filter tickets for this vendor - handles both vendorId and legacy assignedVendorId field
  const vendorTickets = allTickets.filter(ticket => 
    ticket.vendorId === id || ticket.assignedVendorId === id
  );
  
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
  
  // Filter tickets by selected organization - handles both orgId and organizationId fields
  const filteredTickets = selectedOrgId 
    ? vendorTickets.filter(ticket => 
        ticket.orgId === selectedOrgId || 
        ticket.organizationId === selectedOrgId
      )
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
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={handleRefreshData}
              sx={{ ml: 1 }}
            >
              Refresh Tickets
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
                      <Box sx={{ p: 2 }}>
                        <Typography variant="body1" gutterBottom>
                          No tickets found for this vendor.
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {vendorTickets.length > 0 ? 
                            "Try clearing any organization filters to see all tickets." : 
                            "This vendor doesn't have any tickets assigned yet."}
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTickets.map((ticket) => {
                    // Get organization data using either orgId or organizationId
                    const org = organizations.find(o => 
                      o.id === ticket.orgId || o.id === ticket.organizationId
                    );
                    
                    // Get location data directly from locations collection
                    const location = locations.find(l => l.id === ticket.locationId);
                    
                    // Use consistent orgId for color coding and reference
                    const orgId = ticket.orgId || ticket.organizationId;
                    
                    return (
                      <TableRow 
                        key={ticket.id}
                        sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                        onClick={() => {
                          setSelectedTicket(ticket);
                          setIsDrawerOpen(true);
                          console.log('Selected ticket:', ticket);
                        }}
                        style={{ cursor: 'pointer' }}
                      >
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <AssignmentIcon color="primary" sx={{ mr: 1 }} />
                            {ticket.id}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight="bold">
                              {ticket.ticketNo || `Ticket ${ticket.id.substring(4, 8)}`}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {ticket.description || ticket.issueType || 'No description'}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={org?.name || 'Unknown'} 
                            size="small"
                            sx={{
                              backgroundColor: getOrgColor(orgId).bg,
                              border: '1px solid',
                              borderColor: getOrgColor(orgId).border
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
          '& .MuiDrawer-paper': { width: { xs: '100%', sm: '60%', md: '50%', lg: '40%' } },
        }}
      >
        {selectedTicket && (
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h5" component="h2">
                Ticket Details
              </Typography>
              <IconButton onClick={() => setIsDrawerOpen(false)}>
                <CloseIcon />
              </IconButton>
            </Box>
            
            <Divider sx={{ mb: 2 }} />
            
            {/* Ticket Title & ID */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                {selectedTicket.title || selectedTicket.description?.substring(0, 50) || 'Untitled Ticket'}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                ID: {selectedTicket.id}
              </Typography>
            </Box>
            
            {/* Ticket Status with color */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" component="span" sx={{ mr: 1 }}>
                Status:
              </Typography>
              <Chip 
                label={selectedTicket.status || 'Unknown'} 
                color={
                  selectedTicket.status?.toLowerCase() === 'completed' ? 'success' :
                  selectedTicket.status?.toLowerCase() === 'in progress' ? 'warning' :
                  selectedTicket.status?.toLowerCase() === 'open' ? 'info' : 'default'
                }
                size="small"
              />
            </Box>
            
            {/* Ticket Details in a grid */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Priority:</Typography>
                <Typography variant="body2">{selectedTicket.priority || 'Not set'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Location:</Typography>
                <Typography variant="body2">{getLocationName(selectedTicket.locationId) || 'Unknown'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Assigned Vendor:</Typography>
                <Typography variant="body2">{getAssignedVendor(selectedTicket)}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Created:</Typography>
                <Typography variant="body2">
                  {selectedTicket.createdAt ? new Date(selectedTicket.createdAt).toLocaleString() : 'Unknown'}
                </Typography>
              </Grid>
            </Grid>
            
            {/* Description */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>Description:</Typography>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="body2">
                  {selectedTicket.description || 'No description provided'}
                </Typography>
              </Paper>
            </Box>
            
            {/* Ticket Workflow */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>Workflow Progress:</Typography>
              <Stepper activeStep={determineCurrentStep(selectedTicket)} alternativeLabel>
                <Step key="new">
                  <StepLabel>New</StepLabel>
                </Step>
                <Step key="assigned">
                  <StepLabel>Assigned</StepLabel>
                </Step>
                <Step key="in_progress">
                  <StepLabel>In Progress</StepLabel>
                </Step>
                <Step key="completed">
                  <StepLabel>Completed</StepLabel>
                </Step>
                <Step key="verified">
                  <StepLabel>Verified</StepLabel>
                </Step>
              </Stepper>
            </Box>
            
            {/* Action Buttons */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
              <Button 
                variant="contained" 
                color="primary"
                onClick={() => {
                  setIsDrawerOpen(false);
                  navigate(`/tickets/${selectedTicket.id}`);
                }}
              >
                View Full Details
              </Button>
            </Box>
          </Box>
        )}
      </Drawer>
      
    </Box>
  );
};

export default VendorDetail;
