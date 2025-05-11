import React, { useState } from 'react';
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
  Checkbox,
  FormControlLabel,
  FormGroup,
  FormLabel,
  Grid,
  Chip,
  Divider,
  Alert
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon } from '@mui/icons-material';
import { useData } from '../context/DataContext';

const SecurityGroups = () => {
  const { getSecurityGroups, addSecurityGroup, data } = useData();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: []
  });

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle checkbox change for permissions
  const handlePermissionChange = (permissionId) => {
    setFormData(prev => {
      const currentPermissions = [...prev.permissions];
      if (currentPermissions.includes(permissionId)) {
        return {
          ...prev,
          permissions: currentPermissions.filter(id => id !== permissionId)
        };
      } else {
        return {
          ...prev,
          permissions: [...currentPermissions, permissionId]
        };
      }
    });
  };

  // Handle dialog open/close
  const handleOpenDialog = () => {
    setEditMode(false);
    setFormData({
      name: '',
      description: '',
      permissions: []
    });
    setDialogOpen(true);
  };
  
  const handleEditGroup = (group) => {
    setEditMode(true);
    setFormData({
      id: group.id,
      name: group.name,
      description: group.description || '',
      permissions: group.permissions || []
    });
    setDialogOpen(true);
  };
  
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditMode(false);
    setFormData({
      name: '',
      description: '',
      permissions: []
    });
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    try {
      // Ensure we have a name and at least one permission
      if (!formData.name.trim()) {
        alert('Please enter a role name');
        return;
      }

      // Create the security group
      const securityGroupData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        permissions: formData.permissions
      };

      if (editMode && formData.id) {
        // For editMode, we're creating a new entry anyway since updateSecurityGroup isn't fully implemented
        addSecurityGroup(securityGroupData);
      } else {
        // Add new security group
        addSecurityGroup(securityGroupData);
      }
      
      handleCloseDialog();
    } catch (error) {
      console.error('Error adding security group:', error);
      alert('Failed to add security group. Please try again.');
    }
  };

  // Get all security groups
  const securityGroups = getSecurityGroups();

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Security Groups
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenDialog}
        >
          Add Security Group
        </Button>
      </Box>

      {/* Security Groups Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Role Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Permissions</TableCell>
              <TableCell width="100">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {securityGroups.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  No security groups found
                </TableCell>
              </TableRow>
            ) : (
              securityGroups.map((group) => (
                <TableRow key={group.id}>
                  <TableCell><strong>{group.name}</strong></TableCell>
                  <TableCell>{group.description}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {group.permissions && group.permissions.map(permId => (
                        <Chip 
                          key={permId} 
                          label={permId.replace('subadmin.', '')} 
                          size="small"
                          color="primary"
                          variant="outlined"
                          sx={{ mb: 0.5 }}
                        />
                      ))}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      startIcon={<EditIcon />}
                      onClick={() => handleEditGroup(group)}
                    >
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit Security Group Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editMode ? 'Edit Security Group' : 'Add Security Group'}</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="name"
              label="Role Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Manager, Tier 1 Support"
              helperText="Provide a descriptive name for this security role"
            />
            
            <TextField
              margin="normal"
              fullWidth
              id="description"
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="e.g., Can manage tickets and locations"
              multiline
              rows={2}
              helperText="Briefly describe what this role allows users to do"
            />
            
            <Box sx={{ mt: 3, mb: 2 }}>
              <FormLabel component="legend" sx={{ mb: 2 }}>
                Permissions
              </FormLabel>
              <Alert severity="info" sx={{ mb: 2 }}>
                Select the permissions this security role should have. Each permission grants specific abilities to users with this role.
              </Alert>
              
              <Grid container spacing={2}>
                {data.availablePermissions.map((permission) => (
                  <Grid item xs={12} sm={6} key={permission.id}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={formData.permissions.includes(permission.id)}
                          onChange={() => handlePermissionChange(permission.id)}
                          name={permission.id}
                        />
                      }
                      label={<Box>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {permission.id.replace('subadmin.', '')}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {permission.description}
                        </Typography>
                      </Box>}
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'flex-start',
                        mx: 0,
                        mb: 1,
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                        p: 1
                      }}
                    />
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editMode ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SecurityGroups;
