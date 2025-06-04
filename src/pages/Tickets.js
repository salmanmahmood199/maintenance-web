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
  Delete as DeleteIcon,
  ThumbUp as AcceptIcon,
  ThumbDown as RejectIcon,
  HelpOutline as RequestInfoIcon
} from '@mui/icons-material';
import { useData } from '../context/DataContext';
import { v4 as uuidv4 } from 'uuid';
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
  'Verified': 'secondary',
  'Rejected': 'error',
  'More Info Needed': 'info'
};

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
    acceptTicketByVendor,
    rejectTicketByVendor,
    requestMoreInfoByVendor,
    hasLocationAccess,
    hasTicketTierAccess,
    systemConfig,
    getAccessibleLocations,
    provideMoreInfo
  } = useData();

  // States
  const [dialogOpen, setDialogOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState(null);
  const [actionNote, setActionNote] = useState('');
  const [selectedVendor, setSelectedVendor] = useState('');
  const [filteredVendors, setFilteredVendors] = useState([]);
  const [moreInfoDialogOpen, setMoreInfoDialogOpen] = useState(false);
  const [additionalInfo, setAdditionalInfo] = useState('');
  
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
      
      // All tickets are now set to Tier 1 for access control purposes only
      // Tier is no longer based on severity or priority
      
      // Create ticket data
      const newTicket = {
        ...formData,
        status: 'New',
        tier: 1,     // All tickets start at Tier 1 for access control purposes
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

  // This function gets the assigned vendor for a ticket
  // It checks both vendorId and assignedVendorId fields for compatibility
  const getAssignedVendor = (ticket) => {
    // Try both vendorId and assignedVendorId fields (for backward compatibility)
    const vendorId = ticket.vendorId || ticket.assignedVendorId;
    return getVendorName(vendorId);
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  // Determine the current step in the workflow
  const determineCurrentStep = (ticket) => {
    if (!ticket) return 'created';
    
    // If the ticket has a currentStep field, use that directly
    if (ticket.currentStep && TICKET_WORKFLOW.some(step => step.key === ticket.currentStep)) {
      return ticket.currentStep;
    }
    
    // Otherwise fallback to status-based determination
    switch(ticket.status) {
      case 'New':
        return 'created';
      case 'Assigned':
        // Check for vendor response steps
        if (ticket.workOrders?.some(wo => wo.type === 'vendor_accepted')) {
          return 'vendor_accepted';
        }
        // If work has been started, check if we have work orders
        if (ticket.workOrders?.some(wo => wo.type === 'work_started')) {
          return 'work_order';
        }
        return 'waiting_vendor_response';
      case 'Rejected':
        return 'vendor_rejected';
      case 'More Info Needed':
        return 'more_info_requested';
      case 'In Progress':
        return 'in_progress';
      case 'Completed':
        if (ticket.workOrders?.some(wo => wo.type === 'invoice_uploaded')) {
          return 'invoice_uploaded';
        }
        if (ticket.workOrders?.some(wo => wo.type === 'work_completed' || wo.type === 'approval_requested')) {
          return 'awaiting_approval';
        }
        return 'in_progress';
      case 'Verified':
        return 'completed';
      default:
        return 'created';
    }
  };

  // Handle action button click
  const handleActionClick = (type) => {
    setActionType(type);
    setActionNote('');
    setSelectedVendor('');
    
    // Always initialize filteredVendors as an empty array to prevent undefined errors
    setFilteredVendors([]);
    
    // For ticket assignment, filter vendors to only show those associated with the ticket's organization
    // We're NOT checking for location assignment - only organization membership
    if (type === 'assign' && selectedTicket) {
      try {
        // Get the organization ID from the location
        const location = locations.find(loc => loc.id === selectedTicket.locationId);
        if (location && location.orgId) {
          const orgId = location.orgId;
          console.log('Found location with orgId:', orgId);
          
          // Make sure we have vendors loaded
          if (!Array.isArray(vendors) || vendors.length === 0) {
            let allVendors = getVendors();
            // Ensure allVendors is an array
            allVendors = Array.isArray(allVendors) ? allVendors : [];
            setVendors(allVendors);
            
            // Filter vendors for this organization - ONLY check org membership, not location assignment
            const orgVendors = allVendors.filter(vendor => 
              vendor && Array.isArray(vendor.orgIds) && vendor.orgIds.includes(orgId) && 
              vendor.status !== 'inactive' // Only show active vendors
            ) || [];
            setFilteredVendors(orgVendors);
            console.log('Filtered vendors for org:', orgVendors.length);
          } else {
            // Filter vendors to only show those assigned to this organization
            const orgVendors = vendors.filter(vendor => 
              vendor && Array.isArray(vendor.orgIds) && vendor.orgIds.includes(orgId) &&
              vendor.status !== 'inactive' // Only show active vendors
            ) || [];
            setFilteredVendors(orgVendors);
            console.log('Filtered vendors for org:', orgVendors.length);
          }
        } else {
          console.log('Location or orgId not found');
          setFilteredVendors([]);
        }
      } catch (error) {
        console.error('Error filtering vendors:', error);
        setFilteredVendors([]);
      }
    }
    
    setActionDialogOpen(true);
  };

  // Handle action dialog close
  const handleCloseActionDialog = () => {
    setActionDialogOpen(false);
    setActionType(null);
  };
  
  // Handle action submission
  const handleActionSubmit = () => {
    if (!selectedTicket) return;
    
    try {
      switch (actionType) {
        case 'assign':
          assignTicket(selectedTicket.id, selectedVendor);
          break;
        case 'start':
          startWork(selectedTicket.id);
          break;
        case 'pause':
          pauseWork(selectedTicket.id, actionNote);
          break;
        case 'complete':
          completeWork(selectedTicket.id, actionNote);
          break;
        case 'accept':
          acceptTicketByVendor(selectedTicket.id, actionNote);
          break;
        case 'reject':
          rejectTicketByVendor(selectedTicket.id, actionNote);
          break;
        case 'requestInfo':
          requestMoreInfoByVendor(selectedTicket.id, actionNote);
          break;
        case 'verify':
          verifyCompletion(selectedTicket.id);
          break;
        default:
          break;
      }
      
      // Refresh tickets data after action
      const updatedTickets = getTickets();
      // Update tickets state to trigger the useEffect that will call applyFilters
      setTickets(updatedTickets);
      
      // Get updated ticket info
      const updatedTicket = getTicket(selectedTicket.id);
      setSelectedTicket(updatedTicket);
      
      handleCloseActionDialog();
    } catch (error) {
      console.error(`Error processing ${actionType} action:`, error);
      alert(`Error: ${error.message || 'An error occurred'}`);
      handleCloseActionDialog();
    }
  };
  
  // Open more info dialog
  const handleMoreInfoClick = () => {
    setAdditionalInfo('');
    setMoreInfoDialogOpen(true);
  };
  
  // Close more info dialog
  const handleCloseMoreInfoDialog = () => {
    setMoreInfoDialogOpen(false);
    setAdditionalInfo('');
  };
  
  // Submit additional info
  const handleMoreInfoSubmit = () => {
    if (!selectedTicket || !additionalInfo.trim()) return;
    
    const success = provideMoreInfo(selectedTicket.id, additionalInfo);
    
    if (success) {
      // Refresh tickets
      // We use the existing fetchData method from earlier in the component
      const updatedTickets = getTickets();
      setFilteredTickets(applyFilters(updatedTickets));
      
      // Close dialog
      setMoreInfoDialogOpen(false);
      // Close drawer
      setDrawerOpen(false);
      setSelectedTicket(null);
    }
  };

  // Render action buttons based on ticket status and tier access
  const renderActionButtons = (ticket) => {
    if (!ticket) return null;
    
    const currentStep = determineCurrentStep(ticket);
    console.log('Current step for ticket', ticket.id, ':', currentStep);
    console.log('User role:', user.role, 'hasPermission:', user.permissions);
    
    // Buttons for each workflow stage
    switch (currentStep) {
      case 'created':
      case 'pending_approval':
        // New ticket - office staff can accept and assign
        // Added explicit check for subadmin role or root to ensure office staff can always assign
        // Fix any ticket that shows as 'Assigned' without a vendor
        if ((ticket.status === 'Assigned' || ticket.status === 'assigned') && !ticket.vendorId) {
          console.log('Found ticket with Assigned status but no vendor, showing assign button:', ticket.id);
          return (
            <Button
              variant="contained"
              color="warning"
              startIcon={<AssignIcon />}
              onClick={() => handleActionClick('assign')}
            >
              Re-Assign Ticket
            </Button>
          );
        }
        
        if (user.role === 'root' || 
            (user.role === 'subadmin' && 
             (user.permissions?.includes('subadmin.acceptTicket') || 
              hasTicketTierAccess('1', ticket.locationId)))) {
          return (
            <Button
              variant="contained"
              color="primary"
              startIcon={<AssignIcon />}
              onClick={() => handleActionClick('assign')}
            >
              Assign to Vendor
            </Button>
          );
        }
        return null;
      
      case 'more_info_requested':
        // Vendor requested more information - ticket creator or assignee can respond
        if (ticket.createdBy === user.id || 
            (user.role === 'subadmin' && hasTicketTierAccess('1', ticket.locationId))) {
          return (
            <Button
              variant="contained"
              color="info"
              onClick={handleMoreInfoClick}
            >
              Provide More Information
            </Button>
          );
        }
        return null;
        
      case 'vendor_rejected':
        // Vendor rejected the ticket - need tier 1 access to reassign
        if (hasTicketTierAccess('1', ticket.locationId)) {
          return (
            <Button
              variant="contained"
              color="primary"
              startIcon={<AssignIcon />}
              onClick={() => handleActionClick('assign')}
            >
              Reassign to Another Vendor
            </Button>
          );
        }
        return null;
        
      case 'waiting_vendor_response':
        if (user.role === 'vendor' && ticket.vendorId === user.vendorId) {
          return (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                color="success"
                startIcon={<AcceptIcon />}
                onClick={() => handleActionClick('accept')}
              >
                Accept
              </Button>
              <Button
                variant="contained"
                color="error"
                startIcon={<RejectIcon />}
                onClick={() => handleActionClick('reject')}
              >
                Reject
              </Button>
              <Button
                variant="contained"
                color="info"
                startIcon={<RequestInfoIcon />}
                onClick={() => handleActionClick('requestInfo')}
              >
                Request Info
              </Button>
            </Box>
          );
        }
        return null;

      case 'vendor_accepted':
      case 'assigned':
        if (user.role === 'vendor' && ticket.vendorId === user.vendorId) {
          // Vendor assigned to this ticket
          return (
            <Button
              variant="contained"
              color="primary"
              startIcon={<StartIcon />}
              onClick={() => handleActionClick('start')}
            >
              Start Work
            </Button>
          );
        }
        return null;
        
      case 'in_progress':
        if (user.role === 'vendor' && ticket.vendorId === user.vendorId) {
          // Vendor working on this ticket
          return (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                color="warning"
                startIcon={<PauseIcon />}
                onClick={() => handleActionClick('pause')}
              >
                Pause Work
              </Button>
              <Button
                variant="contained"
                color="success"
                startIcon={<CompleteIcon />}
                onClick={() => handleActionClick('complete')}
              >
                Complete
              </Button>
            </Box>
          );
        }
        return null;
        
      case 'awaiting_approval':
        if ((user.role === 'subadmin' && user.permissions?.includes('subadmin.verifyJobCompleted')) ||
            user.role === 'root') {
          // Admin/subadmin with verification permission
          return (
            <Button
              variant="contained"
              color="success"
              startIcon={<VerifyIcon />}
              onClick={() => handleActionClick('verify')}
            >
              Verify Completion
            </Button>
          );
        }
        return null;
        
      default:
        return null;
    }
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
              <TableCell>Priority & Access Tier</TableCell>
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
                      {ticket.tier && (
                        <Chip 
                          size="small" 
                          label={`Access Tier ${ticket.tier}`}
                          color="info"
                          sx={{ ml: 1 }}
                        />
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
                  <TableCell>{getAssignedVendor(ticket)}</TableCell>
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
          {actionType === 'accept' && 'Accept Ticket'}
          {actionType === 'reject' && 'Reject Ticket'}
          {actionType === 'requestInfo' && 'Request More Information'}
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
                {!Array.isArray(filteredVendors) || filteredVendors.length === 0 ? (
                  <MenuItem disabled value="">
                    No vendors available
                  </MenuItem>
                ) : (
                  filteredVendors.map((vendor) => (
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

          {actionType === 'accept' && (
            <TextField
              margin="normal"
              fullWidth
              id="note"
              label="Notes (optional)"
              multiline
              rows={4}
              value={actionNote}
              onChange={(e) => setActionNote(e.target.value)}
            />
          )}

          {(actionType === 'reject' || actionType === 'requestInfo') && (
            <TextField
              margin="normal"
              required
              fullWidth
              id="note"
              label="Reason"
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
              ((actionType === 'pause' || actionType === 'complete' || actionType === 'reject' || actionType === 'requestInfo') && !actionNote)
            }
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* More Info Dialog */}
      <Dialog 
        open={moreInfoDialogOpen} 
        onClose={handleCloseMoreInfoDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Provide Additional Information</DialogTitle>
        <DialogContent>
          {selectedTicket && selectedTicket.workOrders && (
            <Alert severity="info" sx={{ mb: 2 }}>
              {selectedTicket.workOrders
                .filter(wo => wo.type === 'more_info_requested')
                .slice(-1)[0]?.note || 'Vendor has requested more information.'}
            </Alert>
          )}
          
          <TextField
            autoFocus
            margin="normal"
            required
            fullWidth
            id="additionalInfo"
            label="Additional Information"
            multiline
            rows={4}
            value={additionalInfo}
            onChange={(e) => setAdditionalInfo(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseMoreInfoDialog}>Cancel</Button>
          <Button 
            onClick={handleMoreInfoSubmit} 
            variant="contained"
            disabled={!additionalInfo.trim()}
          >
            Submit
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Tickets;
