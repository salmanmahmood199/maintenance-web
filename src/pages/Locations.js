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
  IconButton,
  Chip,
  Tooltip,
  Breadcrumbs,
  Link,
  Alert
} from '@mui/material';
import { 
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Room as RoomIcon,
  Map as MapIcon,
  Business as BusinessIcon
} from '@mui/icons-material';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { useParams, useNavigate, useLocation } from 'react-router-dom';

const Locations = () => {
  const { getLocations, addLocation, getOrganizations, getOrganization, getAccessibleLocations } = useData();
  const { currentUser } = useAuth();
  const params = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check if we're in organization context
  const orgId = params.id;
  const isOrgContext = !!orgId;
  
  // Get current organization if in org context
  const currentOrg = isOrgContext ? getOrganization(orgId) : null;
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editLocationId, setEditLocationId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    country: '',
    phone: '',
    orgId: isOrgContext ? orgId : ''
  });

  // Add state for locations and organizations
  const [locations, setLocations] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  
  // Fetch locations and organizations
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch organizations
        const orgs = await getOrganizations();
        setOrganizations(orgs || []);
        
        // Fetch locations based on user role
        let locs = [];
        
        // If user is a sub-admin, filter locations based on assignments
        if (currentUser && currentUser.role === 'subadmin') {
          console.log('Filtering locations for sub-admin:', currentUser.id);
          // Use the getAccessibleLocations helper to get only assigned locations
          locs = await getAccessibleLocations(currentUser.id);
        } else {
          // Admin/root users can see all locations
          locs = await getLocations();
        }
        
        // Further filter by organization context if needed
        if (isOrgContext) {
          locs = locs.filter(loc => loc.orgId === orgId);
        }
        
        setLocations(locs || []);
      } catch (error) {
        console.error('Error fetching data:', error);
        setOrganizations([]);
        setLocations([]);
      }
    };
    
    fetchData();
  }, [getOrganizations, getLocations, getAccessibleLocations, currentUser, isOrgContext, orgId]);
  
  useEffect(() => {
    // Update form data when organization context changes
    if (isOrgContext) {
      setFormData(prev => ({
        ...prev,
        orgId: orgId
      }));
    }
  }, [orgId, isOrgContext]);

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle dialog open/close
  const handleOpenDialog = (locationToEdit = null) => {
    if (locationToEdit) {
      setEditLocationId(locationToEdit.id);
      setFormData({
        name: locationToEdit.name,
        address: locationToEdit.address,
        city: locationToEdit.city || '',
        state: locationToEdit.state || '',
        zip: locationToEdit.zip || '',
        country: locationToEdit.country || '',
        phone: locationToEdit.phone || '',
        orgId: locationToEdit.orgId
      });
    } else {
      setEditLocationId(null);
      setFormData({
        name: '',
        address: '',
        city: '',
        state: '',
        zip: '',
        country: '',
        phone: '',
        orgId: isOrgContext ? orgId : ''
      });
    }
    setDialogOpen(true);
  };
  
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditLocationId(null);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // In organization context, directly use the org ID
      const locationData = isOrgContext && !formData.orgId ? {
        ...formData,
        orgId: orgId
      } : formData;
      
      await addLocation(locationData);
      
      // Refresh locations after adding a new one
      const locs = await getLocations();
      setLocations(locs || []);
      
      handleCloseDialog();
    } catch (error) {
      console.error('Failed to add location:', error);
      alert(`Error adding location: ${error.message}`);
    }
  };

  // Filter locations based on context
  const filteredLocations = isOrgContext 
    ? locations.filter(loc => loc.orgId === orgId)
    : locations;

  // Helper to get organization name
  const getOrgName = (orgId) => {
    const org = organizations.find(org => org.id === orgId);
    return org ? org.name : 'Unknown Organization';
  };

  return (
    <Box>
      {/* Header with breadcrumbs */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          {isOrgContext && (
            <Breadcrumbs sx={{ mb: 2 }}>
              <Link 
                onClick={() => navigate('/organizations')} 
                sx={{ cursor: 'pointer', color: 'text.secondary' }}
                underline="hover"
              >
                Organizations
              </Link>
              <Link 
                onClick={() => navigate(`/organizations/${orgId}`)} 
                sx={{ cursor: 'pointer', color: 'text.secondary' }}
                underline="hover"
              >
                {currentOrg?.name || 'Organization'}
              </Link>
              <Typography color="text.primary">Locations</Typography>
            </Breadcrumbs>
          )}
          
          <Typography variant="h4" component="h1">
            {isOrgContext ? `${currentOrg?.name} Locations` : 'All Locations'}
          </Typography>
          
          {isOrgContext && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Manage locations for {currentOrg?.name}
            </Typography>
          )}
        </Box>
        
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Location
        </Button>
      </Box>

      {/* Locations Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Location</TableCell>
              <TableCell>Address</TableCell>
              {!isOrgContext && <TableCell>Organization</TableCell>}
              <TableCell>Contact</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredLocations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isOrgContext ? 4 : 5} align="center">
                  <Box sx={{ py: 3 }}>
                    <Typography variant="body1" sx={{ mb: 1 }}>
                      No locations found
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {isOrgContext 
                        ? `${currentOrg?.name} doesn't have any locations yet` 
                        : 'No locations exist in the system'}
                    </Typography>
                    <Button 
                      variant="outlined" 
                      startIcon={<RoomIcon />} 
                      sx={{ mt: 2 }}
                      onClick={() => handleOpenDialog()}
                    >
                      Add Your First Location
                    </Button>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              filteredLocations.map((location) => (
                <TableRow key={location.id}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <RoomIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography variant="body1">{location.name}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{location.address}</Typography>
                    {(location.city || location.state) && (
                      <Typography variant="body2" color="text.secondary">
                        {[location.city, location.state, location.zip]
                          .filter(Boolean)
                          .join(', ')}
                      </Typography>
                    )}
                    {location.country && (
                      <Typography variant="body2" color="text.secondary">
                        {location.country}
                      </Typography>
                    )}
                  </TableCell>
                  {!isOrgContext && (
                    <TableCell>
                      <Chip 
                        label={getOrgName(location.orgId)} 
                        size="small" 
                        color="primary" 
                        variant="outlined"
                        icon={<BusinessIcon fontSize="small" />}
                        onClick={() => navigate(`/organizations/${location.orgId}`)}
                      />
                    </TableCell>
                  )}
                  <TableCell>
                    {location.phone && (
                      <Typography variant="body2">
                        {location.phone}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Edit Location">
                      <IconButton onClick={() => handleOpenDialog(location)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="View on Map">
                      <IconButton>
                        <MapIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit Location Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editLocationId 
            ? 'Edit Location' 
            : isOrgContext 
              ? `Add Location to ${currentOrg?.name}` 
              : 'Add New Location'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="name"
              label="Location Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              id="address"
              label="Street Address"
              name="address"
              value={formData.address}
              onChange={handleChange}
            />
            
            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
              <TextField
                margin="normal"
                fullWidth
                id="city"
                label="City"
                name="city"
                value={formData.city}
                onChange={handleChange}
              />
              <TextField
                margin="normal"
                fullWidth
                id="state"
                label="State/Province"
                name="state"
                value={formData.state}
                onChange={handleChange}
              />
              <TextField
                margin="normal"
                fullWidth
                id="zip"
                label="ZIP/Postal Code"
                name="zip"
                value={formData.zip}
                onChange={handleChange}
              />
            </Box>
            
            <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
              <TextField
                margin="normal"
                fullWidth
                id="country"
                label="Country"
                name="country"
                value={formData.country}
                onChange={handleChange}
              />
              <TextField
                margin="normal"
                fullWidth
                id="phone"
                label="Phone Number"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
              />
            </Box>
            
            {!isOrgContext && (
              <FormControl fullWidth margin="normal" required>
                <InputLabel id="org-label">Organization</InputLabel>
                <Select
                  labelId="org-label"
                  id="orgId"
                  name="orgId"
                  value={formData.orgId}
                  label="Organization"
                  onChange={handleChange}
                >
                  {organizations.length === 0 ? (
                    <MenuItem disabled value="">
                      No organizations available
                    </MenuItem>
                  ) : (
                    organizations.map((org) => (
                      <MenuItem key={org.id} value={org.id}>
                        {org.name}
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={!isOrgContext && organizations.length === 0}
          >
            {editLocationId ? 'Save Changes' : 'Add Location'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Locations;
