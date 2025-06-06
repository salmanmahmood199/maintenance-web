import React from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  CardActions, 
  Button,
  Grid,
  Divider,
  Paper
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';

const VendorOrganizationSelect = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getVendor, getOrganizations } = useData();
  
  // If user is a vendor, get their vendor details
  // For demo, we'll assume the user is linked to a vendor via email
  const vendors = user && user.role === 'vendor' 
    ? [user.email].map(email => {
        // Find vendor by email
        const vendorList = getVendor(null, email);
        return vendorList && vendorList.length > 0 ? vendorList[0] : null;
      }).filter(Boolean)
    : [];
  
  // Get assigned organizations
  const vendor = vendors.length > 0 ? vendors[0] : null;
  const assignedOrgIds = vendor ? vendor.orgIds || [] : [];
  const organizations = getOrganizations().filter(org => assignedOrgIds.includes(org.id));
  
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Select an Organization
      </Typography>
      
      <Typography variant="body1" paragraph>
        As a vendor, you can manage tickets and technicians for the following organizations:
      </Typography>
      
      {organizations.length === 0 ? (
        <Paper sx={{ p: 3, mt: 2 }}>
          <Typography variant="body1" color="text.secondary">
            You are not currently assigned to any organizations.
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3} sx={{ mt: 1 }}>
          {organizations.map((org) => (
            <Grid item xs={12} sm={6} md={4} key={org.id}>
              <Card 
                elevation={2}
                sx={{ 
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 3
                  }
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h5" component="h2" gutterBottom>
                    {org.name}
                  </Typography>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    Contact: {org.contactName || 'N/A'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Email: {org.contactEmail || 'N/A'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Phone: {org.contactPhone || 'N/A'}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button 
                    variant="contained" 
                    fullWidth
                    onClick={() => navigate(`/vendor-organization/${org.id}`)}
                  >
                    Manage Tickets & Technicians
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default VendorOrganizationSelect;
