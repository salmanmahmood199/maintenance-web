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
  Divider
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
  const { getVendors, addVendor, getOrganizations, getOrganization } = useData();
  
  // Check if we're in organization context
  const orgId = params.id;
  const isOrgContext = !!orgId;
  
  // Get current organization if in org context
  const currentOrg = isOrgContext ? getOrganization(orgId) : null;
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editVendorId, setEditVendorId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    tier: 'standard',
    status: 'active',
    specialties: '',
    orgIds: isOrgContext ? [orgId] : []
  });
  
  // Filter status state
  const [statusFilter, setStatusFilter] = useState('all');

  // Get all organizations for the form
  const organizations = getOrganizations();
  
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
    if (vendorToEdit) {
      setEditVendorId(vendorToEdit.id);
      setFormData({
        name: vendorToEdit.name,
        email: vendorToEdit.email.split('+')[0] + '@' + vendorToEdit.email.split('@')[1], // Remove timestamp from email
        phone: vendorToEdit.phone,
        password: '', // Don't show the password
        tier: vendorToEdit.tier || 'standard',
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
        tier: 'standard',
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
  const handleSubmit = (e) => {
    e.preventDefault();
    try {
      // Handle both new vendors and edits
      let vendorData;
      
      if (editVendorId) {
        // When editing, don't modify the email if password is empty (no change)
        vendorData = {
          ...formData,
          id: editVendorId,
          // Only add timestamp to email if it's a new email
          email: formData.email.includes('+') 
            ? formData.email 
            : `${formData.email.split('@')[0]}+${Date.now()}@${formData.email.split('@')[1]}`
        };
      } else {
        // New vendor - add timestamp to email
        vendorData = {
          ...formData,
          email: formData.email.includes('+') 
            ? formData.email 
            : `${formData.email.split('@')[0]}+${Date.now()}@${formData.email.split('@')[1]}`
        };
      }
      
      // In organization context, ensure the org ID is included
      if (isOrgContext && (!vendorData.orgIds || !Array.isArray(vendorData.orgIds) || !vendorData.orgIds.includes(orgId))) {
        vendorData.orgIds = [...vendorData.orgIds, orgId];
      }
      
      console.log('Saving vendor with data:', vendorData);
      addVendor(vendorData);
      handleCloseDialog();
    } catch (error) {
      console.error('Failed to save vendor:', error);
      alert(`Error saving vendor: ${error.message}`);
    }
  };

  // Get vendors based on context and filter
  const allVendors = getVendors();
  const filteredByOrg = isOrgContext 
    ? allVendors.filter(vendor => vendor.orgIds && Array.isArray(vendor.orgIds) && vendor.orgIds.includes(orgId))
    : allVendors;
  
  // Apply status filter
  const vendors = statusFilter === 'all' 
    ? filteredByOrg 
    : filteredByOrg.filter(vendor => (vendor.status || 'active') === statusFilter);

  // Helper to get organization names for a vendor
  const getOrgNamesForVendor = (orgIds) => {
    return orgIds.map(id => {
      const org = organizations.find(org => org.id === id);
      return org ? org.name : 'Unknown Organization';
    });
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

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Vendor
        </Button>
      </Box>
      
      {/* Vendor relationships table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Vendor</TableCell>
              <TableCell>Contact</TableCell>
              <TableCell>Tier</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Assigned Locations</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(isOrgContext ? getVendors(orgId) : getVendors())
              .filter(vendor => statusFilter === 'all' || vendor.status === statusFilter)
              .map((vendor) => (
                <TableRow key={vendor.id}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <VendorIcon color="primary" sx={{ mr: 1 }} />
                      {vendor.name}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <EmailIcon fontSize="small" sx={{ mr: 0.5, opacity: 0.7 }} />
                        <Typography variant="body2">{vendor.email}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                        <PhoneIcon fontSize="small" sx={{ mr: 0.5, opacity: 0.7 }} />
                        <Typography variant="body2">{vendor.phone}</Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={`Tier ${vendor.tier || 1}`}
                      color={vendor.tier === 3 ? "error" : vendor.tier === 2 ? "warning" : "primary"}
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
                      onClick={() => handleOpenDialog(vendor)}
                    >
                      Manage
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            {(isOrgContext ? getVendors(orgId) : getVendors()).length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                    No vendors found. Add a vendor to get started.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit Vendor Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {isOrgContext
            ? editVendorId 
              ? `Manage Vendor Relationship - ${currentOrg?.name}`
              : `Add Vendor to ${currentOrg?.name}`
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
            <Box sx={{ display: 'flex', gap: 2, mt: isOrgContext && editVendorId ? 0 : 2 }}>
              <FormControl fullWidth margin="normal">
                <InputLabel id="tier-label">Vendor Tier</InputLabel>
                <Select
                  labelId="tier-label"
                  id="tier"
                  name="tier"
                  value={formData.tier || 'standard'}
                  label="Vendor Tier"
                  onChange={handleChange}
                >
                  <MenuItem value="standard">Standard</MenuItem>
                  <MenuItem value="preferred">Preferred</MenuItem>
                  <MenuItem value="premium">Premium</MenuItem>
                </Select>
                <FormHelperText>
                  Determines level of service and priority
                </FormHelperText>
              </FormControl>
              
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
