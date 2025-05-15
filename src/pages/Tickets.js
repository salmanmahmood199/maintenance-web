import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Divider,
  Grid,
  Alert,
  Stepper,
  Step,
  StepLabel,
  StepButton,
  StepContent,
  Card,
  CardContent,
  Tooltip
} from '@mui/material';
import { 
  Add as AddIcon, 
  Visibility as VisibilityIcon,
  PersonAdd as AssignIcon,
  PlayArrow as StartIcon,
  Pause as PauseIcon,
  Check as CompleteIcon,
  Verified as VerifyIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { useParams } from 'react-router-dom';

// Issue types
const ISSUE_TYPES = [
  { value: 'electrical', label: 'Electrical' },
  { value: 'plumbing', label: 'Plumbing' },
  { value: 'hvac', label: 'HVAC' },
  { value: 'structural', label: 'Structural' },
  { value: 'cleaning', label: 'Cleaning' },
  { value: 'other', label: 'Other' }
];

// Status colors
const STATUS_COLORS = {
  'New': 'error',
  'Assigned': 'warning',
  'In Progress': 'info',
  'Paused': 'default',
  'Completed': 'success',
  'Verified': 'secondary'
};

// Ticket workflow stages
const TICKET_WORKFLOW = [
  { key: 'created', label: 'Ticket Placed', description: 'Maintenance request submitted', status: 'New' },
  { key: 'pending_approval', label: 'Pending Approval', description: 'Waiting for approval from admin', status: 'New' },
  { key: 'assigned', label: 'Vendor Assigned', description: 'Ticket assigned to vendor', status: 'Assigned' },
  { key: 'work_order', label: 'Work Order Created', description: 'Vendor created work order', status: 'Assigned' },
  { key: 'in_progress', label: 'Work In Progress', description: 'Vendor is working on the issue', status: 'In Progress' },
  { key: 'invoice_uploaded', label: 'Invoice Uploaded', description: 'Work completed and invoice uploaded', status: 'Completed' },
  { key: 'awaiting_approval', label: 'Awaiting Approval', description: 'Waiting for final approval', status: 'Completed' },
  { key: 'completed', label: 'Order Complete', description: 'All work verified and completed', status: 'Verified' }
];

const Tickets = () => {
  const { user, currentUser } = useAuth();
  const { 
    getTickets, 
    addTicket,
    getVendors,
    getLocations,
    getTicket,
    assignTicket,
    startWork,
    pauseWork,
    completeWork,
    verifyCompletion,
    hasLocationAccess,
    hasTicketTierAccess,
    shouldEscalateToTier1B,
    systemConfig,
    getAccessibleLocations
  } = useData();

  // States
  const [dialogOpen, setDialogOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState(null);
  const [actionNote, setActionNote] = useState('');
  const [selectedVendor, setSelectedVendor] = useState('');
  
  // Generate a temporary ticket number for preview
  const generateTempTicketNo = () => {
    return `TICK-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
  };
  
  // Filter states
  const [filters, setFilters] = useState({
    ticketNo: '',
    locationId: '',
    issueType: '',
    status: '',
    dateFrom: '',
    dateTo: '',
    priority: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [filteredTickets, setFilteredTickets] = useState([]);
  
  // Add state for storing async data
  const [tickets, setTickets] = useState([]);
  const [locations, setLocations] = useState([]);
  const [vendors, setVendors] = useState([]);
  
  // Apply filters to tickets
  const applyFilters = useCallback(() => {
    if (!tickets || tickets.length === 0) {
      setFilteredTickets([]);
      return;
    }
    
    let filtered = [...tickets];
    
    // For subadmins, we only filter by location access, not by tier access
    // This allows subadmins to view all tickets for locations they have access to
    // Actions on tickets will still be restricted by permissions
    
    // Filter by ticket number
    if (filters.ticketNo) {
      filtered = filtered.filter(ticket => 
        ticket.ticketNo.toLowerCase().includes(filters.ticketNo.toLowerCase())
      );
    }
    
    // Filter by location
    if (filters.locationId) {
      filtered = filtered.filter(ticket => ticket.locationId === filters.locationId);
    }
    
    // Filter by issue type
    if (filters.issueType) {
      filtered = filtered.filter(ticket => ticket.issueType === filters.issueType);
    }
    
    // Filter by status
    if (filters.status) {
      filtered = filtered.filter(ticket => ticket.status === filters.status);
    }
    
    // Filter by priority
    if (filters.priority) {
      filtered = filtered.filter(ticket => ticket.priority === filters.priority);
    }
    
    // Filter by date range
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      filtered = filtered.filter(ticket => new Date(ticket.dateTime) >= fromDate);
    }
    
    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      // Set time to end of day
      toDate.setHours(23, 59, 59);
      filtered = filtered.filter(ticket => new Date(ticket.dateTime) <= toDate);
    }
    
    setFilteredTickets(filtered);
  }, [tickets, filters]);

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Clear all filters
  const clearFilters = () => {
    setFilters({
      ticketNo: '',
      locationId: '',
      issueType: '',
      status: '',
      dateFrom: '',
      dateTo: '',
      priority: ''
    });
  };
  
  // Toggle filter panel
  const toggleFilters = () => {
    setShowFilters(prev => !prev);
  };
  
  // Form data
  const [formData, setFormData] = useState({
    ticketNo: generateTempTicketNo(), // Auto-generated ticket number
    locationId: '',
    issueType: '',
    description: '',
    placedBy: user?.email || '',
    notes: '',
    timestamp: new Date().toISOString(),
    priority: 'medium',
    mediaUrls: [] // Will store file upload references
  });
  
  // State for file uploads
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [filePreviewUrls, setFilePreviewUrls] = useState([]);

  // Fetch data when component mounts
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get available locations based on user role
        let availableLocations = [];
        if (currentUser?.role === 'subadmin') {
          availableLocations = await getAccessibleLocations(currentUser.id);
        } else {
          availableLocations = await getLocations();
        }
        setLocations(availableLocations);
        
        // Get vendors
        const vendorsList = await getVendors();
        setVendors(vendorsList);
        
        // Get tickets based on available locations
        if (availableLocations.length > 0) {
          // For super admin, get all tickets
          // For sub-admin, only get tickets related to their assigned locations
          let ticketsList = [];
          if (currentUser?.role === 'root') {
            ticketsList = await getTickets();
          } else {
            // Get tickets for each location the user has access to
            const locationIds = availableLocations.map(loc => loc.id);
            const allTickets = await getTickets();
            // Simply filter by location access - allow subadmins to see all tickets for their locations
            ticketsList = allTickets.filter(ticket => locationIds.includes(ticket.locationId));
          }
          setTickets(ticketsList);
          setFilteredTickets(ticketsList); // Initialize filtered tickets with all tickets
        } else {
          setTickets([]);
          setFilteredTickets([]);
          setLocations([]);
          setVendors([]);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        alert(`Error: ${error.message}`);
        
        // Clear data in case of error
        setTickets([]);
        setFilteredTickets([]);
        setLocations([]);
        setVendors([]);
      }
    };
    
    fetchData();
  }, [getTickets, getLocations, getVendors, getAccessibleLocations, currentUser]);
  
  // Apply filters when filters change or tickets change
  useEffect(() => {
    applyFilters();
  }, [applyFilters, tickets]);

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle file upload
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(prev => [...prev, ...files]);
    
    // Create preview URLs for images
    const newPreviewUrls = files.map(file => {
      // Only create previews for images
      if (file.type.startsWith('image/')) {
        return URL.createObjectURL(file);
      }
      // For non-images, return a placeholder or icon
      return file.type.includes('video') 
        ? '/video-placeholder.png' // placeholder for videos
        : '/file-placeholder.png';  // placeholder for other files
    });
    
    setFilePreviewUrls(prev => [...prev, ...newPreviewUrls]);
  };
  
  // Remove a file
  const handleRemoveFile = (index) => {
    // Release object URL to avoid memory leaks
    if (filePreviewUrls[index] && filePreviewUrls[index].startsWith('blob:')) {
      URL.revokeObjectURL(filePreviewUrls[index]);
    }
    
    // Remove file and preview
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setFilePreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  // Handle dialog open/close
  const handleOpenDialog = () => setDialogOpen(true);
  const handleCloseDialog = () => {
    setDialogOpen(false);
    
    // Release object URLs to avoid memory leaks
    filePreviewUrls.forEach(url => {
      if (url && url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    });
    
    // Reset all form states
    setSelectedFiles([]);
    setFilePreviewUrls([]);
    
    // Reset form data with a new ticket number
    setFormData({
      ticketNo: generateTempTicketNo(), // Generate a new ticket number
      locationId: '',
      issueType: '',
      description: '',
      placedBy: user?.email || '',
      notes: '',
      timestamp: new Date().toISOString(),
      priority: 'medium',
      mediaUrls: []
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Validation
      if (!formData.locationId || !formData.issueType || !formData.description) {
        alert('Please fill in all required fields');
        return;
      }
      
      // Determine initial tier based on priority
      // Tier 1 is default, but we'll set an additional property for 1A/1B distinction
      let ticketTier = 1;
      let is1A = formData.priority === 'high';
      
      // Create ticket data
      const newTicket = {
        ...formData,
        status: 'New',
        tier: ticketTier,       // Numeric tier (1, 2, or 3)
        tierType: is1A ? '1A' : '1B', // String designation for Tier 1 subtypes
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: user?.id || 'anonymous',
        workOrders: []
      };
      
      // Add ticket
      await addTicket(newTicket);
      
      // Refresh tickets
      const updatedTickets = await getTickets();
      setTickets(updatedTickets || []);
      
      // Close dialog and reset form
      setDialogOpen(false);
      setFormData({
        ticketNo: generateTempTicketNo(),
        locationId: '',
        issueType: '',
        description: '',
        files: [],
        status: 'New',
        priority: 'medium'
      });
    } catch (error) {
      console.error('Error creating ticket:', error);
      alert(`Error creating ticket: ${error.message}`);
    }
  };

  // Open ticket detail drawer
  const handleViewTicket = (ticketId) => {
    const ticket = getTicket(ticketId);
    setSelectedTicket(ticket);
    setDrawerOpen(true);
  };

  // Close drawer
  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setSelectedTicket(null);
  };

  // Get location name
  const getLocationName = (locationId) => {
    const location = locations.find(loc => loc.id === locationId);
    return location ? location.name : 'Unknown Location';
  };

  // Get vendor name
  const getVendorName = (vendorId) => {
    const vendor = vendors.find(v => v.id === vendorId);
    return vendor ? vendor.name : 'Unassigned';
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  // Determine the current step in the workflow
  const determineCurrentStep = (ticket) => {
    if (!ticket) return 0; // Default to first step
    
    // Early completion logic
    if (ticket.status === 'Verified') {
      return TICKET_WORKFLOW.length - 1; // Last step (completed)
    }
    
    // Determine progress based on status and other fields
    switch (ticket.status) {
      case 'New':
        return ticket.adminApproved ? 1 : 0; // Either "Ticket Placed" or "Pending Approval"
        
      case 'Assigned':
        return ticket.workOrderCreated ? 3 : 2; // Either "Vendor Assigned" or "Work Order Created"
        
      case 'In Progress':
        return 4; // "Work In Progress"
        
      case 'Completed':
        return ticket.invoiceUploaded ? 
          (ticket.finalApprovalRequested ? 6 : 5) : // "Invoice Uploaded" or "Awaiting Approval"
          5; // Default to "Invoice Uploaded" if we don't have explicit flags
        
      case 'Paused':
        return 4; // Consider "Paused" as still in the "Work In Progress" step
        
      default:
        return 0;
    }
  };

  // Handle action button click
  const handleActionClick = (type) => {
    setActionType(type);
    setActionNote('');
    setSelectedVendor('');
    setActionDialogOpen(true);
  };

  // Handle action dialog close
  const handleCloseActionDialog = () => {
    setActionDialogOpen(false);
    setActionType(null);
  };

  // Handle action submission
  const handleActionSubmit = async () => {
    if (!selectedTicket) return;
    
    try {
      switch (actionType) {
        case 'assign':
          await assignTicket(selectedTicket.id, selectedVendor);
          break;
        case 'start':
          await startWork(selectedTicket.id);
          break;
        case 'pause':
          await pauseWork(selectedTicket.id, actionNote);
          break;
        case 'complete':
          await completeWork(selectedTicket.id, actionNote);
          break;
        case 'verify':
          await verifyCompletion(selectedTicket.id);
          break;
        default:
          break;
      }
      
      // Refresh tickets data after action
      const newTickets = await getTickets();
      setTickets(newTickets || []);
      
      // Get updated ticket info
      const updatedTicket = await getTicket(selectedTicket.id);
      setSelectedTicket(updatedTicket);
      
      handleCloseActionDialog();
    } catch (error) {
      console.error(`Error processing ${actionType} action:`, error);
      alert(`Error: ${error.message}`);
      handleCloseActionDialog();
    }
  };

  // Render action buttons based on ticket status and tier access
  const renderActionButtons = (ticket) => {
    if (!ticket) return null;
    
    const currentStepInfo = determineCurrentStep(ticket) || {};
    const isAssigned = ticket.assignedVendorId;
    const isInProgress = ticket.status === 'In Progress';
    const isPaused = ticket.status === 'Paused';
    const isCompleted = ticket.status === 'Completed';
    
    // Determine if the current user has tier access for this ticket
    const ticketTier = ticket.tier || 1;
    const tierType = ticket.tierType || (ticketTier === 1 ? '1A' : String(ticketTier));
    
    // Check if the ticket should be escalated from Tier 1A to 1B
    const isEscalated = ticketTier === 1 && shouldEscalateToTier1B(ticket);
    
    // For sub-admins, check tier access permissions with the full ticket for time-based checks
    const hasTierAccess = user.role === 'subadmin' 
      ? hasTicketTierAccess(user.id, ticket.locationId, tierType || ticketTier, ticket)
      : true; // Root users and others have full access
    
    return (
      <Box sx={{ display: 'flex', gap: 1 }}>
        {/* Assign Button - Only show if user has tier access */}
        {!isAssigned && ticket.status === 'New' && hasTierAccess && (
          <Tooltip title="Assign to Vendor">
            <IconButton 
              color="primary" 
              onClick={() => handleActionClick('assign')}
              size="small"
            >
              <AssignIcon />
            </IconButton>
          </Tooltip>
        )}
        
        {/* Start Work Button */}
        {isAssigned && !isInProgress && !isCompleted && !isPaused && hasTierAccess && (
          <Tooltip title="Start Work">
            <IconButton 
              color="primary" 
              onClick={() => handleActionClick('start')}
              size="small"
            >
              <StartIcon />
            </IconButton>
          </Tooltip>
        )}
        
        {/* Pause Work Button */}
        {isInProgress && hasTierAccess && (
          <Tooltip title="Pause Work">
            <IconButton 
              color="warning" 
              onClick={() => handleActionClick('pause')}
              size="small"
            >
              <PauseIcon />
            </IconButton>
          </Tooltip>
        )}
        
        {/* Complete Work Button */}
        {(isInProgress || isPaused) && hasTierAccess && (
          <Tooltip title="Mark Completed">
            <IconButton 
              color="success" 
              onClick={() => handleActionClick('complete')}
              size="small"
            >
              <CompleteIcon />
            </IconButton>
          </Tooltip>
        )}
        
        {/* Verify Button */}
        {isCompleted && hasTierAccess && (
          <Tooltip title="Verify Completion">
            <IconButton 
              color="secondary" 
              onClick={() => handleActionClick('verify')}
              size="small"
            >
              <VerifyIcon />
            </IconButton>
          </Tooltip>
        )}
        
        {/* View Button - Always Available */}
        <Tooltip title="View Details">
          <IconButton 
            onClick={() => handleViewTicket(ticket.id)}
            size="small"
          >
            <VisibilityIcon />
          </IconButton>
        </Tooltip>
      </Box>
    );
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Tickets
        </Typography>
        <Box>
          <Button
            variant="outlined"
            sx={{ mr: 1 }}
            onClick={toggleFilters}
          >
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenDialog}
          >
            Create Ticket
          </Button>
        </Box>
      </Box>

      {/* Filter Panel */}
      {showFilters && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Filter Tickets
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Ticket Number"
                name="ticketNo"
                value={filters.ticketNo}
                onChange={handleFilterChange}
                size="small"
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth margin="normal" size="small">
                <InputLabel id="location-filter-label">Location</InputLabel>
                <Select
                  labelId="location-filter-label"
                  name="locationId"
                  value={filters.locationId}
                  label="Location"
                  onChange={handleFilterChange}
                >
                  <MenuItem value="">All Locations</MenuItem>
                  {locations.map((location) => (
                    <MenuItem key={location.id} value={location.id}>
                      {location.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth margin="normal" size="small">
                <InputLabel id="issue-filter-label">Issue Type</InputLabel>
                <Select
                  labelId="issue-filter-label"
                  name="issueType"
                  value={filters.issueType}
                  label="Issue Type"
                  onChange={handleFilterChange}
                >
                  <MenuItem value="">All Issues</MenuItem>
                  {ISSUE_TYPES.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth margin="normal" size="small">
                <InputLabel id="status-filter-label">Status</InputLabel>
                <Select
                  labelId="status-filter-label"
                  name="status"
                  value={filters.status}
                  label="Status"
                  onChange={handleFilterChange}
                >
                  <MenuItem value="">All Statuses</MenuItem>
                  <MenuItem value="New">New</MenuItem>
                  <MenuItem value="Assigned">Assigned</MenuItem>
                  <MenuItem value="In Progress">In Progress</MenuItem>
                  <MenuItem value="Paused">Paused</MenuItem>
                  <MenuItem value="Completed">Completed</MenuItem>
                  <MenuItem value="Verified">Verified</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth margin="normal" size="small">
                <InputLabel id="priority-filter-label">Priority</InputLabel>
                <Select
                  labelId="priority-filter-label"
                  name="priority"
                  value={filters.priority}
                  label="Priority"
                  onChange={handleFilterChange}
                >
                  <MenuItem value="">All Priorities</MenuItem>
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="critical">Critical</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="From Date"
                name="dateFrom"
                type="date"
                value={filters.dateFrom}
                onChange={handleFilterChange}
                InputLabelProps={{ shrink: true }}
                size="small"
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="To Date"
                name="dateTo"
                type="date"
                value={filters.dateTo}
                onChange={handleFilterChange}
                InputLabelProps={{ shrink: true }}
                size="small"
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3} sx={{ display: 'flex', alignItems: 'center' }}>
              <Button 
                variant="outlined" 
                onClick={clearFilters}
                sx={{ mt: 2 }}
                fullWidth
              >
                Clear Filters
              </Button>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Tickets Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Ticket #</TableCell>
              <TableCell>Date/Time</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Issue Type</TableCell>
              <TableCell>Priority/Tier</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Assigned To</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredTickets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  {tickets.length > 0 ? 'No tickets match the current filters' : 'No tickets found'}
                </TableCell>
              </TableRow>
            ) : (
              filteredTickets.map((ticket) => (
                <TableRow key={ticket.id}>
                  <TableCell>{ticket.ticketNo}</TableCell>
                  <TableCell>{formatDate(ticket.dateTime)}</TableCell>
                  <TableCell>{getLocationName(ticket.locationId)}</TableCell>
                  <TableCell>
                    {ISSUE_TYPES.find(type => type.value === ticket.issueType)?.label || ticket.issueType}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Chip 
                        label={ticket.priority || 'Medium'} 
                        size="small"
                        color={ticket.priority === 'high' ? 'error' : ticket.priority === 'low' ? 'default' : 'primary'}
                      />
                      {ticket.tierType && (
                        <Chip 
                          size="small" 
                          label={`Tier ${ticket.tierType}`}
                          color={ticket.tierType === '1A' ? 'error' : 'default'}
                          sx={{ ml: 1 }}
                        />
                      )}
                      {/* Show escalation indicator if the ticket is over 24 hours old */}
                      {shouldEscalateToTier1B(ticket) && (
                        <Tooltip title={`Escalated to Tier 1B after ${systemConfig.tier1AToTier1BEscalationTime/(1000*60*60)} hours`}>
                          <Chip 
                            size="small" 
                            label="1B Eligible"
                            color="warning"
                            variant="outlined"
                            sx={{ ml: 1 }}
                          />
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={ticket.status} 
                      color={STATUS_COLORS[ticket.status]} 
                      size="small" 
                    />
                  </TableCell>
                  <TableCell>{getVendorName(ticket.assignedVendorId)}</TableCell>
                  <TableCell>
                    <IconButton
                      color="primary"
                      onClick={() => handleViewTicket(ticket.id)}
                      title="View Ticket"
                    >
                      <VisibilityIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create Ticket Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Create Ticket</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            {/* Ticket Number - grayed out and auto-filled */}
            <TextField
              margin="normal"
              fullWidth
              id="ticketNo"
              label="Ticket #"
              name="ticketNo"
              value={formData.ticketNo}
              InputProps={{
                readOnly: true,
              }}
              disabled
              sx={{ backgroundColor: 'rgba(0, 0, 0, 0.05)', mb: 2 }}
            />
            
            {/* Timestamp field - grayed out and auto-filled */}
            <TextField
              margin="normal"
              fullWidth
              id="timestamp"
              label="Timestamp"
              name="timestamp"
              value={new Date(formData.timestamp).toLocaleString()}
              InputProps={{
                readOnly: true,
              }}
              disabled
              sx={{ backgroundColor: 'rgba(0, 0, 0, 0.05)', mb: 2 }}
            />
            
            {/* Placed By field - grayed out and auto-filled with current user */}
            <TextField
              margin="normal"
              required
              fullWidth
              id="placedBy"
              label="Placed By"
              name="placedBy"
              value={formData.placedBy}
              InputProps={{
                readOnly: true,
              }}
              disabled
              sx={{ backgroundColor: 'rgba(0, 0, 0, 0.05)', mb: 2 }}
            />
            
            <FormControl fullWidth margin="normal" required>
              <InputLabel id="location-label">Location</InputLabel>
              <Select
                labelId="location-label"
                id="locationId"
                name="locationId"
                value={formData.locationId}
                label="Location"
                onChange={handleChange}
              >
                {locations.length === 0 ? (
                  <MenuItem disabled value="">
                    No locations available
                  </MenuItem>
                ) : (
                  locations.map((location) => (
                    <MenuItem key={location.id} value={location.id}>
                      {location.name} - {location.address}, {location.city || ''}
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>
            
            <FormControl fullWidth margin="normal" required>
              <InputLabel id="issue-label">Issue Type</InputLabel>
              <Select
                labelId="issue-label"
                id="issueType"
                name="issueType"
                value={formData.issueType}
                label="Issue Type"
                onChange={handleChange}
              >
                {ISSUE_TYPES.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl fullWidth margin="normal" required>
              <InputLabel id="priority-label">Priority</InputLabel>
              <Select
                labelId="priority-label"
                id="priority"
                name="priority"
                value={formData.priority}
                label="Priority"
                onChange={handleChange}
              >
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="critical">Critical</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              margin="normal"
              required
              fullWidth
              id="description"
              label="Description"
              name="description"
              multiline
              rows={3}
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe the issue in detail"
            />
            
            <TextField
              margin="normal"
              fullWidth
              id="notes"
              label="Additional Notes"
              name="notes"
              multiline
              rows={2}
              value={formData.notes}
              onChange={handleChange}
              placeholder="Any additional information or context"
            />
            
            {/* File Upload Section */}
            <Box sx={{ mt: 3, mb: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Upload Images/Videos
              </Typography>
              
              <input
                accept="image/*,video/*"
                style={{ display: 'none' }}
                id="contained-button-file"
                multiple
                type="file"
                onChange={handleFileUpload}
              />
              <label htmlFor="contained-button-file">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<AddIcon />}
                >
                  Add Files
                </Button>
              </label>
              
              {/* File Preview Section */}
              {filePreviewUrls.length > 0 && (
                <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {filePreviewUrls.map((url, index) => (
                    <Box 
                      key={index} 
                      sx={{ 
                        position: 'relative',
                        width: 100, 
                        height: 100, 
                        border: '1px solid #ddd',
                        borderRadius: 1,
                        overflow: 'hidden'
                      }}
                    >
                      {url.startsWith('blob:') ? (
                        <img 
                          src={url} 
                          alt={`Preview ${index}`} 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        />
                      ) : (
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          width: '100%',
                          height: '100%',
                          bgcolor: '#f5f5f5',
                          color: 'text.secondary'
                        }}>
                          {url.includes('video') ? 'Video' : 'File'}
                        </Box>
                      )}
                      <IconButton 
                        size="small" 
                        sx={{ 
                          position: 'absolute', 
                          top: 0, 
                          right: 0, 
                          bgcolor: 'rgba(255,255,255,0.7)' 
                        }}
                        onClick={() => handleRemoveFile(index)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}
                </Box>
              )}  
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={locations.length === 0}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Ticket Detail Drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={handleCloseDrawer}
        sx={{
          '& .MuiDrawer-paper': { width: { xs: '100%', sm: 400 } },
        }}
      >
        {selectedTicket && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              Ticket Details
            </Typography>
            
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
                <Typography variant="body1" gutterBottom>{selectedTicket.ticketNo}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2">Status</Typography>
                <Chip 
                  label={selectedTicket.status} 
                  color={STATUS_COLORS[selectedTicket.status]} 
                  size="small" 
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2">Date/Time</Typography>
                <Typography variant="body1" gutterBottom>{formatDate(selectedTicket.dateTime)}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2">Location</Typography>
                <Typography variant="body1" gutterBottom>{getLocationName(selectedTicket.locationId)}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2">Issue Type</Typography>
                <Typography variant="body1" gutterBottom>
                  {ISSUE_TYPES.find(type => type.value === selectedTicket.issueType)?.label || selectedTicket.issueType}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2">Description</Typography>
                <Typography variant="body1" gutterBottom>{selectedTicket.description}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2">Placed By</Typography>
                <Typography variant="body1" gutterBottom>{selectedTicket.placedBy}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2">Assigned To</Typography>
                <Typography variant="body1" gutterBottom>
                  {getVendorName(selectedTicket.assignedVendorId)}
                </Typography>
              </Grid>
            </Grid>
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="h6" gutterBottom>
              Actions
            </Typography>
            
            {renderActionButtons(selectedTicket)}
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="h6" gutterBottom>
              Work History
            </Typography>
            
            {selectedTicket.workOrders && selectedTicket.workOrders.length > 0 ? (
              <List dense>
                {selectedTicket.workOrders.map((workOrder, index) => (
                  <ListItem key={index} divider>
                    <ListItemText
                      primary={
                        workOrder.type.charAt(0).toUpperCase() + workOrder.type.slice(1)
                      }
                      secondary={
                        <>
                          {formatDate(workOrder.timestamp)}
                          {workOrder.note && (
                            <Typography variant="body2" component="div">
                              {workOrder.note}
                            </Typography>
                          )}
                          {workOrder.verifiedBy && (
                            <Typography variant="body2" component="div">
                              Verified by: {workOrder.verifiedBy}
                            </Typography>
                          )}
                        </>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No work history available
              </Typography>
            )}
            
            <Button 
              onClick={handleCloseDrawer} 
              fullWidth 
              sx={{ mt: 3 }}
            >
              Close
            </Button>
          </Box>
        )}
      </Drawer>

      {/* Action Dialog */}
      <Dialog open={actionDialogOpen} onClose={handleCloseActionDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {actionType === 'assign' && 'Assign Ticket'}
          {actionType === 'start' && 'Start Work'}
          {actionType === 'pause' && 'Pause Work'}
          {actionType === 'complete' && 'Complete Work'}
          {actionType === 'verify' && 'Verify Completion'}
        </DialogTitle>
        <DialogContent>
          {actionType === 'assign' && (
            <FormControl fullWidth margin="normal" required>
              <InputLabel id="vendor-label">Vendor</InputLabel>
              <Select
                labelId="vendor-label"
                id="vendor"
                value={selectedVendor}
                label="Vendor"
                onChange={(e) => setSelectedVendor(e.target.value)}
              >
                {vendors.length === 0 ? (
                  <MenuItem disabled value="">
                    No vendors available
                  </MenuItem>
                ) : (
                  vendors.map((vendor) => (
                    <MenuItem key={vendor.id} value={vendor.id}>
                      {vendor.name}
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>
          )}
          
          {(actionType === 'pause' || actionType === 'complete') && (
            <TextField
              margin="normal"
              required
              fullWidth
              id="note"
              label="Note"
              multiline
              rows={4}
              value={actionNote}
              onChange={(e) => setActionNote(e.target.value)}
            />
          )}
          
          {actionType === 'verify' && (
            <Alert severity="info">
              This will mark the ticket as verified and complete the workflow.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseActionDialog}>Cancel</Button>
          <Button 
            onClick={handleActionSubmit} 
            variant="contained"
            disabled={
              (actionType === 'assign' && !selectedVendor) ||
              ((actionType === 'pause' || actionType === 'complete') && !actionNote)
            }
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Tickets;
