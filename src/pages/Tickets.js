import React, { useState, useEffect } from 'react';
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
  Alert
} from '@mui/material';
import { 
  Add as AddIcon, 
  Visibility as VisibilityIcon,
  PersonAdd as AssignIcon,
  PlayArrow as StartIcon,
  Pause as PauseIcon,
  Check as CompleteIcon,
  Verified as VerifyIcon
} from '@mui/icons-material';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';

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
  
  // Form data
  const [formData, setFormData] = useState({
    locationId: '',
    issueType: '',
    description: '',
    placedBy: user?.email || '',
    mediaUrls: [] // Placeholder for future file uploads
  });

  // Add state for storing async data
  const [tickets, setTickets] = useState([]);
  const [locations, setLocations] = useState([]);
  const [vendors, setVendors] = useState([]);
  
  // Fetch data when component mounts
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get accessible locations based on user role
        let accessibleLocations = [];
        let filteredTickets = [];
        
        // If user is a sub-admin, filter by assigned locations
        if (currentUser && currentUser.role === 'subadmin') {
          console.log('Filtering tickets for sub-admin:', currentUser.id);
          accessibleLocations = await getAccessibleLocations(currentUser.id);
          
          // Get all tickets
          const allTickets = await getTickets();
          
          // Filter tickets to only include those for accessible locations
          filteredTickets = allTickets.filter(ticket => {
            const locationId = ticket.locationId;
            return accessibleLocations.some(loc => loc.id === locationId);
          });
        } else {
          // Admin/root users can see all tickets
          filteredTickets = await getTickets();
          accessibleLocations = await getLocations();
        }
        
        // Get vendors
        const vendorsData = await getVendors();
        
        // Update state with fetched data
        setTickets(filteredTickets || []);
        setLocations(accessibleLocations || []);
        setVendors(vendorsData || []);
      } catch (error) {
        console.error('Error fetching data:', error);
        setTickets([]);
        setLocations([]);
        setVendors([]);
      }
    };
    
    fetchData();
  }, [getTickets, getLocations, getVendors, getAccessibleLocations, currentUser]);

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle dialog open/close
  const handleOpenDialog = () => setDialogOpen(true);
  const handleCloseDialog = () => {
    setDialogOpen(false);
    // Reset form
    setFormData({
      locationId: '',
      issueType: '',
      description: '',
      placedBy: user?.email || '',
      mediaUrls: []
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addTicket(formData);
      
      // Refresh tickets data after adding a new one
      const newTickets = await getTickets();
      setTickets(newTickets || []);
      
      handleCloseDialog();
    } catch (error) {
      console.error('Error adding ticket:', error);
      alert(`Error adding ticket: ${error.message}`);
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

  // Render action buttons based on ticket status
  const renderActionButtons = (ticket) => {
    const { status } = ticket;
    
    // For MVP, allow any action regardless of role
    switch (status) {
      case 'New':
        return (
          <Button
            variant="contained"
            startIcon={<AssignIcon />}
            onClick={() => handleActionClick('assign')}
            fullWidth
            sx={{ mb: 1 }}
          >
            Assign to Vendor
          </Button>
        );
      case 'Assigned':
        return (
          <Button
            variant="contained"
            color="info"
            startIcon={<StartIcon />}
            onClick={() => handleActionClick('start')}
            fullWidth
            sx={{ mb: 1 }}
          >
            Start Work
          </Button>
        );
      case 'In Progress':
        return (
          <Box>
            <Button
              variant="contained"
              color="warning"
              startIcon={<PauseIcon />}
              onClick={() => handleActionClick('pause')}
              fullWidth
              sx={{ mb: 1 }}
            >
              Pause Work
            </Button>
            <Button
              variant="contained"
              color="success"
              startIcon={<CompleteIcon />}
              onClick={() => handleActionClick('complete')}
              fullWidth
              sx={{ mb: 1 }}
            >
              Complete Work
            </Button>
          </Box>
        );
      case 'Paused':
        return (
          <Button
            variant="contained"
            color="info"
            startIcon={<StartIcon />}
            onClick={() => handleActionClick('start')}
            fullWidth
            sx={{ mb: 1 }}
          >
            Resume Work
          </Button>
        );
      case 'Completed':
        return (
          <Button
            variant="contained"
            color="secondary"
            startIcon={<VerifyIcon />}
            onClick={() => handleActionClick('verify')}
            fullWidth
            sx={{ mb: 1 }}
          >
            Verify Completion
          </Button>
        );
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
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenDialog}
        >
          Create Ticket
        </Button>
      </Box>

      {/* Tickets Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Ticket #</TableCell>
              <TableCell>Date/Time</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Issue Type</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Assigned To</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tickets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No tickets found
                </TableCell>
              </TableRow>
            ) : (
              tickets.map((ticket) => (
                <TableRow key={ticket.id}>
                  <TableCell>{ticket.ticketNo}</TableCell>
                  <TableCell>{formatDate(ticket.dateTime)}</TableCell>
                  <TableCell>{getLocationName(ticket.locationId)}</TableCell>
                  <TableCell>
                    {ISSUE_TYPES.find(type => type.value === ticket.issueType)?.label || ticket.issueType}
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
            
            <TextField
              margin="normal"
              required
              fullWidth
              id="description"
              label="Description"
              name="description"
              multiline
              rows={4}
              value={formData.description}
              onChange={handleChange}
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              id="placedBy"
              label="Placed By"
              name="placedBy"
              value={formData.placedBy}
              onChange={handleChange}
            />
            
            {/* File upload placeholder for future implementation */}
            <Alert severity="info" sx={{ mt: 2 }}>
              File upload functionality will be available in a future update.
            </Alert>
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
