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
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';


const Organizations = () => {
  const navigate = useNavigate();
  const { getOrganizations, addOrganization } = useData();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [organizations, setOrganizations] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    contactName: '',
    contactEmail: '',
    contactPhone: ''
  });
  
  // Fetch organizations when component mounts
  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const data = await getOrganizations();
        setOrganizations(data || []);
      } catch (error) {
        console.error('Error fetching organizations:', error);
        setOrganizations([]);
      }
    };
    
    fetchOrganizations();
  }, [getOrganizations]);

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle dialog open/close
  const handleOpenDialog = () => setDialogOpen(true);
  const handleCloseDialog = () => setDialogOpen(false);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log('Submitting organization data:', formData);
      const newOrg = await addOrganization(formData);
      
      if (newOrg) {
        console.log('Successfully created organization:', newOrg);
        // Reset form
        setFormData({
          name: '',
          contactName: '',
          contactEmail: '',
          contactPhone: ''
        });
        
        // Add the new org to the local state instead of refetching all orgs
        setOrganizations(prev => [...prev, newOrg]);
        handleCloseDialog();
      } else {
        console.error('Failed to create organization - no data returned');
        alert('Failed to create organization. Please check the console for details.');
      }
    } catch (error) {
      console.error('Error in organization form submission:', error);
      alert(`Error creating organization: ${error.message}`);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Organizations
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenDialog}
        >
          Add Organization
        </Button>
      </Box>

      {/* Organizations Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Contact Name</TableCell>
              <TableCell>Contact Email</TableCell>
              <TableCell>Contact Phone</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {organizations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No organizations found
                </TableCell>
              </TableRow>
            ) : (
              organizations.map((org) => (
                <TableRow 
                  key={org.id}
                  hover
                  onClick={() => navigate(`/organizations/${org.id}`)}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell>{org.name}</TableCell>
                  <TableCell>{org.contactName}</TableCell>
                  <TableCell>{org.contactEmail}</TableCell>
                  <TableCell>{org.contactPhone}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add Organization Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Add Organization</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="name"
              label="Organization Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              id="contactName"
              label="Contact Name"
              name="contactName"
              value={formData.contactName}
              onChange={handleChange}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              id="contactEmail"
              label="Contact Email"
              name="contactEmail"
              type="email"
              value={formData.contactEmail}
              onChange={handleChange}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              id="contactPhone"
              label="Contact Phone"
              name="contactPhone"
              value={formData.contactPhone}
              onChange={handleChange}
            />

          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Organizations;
