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
  VpnKey as KeyIcon
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
  const [selectedSubAdmin, setSelectedSubAdmin] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    id: null,
    name: '',
    email: '',
    phone: '',
    password: '',
    role: '',
    permissions: [],
    organizationId: isOrgContext ? orgId : ''
  });
  
  const [passwordData, setPasswordData] = useState({
    password: '',
    confirmPassword: ''
  });

  // Get organizations based on context
  const organizations = getOrganizations();
  
  useEffect(() => {
    // Update form data when organization context changes
    if (isOrgContext) {
      setFormData(prev => ({
        ...prev,
        organizationId: orgId
      }));
    }
  }, [orgId, isOrgContext]);

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
        password: '', // Don't show the current password
        role: subAdmin.role || '',
        permissions: subAdmin.permissions || [],
        organizationId: subAdmin.organizationId || (isOrgContext ? orgId : '')
      });
    } else {
      // Add mode
      setEditMode(false);
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
  
  const handleCloseResetPassword = () => {
    setResetPasswordDialog(false);
    setSelectedSubAdmin(null);
  };
  
  // Handle reset password submit
  const handleResetPassword = () => {
    if (passwordData.password !== passwordData.confirmPassword) {
      alert('Passwords do not match!');
      return;
    }
    
    if (selectedSubAdmin) {
      // In a real app, this would update the password in the backend
      console.log(`Resetting password for ${selectedSubAdmin.email} to ${passwordData.password}`);
      handleCloseResetPassword();
    }
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    try {
      // In organization context, directly use the org ID
      const subAdminData = isOrgContext ? {
        ...formData,
        organizationId: orgId
      } : formData;
      
      if (editMode) {
        // Update existing sub-admin
        updateSubAdmin(subAdminData);
        console.log('Updating sub-admin:', subAdminData);
      } else {
        // Add new sub-admin
        addSubAdmin(subAdminData);
        console.log('Adding new sub-admin:', subAdminData);
      }
      
      handleCloseDialog();
    } catch (error) {
      console.error('Failed to save sub-admin:', error);
      alert(`Error saving sub-admin: ${error.message}`);
    }
  };

  // Get sub-admins based on context
  const allSubAdmins = getSubAdmins();
  const subAdmins = isOrgContext 
    ? allSubAdmins.filter(admin => admin.organizationId === orgId)
    : allSubAdmins;

  // Helper to get organization name
  const getOrgName = (organizationId) => {
    const org = organizations.find(org => org.id === organizationId);
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
                  <TableCell align="right">
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
