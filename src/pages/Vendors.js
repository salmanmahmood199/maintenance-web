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
  FormLabel,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Chip,
  Tooltip,
  Breadcrumbs,
  Link,
  Alert,
  MenuItem,
  Select,
  InputLabel,
  FormHelperText,
  Divider,
  ListItemText
} from '@mui/material';
import { 
  Add as AddIcon,
  Business as BusinessIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Store as VendorIcon
} from '@mui/icons-material';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useData } from '../context/DataContext';

const Vendors = () => {
  const navigate = useNavigate();
  const params = useParams();
  const location = useLocation();
  const { getVendors, addVendor, updateVendor, getOrganizations, getOrganization } = useData();
  
  // Check if we're in organization context
  const orgId = params.id;
  const isOrgContext = !!orgId;
  
  // Get current organization if in org context
  const currentOrg = isOrgContext ? getOrganization(orgId) : null;
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editVendorId, setEditVendorId] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    status: 'active',
    specialties: '',
    orgIds: isOrgContext ? [orgId] : []
  });
  
  // Filter status state
  const [statusFilter, setStatusFilter] = useState('all');

  // Fetch organizations when component mounts
  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const orgs = await getOrganizations();
        setOrganizations(orgs || []);
      } catch (error) {
        console.error('Error fetching organizations:', error);
        setOrganizations([]);
      }
    };
    
    fetchOrganizations();
  }, [getOrganizations]);
  
  useEffect(() => {
    // Update form data when organization context changes
    if (isOrgContext && (!formData.orgIds || !Array.isArray(formData.orgIds) || !formData.orgIds.includes(orgId))) {
      setFormData(prev => ({
        ...prev,
        orgIds: [orgId]
      }));
    }
    
    // When in organization context, make sure the tab is set to Vendors (index 3)
    if (isOrgContext) {
      localStorage.setItem('orgDetailTab', '3');
    }
  }, [orgId, isOrgContext, formData.orgIds]);

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle checkbox change for organizations
  const handleOrgCheckboxChange = (orgId) => {
    setFormData(prev => {
      const newOrgIds = prev.orgIds && Array.isArray(prev.orgIds) && prev.orgIds.includes(orgId)
        ? prev.orgIds.filter(id => id !== orgId)
        : [...prev.orgIds, orgId];
      
      return { ...prev, orgIds: newOrgIds };
    });
  };
  
  // Handle status filter change
  const handleStatusFilterChange = (event) => {
    setStatusFilter(event.target.value);
  };

  // Handle dialog open/close
  const handleOpenDialog = (vendorToEdit = null) => {
    // Prevent organizations from adding new vendors
    if (!vendorToEdit && isOrgContext) {
      alert('Only system administrators can add new vendors.');
      return;
    }
    
    if (vendorToEdit) {
      setEditVendorId(vendorToEdit.id);
      setFormData({
        name: vendorToEdit.name,
        email: vendorToEdit.email.split('+')[0] + '@' + vendorToEdit.email.split('@')[1], // Remove timestamp from email
        phone: vendorToEdit.phone,
        password: '', // Don't show the password
        // tier removed - will be assigned per organization
        status: vendorToEdit.status || 'active',
        specialties: vendorToEdit.specialties || '',
        orgIds: vendorToEdit.orgIds
      });
    } else {
      setEditVendorId(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        password: '',
        // tier removed - will be assigned per organization
        status: 'active',
        specialties: '',
        orgIds: isOrgContext ? [orgId] : []
      });
    }
    
    setDialogOpen(true);
  };
  
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditVendorId(null);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Prevent adding new vendors in organization context
      if (isOrgContext && !editVendorId) {
        console.error('Organizations cannot add new vendors');
        alert('Only system administrators can add new vendors.');
        handleCloseDialog();
        return;
      }
      
      // Handle both new vendors and edits
      let vendorData;
      
      if (editVendorId) {
        // When editing, don't modify the email if password is empty (no change)
        vendorData = {
          ...formData,
          id: editVendorId,
          // Keep email as is if no new password
          email: formData.password.trim() === ''
            ? formData.email 
            : `${formData.email.split('@')[0]}+${Date.now()}@${formData.email.split('@')[1]}`
        };
      } else {
        // New vendor, always use timestamped email
        vendorData = {
          ...formData,
          email: `${formData.email.split('@')[0]}+${Date.now()}@${formData.email.split('@')[1]}`
        };
      }
      
      // In organization context, ensure the org ID is included
      if (isOrgContext && (!vendorData.orgIds || !Array.isArray(vendorData.orgIds) || !vendorData.orgIds.includes(orgId))) {
        vendorData.orgIds = [...vendorData.orgIds, orgId];
      }
      
      console.log('Saving vendor with data:', vendorData);
    
    // Use updateVendor when editing, addVendor when creating new
    if (editVendorId) {
      await updateVendor(editVendorId, vendorData);
    } else {
      await addVendor(vendorData);
    }
      
      // Refresh both vendors and organizations data after adding or updating
      const [allVendors, orgs] = await Promise.all([
        getVendors(),
        getOrganizations()
      ]);
      
      // Update organizations state
      setOrganizations(orgs || []);
      
      // Filter vendors
      const filteredByOrg = isOrgContext
        ? allVendors.filter(vendor => vendor.orgIds && Array.isArray(vendor.orgIds) && vendor.orgIds.includes(orgId))
        : allVendors;
      
      const filteredVendors = statusFilter === 'all'
        ? filteredByOrg
        : filteredByOrg.filter(vendor => (vendor.status || 'active') === statusFilter);
        
      setVendors(filteredVendors || []);
      
      handleCloseDialog();
    } catch (error) {
      console.error('Failed to save vendor:', error);
      alert(`Error saving vendor: ${error.message}`);
    }
  };

  // Fetch vendors data when component mounts or when dependencies change
  useEffect(() => {
    const fetchVendors = async () => {
      try {
        // Get vendors from API
        const allVendors = await getVendors();
        
        // Filter by organization if in org context
        const filteredByOrg = isOrgContext
          ? allVendors.filter(vendor => vendor.orgIds && Array.isArray(vendor.orgIds) && vendor.orgIds.includes(orgId))
          : allVendors;
        
        // Apply status filter
        const filteredVendors = statusFilter === 'all'
          ? filteredByOrg
          : filteredByOrg.filter(vendor => (vendor.status || 'active') === statusFilter);
          
        setVendors(filteredVendors || []);
      } catch (error) {
        console.error('Error fetching vendors:', error);
        setVendors([]);
      }
    };
    
    fetchVendors();
  }, [getVendors, isOrgContext, orgId, statusFilter]);

  // Helper to get organization names for a vendor
  const getOrgNamesForVendor = (orgIds) => {
    if (!orgIds || !Array.isArray(orgIds) || !Array.isArray(organizations)) {
      return ['Loading...'];
    }
    
    return orgIds.map(id => {
      const org = organizations.find(org => org.id === id);
      return org ? org.name : 'Unknown Organization';
    });
  };

  // Helper to format email addresses for cleaner display
  const formatEmail = (email) => {
    if (!email) return '';
    
    // If the email contains a plus sign, truncate it for display
    if (email.includes('+')) {
      const [username, domain] = email.split('@');
      const cleanUsername = username.split('+')[0];
      return `${cleanUsername}@${domain}`;
    }
    
    return email;
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      {/* Organization context title and breadcrumbs */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <Breadcrumbs sx={{ flexGrow: 1 }}>
          <Link 
            onClick={() => navigate('/organizations')} 
            sx={{ cursor: 'pointer' }}
            underline="hover"
          >
            Organizations
          </Link>
          {isOrgContext && (
            <Link 
              onClick={() => navigate(`/organizations/${orgId}`)} 
              sx={{ cursor: 'pointer' }}
              underline="hover"
            >
              {currentOrg?.name}
            </Link>
          )}
          <Typography color="text.primary">Vendors</Typography>
        </Breadcrumbs>
      </Box>
      
      <Typography variant="h4" gutterBottom>Vendor Relationships</Typography>
      
      {/* Filter controls and add button */}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
          <InputLabel id="status-filter-label">Status</InputLabel>
          <Select
            labelId="status-filter-label"
            id="status-filter"
            value={statusFilter}
            onChange={handleStatusFilterChange}
            label="Status"
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="inactive">Inactive</MenuItem>
          </Select>
        </FormControl>

        {!isOrgContext && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Add Vendor
          </Button>
        )}
      </Box>
      
      {/* Vendor relationships table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Vendor</TableCell>
              <TableCell>Contact</TableCell>
              <TableCell>Access Tier</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Assigned Locations</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {vendors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No vendors found
                </TableCell>
              </TableRow>
            ) : (
              vendors.map((vendor) => (
                <TableRow 
                  key={vendor.id} 
                  hover 
                  sx={{ 
                    cursor: isOrgContext ? 'default' : 'pointer',
                    '&:hover': { backgroundColor: isOrgContext ? '' : 'action.hover' } 
                  }}
                  onClick={isOrgContext ? undefined : () => navigate(`/vendors/${vendor.id}`)}
                >
                  <TableCell>
                    <Box 
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        cursor: isOrgContext ? 'default' : 'pointer',
                        '&:hover': isOrgContext ? {} : {
                          textDecoration: 'underline',
                          color: 'primary.main'
                        }
                      }}
                      onClick={isOrgContext ? undefined : () => navigate(`/vendors/${vendor.id}`)}
                    >
                      <VendorIcon color="primary" sx={{ mr: 1 }} />
                      {vendor.name}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <EmailIcon fontSize="small" sx={{ mr: 0.5, opacity: 0.7 }} />
                        <Typography variant="body2" title={vendor.email}>
                          {formatEmail(vendor.email)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                        <PhoneIcon fontSize="small" sx={{ mr: 0.5, opacity: 0.7 }} />
                        <Typography variant="body2">{vendor.phone}</Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={`T${vendor.tier || 1} Access`}
                      color={vendor.tier === 3 ? "error" : vendor.tier === 2 ? "warning" : "info"}
                      size="small"
                      sx={{ borderRadius: '4px' }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      icon={vendor.status === 'active' ? <CheckCircleIcon /> : <CancelIcon />}
                      label={vendor.status || 'active'}
                      color={vendor.status === 'active' ? "success" : "default"}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    {vendor.locationIds?.length ? vendor.locationIds.length : 'None assigned'}
                  </TableCell>
                  <TableCell align="right">
                    <Button 
                      size="small" 
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent row click from triggering
                        handleOpenDialog(vendor);
                      }}
                    >
                      Manage
                    </Button>
                    {!isOrgContext && (
                      <Button 
                        size="small" 
                        color="primary"
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent row click from triggering
                          navigate(`/vendors/${vendor.id}`);
                        }}
                        sx={{ ml: 1 }}
                      >
                        View Details
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit Vendor Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {isOrgContext
            ? `Manage Vendor Relationship - ${currentOrg?.name}`
            : editVendorId
              ? 'Edit Vendor'
              : 'Add New Vendor'
          }
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            {/* In organization context and editing existing vendor, show readonly vendor info */}
            {isOrgContext && editVendorId && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6">{formData.name}</Typography>
                <Typography variant="body2">{formData.email}</Typography>
                <Typography variant="body2" color="text.secondary">{formData.phone}</Typography>
                <Alert severity="info" sx={{ mt: 2 }}>
                  You're managing this vendor's relationship with {currentOrg?.name}. 
                  To edit vendor details, please use the vendor management section.
                </Alert>
                <Divider sx={{ my: 2 }} />
              </Box>
            )}
            
            {/* Core vendor fields - only show when not in organization context or adding new */}
            {(!isOrgContext || !editVendorId) && (
              <>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="name"
                  label="Vendor Name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                />
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    id="email"
                    label="Email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                  />
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    id="phone"
                    label="Phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </Box>
                
                <TextField
                  margin="normal"
                  required={!editVendorId}
                  fullWidth
                  id="password"
                  label={editVendorId ? "New Password (leave blank to keep current)" : "Password"}
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                />
                
                <TextField
                  margin="normal"
                  fullWidth
                  id="specialties"
                  label="Specialties"
                  name="specialties"
                  placeholder="e.g., HVAC, Plumbing, Electrical"
                  value={formData.specialties || ''}
                  onChange={handleChange}
                />
              </>
            )}
            
            {/* Always show vendor relationship fields */}
            <Box sx={{ mt: isOrgContext && editVendorId ? 0 : 2 }}>
              {isOrgContext && (
                <FormControl fullWidth margin="normal">
                  <InputLabel id="tier-label">Access Control Tier</InputLabel>
                  <Select
                    labelId="tier-label"
                    id="tier"
                    name="tier"
                    value={formData.tier || 1}
                    label="Access Control Tier"
                    onChange={handleChange}
                  >
                    <MenuItem value={1}>
                      <ListItemText
                        primary="Tier 1 Access"
                        secondary="Basic access to organization tickets"
                      />
                    </MenuItem>
                    <MenuItem value={2}>
                      <ListItemText
                        primary="Tier 2 Access"
                        secondary="Intermediate access level for more complex tickets"
                      />
                    </MenuItem>
                    <MenuItem value={3}>
                      <ListItemText
                        primary="Tier 3 Access"
                        secondary="Highest access level for critical tickets"
                      />
                    </MenuItem>
                  </Select>
                  <FormHelperText>
                    Tier level controls which tickets this vendor can access within this organization
                  </FormHelperText>
                </FormControl>
              )}
              
              <FormControl fullWidth margin="normal">
                <InputLabel id="status-label">Status</InputLabel>
                <Select
                  labelId="status-label"
                  id="status"
                  name="status"
                  value={formData.status || 'active'}
                  label="Status"
                  onChange={handleChange}
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </Select>
                <FormHelperText>
                  {formData.status === 'inactive' 
                    ? 'Inactive vendors will not receive new ticket assignments' 
                    : 'Active vendors can receive new ticket assignments'}
                </FormHelperText>
              </FormControl>
              
              {/* Tier field removed - tiers should be assigned within organization context */}
            </Box>
            
            {/* Only show organization selection when not in organization context */}
            {!isOrgContext && (
              <FormControl component="fieldset" margin="normal" fullWidth>
                <FormLabel component="legend">Assign to Organizations</FormLabel>
                <FormGroup>
                  {organizations.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      No organizations available. Please create an organization first.
                    </Typography>
                  ) : (
                    <Box sx={{ maxHeight: '200px', overflowY: 'auto', mt: 1 }}>
                      {organizations.map((org) => (
                        <FormControlLabel
                          key={org.id}
                          control={
                            <Checkbox
                              checked={formData.orgIds && Array.isArray(formData.orgIds) && formData.orgIds.includes(org.id)}
                              onChange={() => handleOrgCheckboxChange(org.id)}
                              name={`org-${org.id}`}
                            />
                          }
                          label={org.name}
                        />
                      ))}
                    </Box>
                  )}
                </FormGroup>
              </FormControl>
            )}
            
            {/* When in org context, show that current org is automatically assigned */}
            {isOrgContext && (
              <Alert severity="success" sx={{ mt: 2 }}>
                This vendor will be assigned to {currentOrg?.name}
              </Alert>
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
            {editVendorId ? 'Save Changes' : 'Add Vendor'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Vendors;
