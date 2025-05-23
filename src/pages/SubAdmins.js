import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Checkbox,
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
  FormControlLabel,
  FormGroup,
  FormLabel,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Chip,
  Tooltip,
  Divider,
  Breadcrumbs,
  Link,
  Alert
} from '@mui/material';
import { 
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
  Lock as LockIcon,
  VpnKey as KeyIcon,
  Info as InfoIcon,
  LocationOn as LocationIcon
} from '@mui/icons-material';
import { useData } from '../context/DataContext';
import { useParams, useNavigate, useLocation } from 'react-router-dom';

const SubAdmins = () => {
  const { 
    getSubAdmins, 
    addSubAdmin, 
    updateSubAdmin,
    getOrganizations, 
    getOrganization,
    getLocations,
    data
  } = useData();
  const params = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check if we're in organization context
  const orgId = params.id;
  const isOrgContext = !!orgId;
  
  // Get current organization if in org context
  const currentOrg = isOrgContext ? getOrganization(orgId) : null;
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [resetPasswordDialog, setResetPasswordDialog] = useState(false);
  const [locationAssignDialog, setLocationAssignDialog] = useState(false);
  const [selectedSubAdmin, setSelectedSubAdmin] = useState(null);
  const [locations, setLocations] = useState([]);
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [locationTierPermissions, setLocationTierPermissions] = useState({});
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    id: null,
    name: '',
    email: '',
    phone: '',
    password: '', // Will only be used for new sub-admins
    role: '',
    permissions: [],
    organizationId: isOrgContext ? orgId : ''
  });
  
  const [passwordData, setPasswordData] = useState({
    password: '',
    confirmPassword: ''
  });
  
  // Add state for subAdmins and organizations
  const [subAdmins, setSubAdmins] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  
  // Fetch organizations and subAdmins
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch organizations
        const orgs = await getOrganizations();
        setOrganizations(orgs || []);
        
        // Fetch subAdmins
        const admins = await getSubAdmins();
        setSubAdmins(admins || []);
      } catch (error) {
        console.error('Error fetching data:', error);
        setOrganizations([]);
        setSubAdmins([]);
      }
    };
    
    fetchData();
  }, [getOrganizations, getSubAdmins]);
  
  useEffect(() => {
    // Update form data when organization context changes
    if (isOrgContext) {
      setFormData(prev => ({
        ...prev,
        organizationId: orgId
      }));
    }
    
    // Fetch locations for this organization
    const fetchLocations = async () => {
      try {
        const allLocations = await getLocations();
        if (isOrgContext) {
          setLocations(allLocations.filter(loc => loc.orgId === orgId) || []);
        } else {
          setLocations(allLocations || []);
        }
      } catch (error) {
        console.error('Error fetching locations:', error);
        setLocations([]);
      }
    };
    
    fetchLocations();
  }, [orgId, isOrgContext, getLocations]);

  // Define available roles with detailed descriptions
  const availableRoles = [
    { 
      id: 'subadmin.placeTicket', 
      label: 'Place Ticket',
      description: 'Allows a user to open a brand-new maintenance ticket (choose location, pick the issue type, add details, upload photos/videos, and submit).'
    },
    { 
      id: 'subadmin.acceptTicket', 
      label: 'Accept Ticket',
      description: 'Lets a user claim any "New" ticket and assign it to a vendor.'
    },
    { 
      id: 'subadmin.addVendor', 
      label: 'Add Vendor',
      description: 'Grants the power to create a new vendor record: enter their name, email, phone, password, and link that vendor to one-or-more organizations.'
    },
    { 
      id: 'subadmin.addIssueType', 
      label: 'Add Issue Type',
      description: 'Allows adding custom entries to the "Type of Issue" dropdown (for example, adding "Elevator" or "Electrical" as new issue categories).'
    },
    { 
      id: 'subadmin.acceptInvoice', 
      label: 'Accept Invoice',
      description: 'Lets a user review and approve an invoice submitted by a vendor before it gets sent on to accounts payable.'
    },
    { 
      id: 'subadmin.addLocation', 
      label: 'Add Location',
      description: 'Allows the creation of new locations (stores or sites) under the organization—complete with name, address, and contact info.'
    },
    { 
      id: 'subadmin.assignLocation', 
      label: 'Assign Location',
      description: 'Lets a user grant other users access to specific locations so they can place or view tickets there.'
    },
    { 
      id: 'subadmin.verifyJobCompleted', 
      label: 'Verify Job Completed',
      description: 'Gives the ability to final-verify a ticket after the technician marks it "Completed," officially closing out the job.'
    }
  ];

  // Handle input change
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      // Handle checkbox changes for permissions
      const permissionValue = name;
      setFormData(prev => {
        const currentPermissions = [...prev.permissions];
        if (checked) {
          // Add permission if checked
          if (!currentPermissions.includes(permissionValue)) {
            currentPermissions.push(permissionValue);
          }
        } else {
          // Remove permission if unchecked
          const index = currentPermissions.indexOf(permissionValue);
          if (index !== -1) {
            currentPermissions.splice(index, 1);
          }
        }
        return { ...prev, permissions: currentPermissions };
      });
    } else {
      // Handle regular input changes
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };
  
  // Handle password field changes
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  // Handle dialog open/close
  const handleOpenDialog = (subAdmin = null) => {
    if (subAdmin) {
      // Edit mode
      setEditMode(true);
      setFormData({
        id: subAdmin.id,
        name: subAdmin.name || '',
        email: subAdmin.email || '',
        phone: subAdmin.phone || '',
        password: '', // Do not prefill password
        role: subAdmin.role || '',
        permissions: subAdmin.permissions || [],
        organizationId: subAdmin.organizationId || (isOrgContext ? orgId : '')
      });
    } else {
      // Add mode
      setEditMode(false);
      setFormData({
        id: null, // Ensure id is null for new sub-admin
        name: '',
        email: '',
        phone: '',
        password: '',
        role: '',
        permissions: [],
        organizationId: isOrgContext ? orgId : ''
      });
    }
    setDialogOpen(true);
  };
  
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditMode(false);
  };
  
  // Handle reset password dialog
  const handleOpenResetPassword = (subAdmin) => {
    setSelectedSubAdmin(subAdmin);
    setPasswordData({
      password: '',
      confirmPassword: ''
    });
    setResetPasswordDialog(true);
  };
  
  // Handle location assignment dialog open
  const handleOpenLocationAssign = (subAdmin) => {
    setSelectedSubAdmin(subAdmin);
    
    // Set initially selected locations based on subAdmin's current assignments
    if (subAdmin.assignedLocationIds && Array.isArray(subAdmin.assignedLocationIds)) {
      setSelectedLocations(subAdmin.assignedLocationIds);
    } else {
      setSelectedLocations([]);
    }
    
    // Initialize tier permissions if the admin has them saved
    const initialTierPermissions = {};
    if (subAdmin.locationTierPermissions) {
      Object.keys(subAdmin.locationTierPermissions).forEach(locId => {
        initialTierPermissions[locId] = subAdmin.locationTierPermissions[locId];
      });
    }
    setLocationTierPermissions(initialTierPermissions);
    
    setLocationAssignDialog(true);
  };
  
  // Handle location assignment dialog close
  const handleCloseLocationAssign = () => {
    setLocationAssignDialog(false);
    setSelectedLocations([]);
    setLocationTierPermissions({});
  };
  
  // Handle location checkbox change
  const handleLocationChange = (locationId) => {
    setSelectedLocations(prev => {
      if (prev.includes(locationId)) {
        // Remove location and its tier permissions
        const newLocationTierPermissions = {...locationTierPermissions};
        delete newLocationTierPermissions[locationId];
        setLocationTierPermissions(newLocationTierPermissions);
        return prev.filter(id => id !== locationId);
      } else {
        return [...prev, locationId];
      }
    });
  };
  
  // Handle tier permission change for a location
  const handleTierPermissionChange = (locationId, tier, checked) => {
    setLocationTierPermissions(prev => {
      const locationPermissions = prev[locationId] || { acceptTicket: false, tiers: [] };
      
      let updatedTiers;
      if (checked) {
        // Special migration handling - if adding Tier 1, remove legacy 1A and 1B if they exist
        if (tier === 1) {
          updatedTiers = locationPermissions.tiers.filter(t => t !== '1A' && t !== '1B');
          // Add Tier 1
          updatedTiers.push(tier);
        } else {
          // For other tiers, just add if not already included
          updatedTiers = [...locationPermissions.tiers, tier].filter((v, i, a) => a.indexOf(v) === i);
        }
      } else {
        // Remove tier
        updatedTiers = locationPermissions.tiers.filter(t => t !== tier);
      }
      
      return {
        ...prev,
        [locationId]: {
          ...locationPermissions,
          tiers: updatedTiers
        }
      };
    });
  };
  
  // Toggle accept ticket permission for a location
  const toggleAcceptTicketForLocation = (locationId, checked) => {
    setLocationTierPermissions(prev => {
      const locationPermissions = prev[locationId] || { acceptTicket: false, tiers: [] };
      
      return {
        ...prev,
        [locationId]: {
          ...locationPermissions,
          acceptTicket: checked,
          // If unchecking accept ticket, clear tiers
          tiers: checked ? locationPermissions.tiers : []
        }
      };
    });
  };
  
  // Save location assignments
  const handleSaveLocationAssignments = async () => {
    if (!selectedSubAdmin) return;
    
    try {
      // Create updated subAdmin object with new location assignments and tier permissions
      const updatedSubAdmin = {
        ...selectedSubAdmin,
        assignedLocationIds: selectedLocations,
        locationTierPermissions: locationTierPermissions
      };
      
      await updateSubAdmin(selectedSubAdmin.id, updatedSubAdmin);
      
      // Refresh subAdmins data after updating
      const admins = await getSubAdmins();
      setSubAdmins(admins || []);
      
      handleCloseLocationAssign();
    } catch (error) {
      console.error('Error updating sub-admin locations:', error);
      alert(`Error updating location assignments: ${error.message}`);
    }
  };
  
  const handleCloseResetPassword = () => {
    setResetPasswordDialog(false);
    setSelectedSubAdmin(null);
  };
  
  // Handle reset password submit
  const handleResetPassword = async () => {
    if (passwordData.password !== passwordData.confirmPassword) {
      alert('Passwords do not match!');
      return;
    }
    
    if (selectedSubAdmin) {
      try {
        // Actually update the password in the backend - only send the password field
        await updateSubAdmin(selectedSubAdmin.id, {
          password: passwordData.password
        });
        
        // Also make sure to update the user record with the same password
        const user = data.users.find(u => u.email === selectedSubAdmin.email);
        if (user) {
          // Use DataContext to update user password as well
          await fetch(`http://localhost:3004/users/${user.id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              password: passwordData.password
            })
          });

          // Update localStorage for immediate login ability
          const storedData = localStorage.getItem('maintenanceAppData');
          if (storedData) {
            const appData = JSON.parse(storedData);
            const users = appData.users || [];
            const userIndex = users.findIndex(u => u.id === user.id);
            if (userIndex >= 0) {
              users[userIndex].password = passwordData.password;
              appData.users = users;
              localStorage.setItem('maintenanceAppData', JSON.stringify(appData));
            }
          }
        }
        
        alert(`Password for ${selectedSubAdmin.name} has been reset successfully.`);
        handleCloseResetPassword();
      } catch (error) {
        console.error('Error resetting password:', error);
        alert(`Error resetting password: ${error.message}`);
      }
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('FORM SUBMIT - Edit mode state:', editMode ? 'EDIT' : 'CREATE');
    console.log('FORM SUBMIT - SelectedSubAdmin:', selectedSubAdmin);
    
    try {
      // Basic validation
      if (!formData.name || !formData.email || !formData.phone) {
        alert('Please fill in all required fields');
        return;
      }
      
      // Organization selection validation
      if (!formData.organizationId && !isOrgContext) {
        alert('Please select an organization');
        return;
      }
      
      // Permissions validation
      if (!formData.permissions || formData.permissions.length === 0) {
        alert('Please select at least one permission');
        return;
      }
      
      // In organization context, directly use the org ID
      const organizationId = isOrgContext ? orgId : formData.organizationId;
      
      // Force CREATE MODE if selectedSubAdmin is null regardless of editMode state
      if (!selectedSubAdmin) {
        console.log('FORCED CREATE MODE - No selected sub-admin exists');
        
        // Double check we have a password for new sub-admin
        if (!formData.password) {
          alert('Password is required for new sub-admins');
          return;
        }
        
        console.log('CREATING NEW SUB-ADMIN');
        console.log('Organization ID:', organizationId);
        
        const newSubAdminData = {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          permissions: formData.permissions,
          role: 'subadmin'
        };
        
        await addSubAdmin(organizationId, newSubAdminData);
      }
      // Only try to update if we have a valid sub-admin ID
      else if (selectedSubAdmin && selectedSubAdmin.id) {
        const subAdminId = selectedSubAdmin.id;
        
        console.log('UPDATING SUB-ADMIN with ID:', subAdminId);
        
        // Create update payload - include password only if provided
        const updateData = {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          permissions: formData.permissions,
          organizationId: organizationId
        };
        
        // Add password to update if provided
        if (formData.password) {
          updateData.password = formData.password;
        }
        
        await updateSubAdmin(subAdminId, updateData);
      }
      // Fallback error case
      else {
        console.error('Invalid state - cannot determine if creating or updating');
        alert('Error: Cannot identify operation type (create/update)');
        return;
      }
      
      // Refresh subAdmins data after adding/updating
      const admins = await getSubAdmins();
      setSubAdmins(admins || []);
      
      setDialogOpen(false);
      setFormData({
        id: null,
        name: '',
        email: '',
        phone: '',
        password: '',
        role: '',
        permissions: [],
        organizationId: isOrgContext ? orgId : ''
      });
    } catch (error) {
      console.error('Error saving sub-admin:', error);
      alert(`Error saving sub-admin: ${error.message}`);
    }  
  };

  // Helper to get organization name
  const getOrgName = (organizationId) => {
    const org = organizations.find(o => o.id === organizationId);
    return org ? org.name : 'Unknown Organization';
  };
  
  // Filter subAdmins based on organization context
  const filteredSubAdmins = isOrgContext 
    ? subAdmins.filter(admin => admin.organizationId === orgId)
    : subAdmins;

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
              <Typography color="text.primary">Sub-Administrators</Typography>
            </Breadcrumbs>
          )}
          
          <Typography variant="h4" component="h1">
            {isOrgContext ? `${currentOrg?.name} Sub-Administrators` : 'All Sub-Administrators'}
          </Typography>
          
          {isOrgContext && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Manage sub-administrators specifically for {currentOrg?.name}
            </Typography>
          )}
        </Box>
        
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenDialog}
        >
          Add Sub-Admin
        </Button>
      </Box>

      {/* Sub-Admins Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Phone</TableCell>
              {!isOrgContext && <TableCell>Organization</TableCell>}
              <TableCell>Role/Permissions</TableCell>
              <TableCell>Assigned Locations</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {subAdmins.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isOrgContext ? 5 : 6} align="center">
                  <Box sx={{ py: 3 }}>
                    <Typography variant="body1" sx={{ mb: 1 }}>
                      No sub-administrators found
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {isOrgContext 
                        ? `${currentOrg?.name} doesn't have any sub-administrators yet` 
                        : 'No sub-administrators exist in the system'}
                    </Typography>
                    <Button 
                      variant="outlined" 
                      startIcon={<AddIcon />} 
                      sx={{ mt: 2 }}
                      onClick={handleOpenDialog}
                    >
                      Add Your First Sub-Admin
                    </Button>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              subAdmins.map((admin) => (
                <TableRow key={admin.id}>
                  <TableCell>{admin.name || 'N/A'}</TableCell>
                  <TableCell>{admin.email}</TableCell>
                  <TableCell>{admin.phone || 'N/A'}</TableCell>
                  {!isOrgContext && (
                    <TableCell>
                      <Chip 
                        label={getOrgName(admin.organizationId)} 
                        size="small" 
                        color="primary" 
                        variant="outlined" 
                        onClick={() => navigate(`/organizations/${admin.organizationId}`)}
                      />
                    </TableCell>
                  )}
                  <TableCell>
                    {admin.role && (
                      <Typography variant="body2" sx={{ mb: 0.5 }}>
                        {admin.role}
                      </Typography>
                    )}
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {admin.permissions?.slice(0, 2).map(perm => (
                        <Chip 
                          key={perm} 
                          label={perm.replace('subadmin.', '')} 
                          size="small" 
                          variant="outlined"
                        />
                      ))}
                      {(admin.permissions?.length > 2) && (
                        <Chip 
                          label={`+${admin.permissions.length - 2} more`} 
                          size="small"
                        />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    {admin.assignedLocationIds && admin.assignedLocationIds.length > 0 ? (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {admin.assignedLocationIds.slice(0, 2).map(locId => {
                          const location = locations.find(loc => loc.id === locId);
                          return (
                            <Chip 
                              key={locId} 
                              label={location ? location.name : 'Unknown'} 
                              size="small" 
                              variant="outlined"
                              color="secondary"
                            />
                          );
                        })}
                        {(admin.assignedLocationIds.length > 2) && (
                          <Chip 
                            label={`+${admin.assignedLocationIds.length - 2} more`} 
                            size="small"
                            color="secondary"
                          />
                        )}
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No assigned locations
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Assign Locations">
                      <IconButton onClick={() => handleOpenLocationAssign(admin)}>
                        <LocationIcon fontSize="small" color="primary" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Reset Password">
                      <IconButton onClick={() => handleOpenResetPassword(admin)}>
                        <KeyIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit">
                      <IconButton onClick={() => handleOpenDialog(admin)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add Sub-Admin Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editMode 
            ? `Edit Sub-Admin${isOrgContext ? ` for ${currentOrg?.name}` : ''}` 
            : isOrgContext 
              ? `Add Sub-Admin to ${currentOrg?.name}` 
              : 'Add New Sub-Admin'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="name"
              label="Full Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
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
              label="Phone Number"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
            />
            
            {/* Only show password field when adding a new sub-admin, not when editing */}
            {!editMode && (
              <TextField
                margin="normal"
                required
                fullWidth
                id="password"
                label="Password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
              />
            )}
            
            {!isOrgContext && (
              <FormControl fullWidth margin="normal" required>
                <InputLabel id="org-label">Organization</InputLabel>
                <Select
                  labelId="org-label"
                  id="organizationId"
                  name="organizationId"
                  value={formData.organizationId}
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
            
            {/* Password input for new sub-admins or editing password */}
            <TextField
              margin="normal"
              required={!editMode}
              fullWidth
              id="password"
              label={editMode ? "New Password (leave blank to keep current)" : "Password"}
              name="password"
              type="password"
              value={formData.password}
              onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))}
              autoComplete="new-password"
              sx={{ mt: 2 }}
            />

            {/* Role permissions section */}
            <FormControl component="fieldset" fullWidth margin="normal" sx={{ mt: 3 }}>
              <FormLabel component="legend">Role Permissions</FormLabel>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 1.5 }}>
                Select the permissions this sub-admin should have:
              </Typography>
              <FormGroup>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1 }}>
                  {availableRoles.map(role => (
                    <Box key={role.id} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={formData.permissions.includes(role.id)}
                            onChange={handleChange}
                            name={role.id}
                          />
                        }
                        label={role.label}
                      />
                      <Tooltip 
                        title={role.description}
                        placement="right"
                        arrow
                      >
                        <IconButton size="small" color="primary">
                          <InfoIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  ))}
                </Box>
              </FormGroup>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={!isOrgContext && organizations.length === 0}
          >
            {editMode ? 'Save Changes' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Location Assignment Dialog */}
      <Dialog open={locationAssignDialog} onClose={handleCloseLocationAssign} maxWidth="sm" fullWidth>
        <DialogTitle>Assign Locations</DialogTitle>
        <DialogContent>
          {selectedSubAdmin && (
            <>
              <Alert severity="info" sx={{ mb: 2 }}>
                Assigning locations to {selectedSubAdmin.name || selectedSubAdmin.email}. 
                This sub-admin will only be able to view and manage tickets for their assigned locations.
              </Alert>
              
              {locations.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ my: 2 }}>
                  No locations available. Please add locations first.
                </Typography>
              ) : (
                <>
                  <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
                    Select Locations:
                  </Typography>
                  <Box sx={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #eee', borderRadius: 1, p: 1 }}>
                    <FormGroup>
                      {locations.map((loc) => {
                        // Check if the subadmin has accept ticket permission
                        const hasAcceptTicketPermission = selectedSubAdmin?.permissions?.includes('subadmin.acceptTicket');
                        const isLocationSelected = selectedLocations.includes(loc.id);
                        const locationPermissions = locationTierPermissions[loc.id] || { acceptTicket: false, tiers: [] };
                        
                        return (
                          <Box key={loc.id} sx={{ mb: 2, borderBottom: isLocationSelected ? '1px dashed #eee' : 'none', pb: isLocationSelected ? 2 : 0 }}>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={isLocationSelected}
                                  onChange={() => handleLocationChange(loc.id)}
                                />
                              }
                              label={
                                <Box>
                                  <Typography variant="body2">{loc.name}</Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {loc.address}, {loc.city || ''}
                                  </Typography>
                                </Box>
                              }
                            />
                            
                            {/* Show ticket acceptance options only if the location is selected AND the admin has the accept ticket permission */}
                            {isLocationSelected && hasAcceptTicketPermission && (
                              <Box sx={{ ml: 4, mt: 1 }}>
                                <FormControlLabel
                                  control={
                                    <Checkbox
                                      checked={locationPermissions.acceptTicket || false}
                                      onChange={(e) => toggleAcceptTicketForLocation(loc.id, e.target.checked)}
                                      size="small"
                                    />
                                  }
                                  label={
                                    <Typography variant="body2">
                                      Can accept tickets for this location?
                                    </Typography>
                                  }
                                />
                                
                                {/* Show tier options if "can accept tickets" is checked */}
                                {locationPermissions.acceptTicket && (
                                  <Box sx={{ ml: 4, mt: 0.5 }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                                      Select access tiers this admin can manage:
                                    </Typography>
                                    <FormControlLabel
                                      control={
                                        <Checkbox
                                          checked={locationPermissions.tiers?.includes(1) || locationPermissions.tiers?.includes('1A') || locationPermissions.tiers?.includes('1B') || false}
                                          onChange={(e) => handleTierPermissionChange(loc.id, 1, e.target.checked)}
                                          size="small"
                                        />
                                      }
                                      label={<Typography variant="body2">Tier 1 Access</Typography>}
                                    />
                                    <FormControlLabel
                                      control={
                                        <Checkbox
                                          checked={locationPermissions.tiers?.includes(2) || false}
                                          onChange={(e) => handleTierPermissionChange(loc.id, 2, e.target.checked)}
                                          size="small"
                                        />
                                      }
                                      label={<Typography variant="body2">Tier 2 Access</Typography>}
                                    />
                                    <FormControlLabel
                                      control={
                                        <Checkbox
                                          checked={locationPermissions.tiers?.includes(3) || false}
                                          onChange={(e) => handleTierPermissionChange(loc.id, 3, e.target.checked)}
                                          size="small"
                                        />
                                      }
                                      label={<Typography variant="body2">Tier 3 Access</Typography>}
                                    />
                                  </Box>
                                )}
                              </Box>
                            )}
                          </Box>
                        );
                      })}
                    </FormGroup>
                  </Box>
                </>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseLocationAssign}>Cancel</Button>
          <Button 
            onClick={handleSaveLocationAssignments} 
            variant="contained"
            color="primary"
            disabled={locations.length === 0}
          >
            Save Location Assignments
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Reset Password Dialog */}
      <Dialog open={resetPasswordDialog} onClose={handleCloseResetPassword} maxWidth="xs" fullWidth>
        <DialogTitle>Reset Password</DialogTitle>
        <DialogContent>
          {selectedSubAdmin && (
            <>
              <Alert severity="info" sx={{ mb: 2 }}>
                Setting a new password for {selectedSubAdmin.name || selectedSubAdmin.email}
              </Alert>
              <TextField
                margin="normal"
                required
                fullWidth
                id="password"
                label="New Password"
                name="password"
                type="password"
                value={passwordData.password}
                onChange={handlePasswordChange}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                id="confirmPassword"
                label="Confirm Password"
                name="confirmPassword"
                type="password"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                error={passwordData.password !== passwordData.confirmPassword && passwordData.confirmPassword !== ''}
                helperText={passwordData.password !== passwordData.confirmPassword && passwordData.confirmPassword !== '' ? 'Passwords do not match' : ''}
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseResetPassword}>Cancel</Button>
          <Button 
            onClick={handleResetPassword} 
            variant="contained"
            color="warning"
            disabled={!passwordData.password || !passwordData.confirmPassword || passwordData.password !== passwordData.confirmPassword}
          >
            Reset Password
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SubAdmins;
