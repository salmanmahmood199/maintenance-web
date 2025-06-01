import React from 'react';
import { 
  Box, 
  Grid,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button
} from '@mui/material';
import { 
  Business as BusinessIcon,
  Group as GroupIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Build navigation cards based on user role and permissions
  const getAvailableCards = () => {
    const cards = [];
    
    // Root admin can see everything
    if (user?.role === 'root') {
      cards.push(
        {
          title: 'Organizations',
          description: 'Manage your organizations, sub-admins, locations, and more',
          icon: <BusinessIcon sx={{ fontSize: 60 }} />,
          path: '/organizations',
          color: '#3f51b5'
        },
        {
          title: 'Vendors',
          description: 'Manage vendors, technicians and their assignments',
          icon: <GroupIcon sx={{ fontSize: 60 }} />,
          path: '/vendors',
          color: '#f50057'
        }
      );
    }
    
    // For subadmins, show options based on permissions
    else if (user?.role === 'subadmin') {

      // If they can manage vendors
      if (user.permissions && (user.permissions.includes('subadmin.addVendor') || user.permissions.includes('subadmin.manageVendors'))) {
        cards.push({
          title: 'Vendors',
          description: 'Manage vendors for your organization',
          icon: <BusinessIcon sx={{ fontSize: 60 }} />,
          path: '/vendors',
          color: '#ff9800'
        });
      }
      
      // If they can manage locations
      if (user.permissions && (user.permissions.includes('subadmin.addLocation') || user.permissions.includes('subadmin.assignLocation'))) {
        cards.push({
          title: 'Locations',
          description: 'Manage locations and their settings',
          icon: <BusinessIcon sx={{ fontSize: 60 }} />,
          path: '/locations',
          color: '#3f51b5'
        });
      }
      
      // If they can view tickets
      if (user.permissions && user.permissions.includes('subadmin.viewTickets')) {
        cards.push({
          title: 'Tickets',
          description: 'View and manage tickets',
          icon: <BusinessIcon sx={{ fontSize: 60 }} />,
          path: '/tickets',
          color: '#4caf50'
        });
      }
    }
    
    // For vendors, show vendor dashboard
    else if (user?.role === 'vendor') {
      cards.push({
        title: 'Organization Access',
        description: 'Manage your organization assignments',
        icon: <BusinessIcon sx={{ fontSize: 60 }} />,
        path: '/vendor-dashboard',
        color: '#ff9800'
      });
    }
    
    return cards;
  };
  
  const cardData = getAvailableCards();

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Welcome, {user?.name || user?.email}
      </Typography>
      
      <Typography variant="body1" paragraph>
        Select one of the options below to start managing your maintenance system.
      </Typography>
      
      <Grid container spacing={4} sx={{ mt: 2, flexGrow: 1 }}>
        {cardData.map((card) => (
          <Grid item xs={12} sm={6} key={card.title}>
            <Card 
              elevation={3}
              sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                transition: 'transform 0.2s, box-shadow 0.2s',
                cursor: 'pointer',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: 8
                }
              }}
              onClick={() => navigate(card.path)}
            >
              <CardContent sx={{ 
                flexGrow: 1, 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center',
                p: 3
              }}>
                <Box
                  sx={{
                    backgroundColor: card.color,
                    borderRadius: '50%',
                    p: 1.5,
                    mb: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0px 3px 8px rgba(0, 0, 0, 0.15)',
                    width: '70px',
                    height: '70px',
                  }}
                >
                  {React.cloneElement(card.icon, { sx: { fontSize: 40, color: 'white' } })}
                </Box>
                
                <Typography variant="h5" component="h2" gutterBottom align="center">
                  {card.title}
                </Typography>
                
                <Typography variant="body2" color="text.secondary" align="center">
                  {card.description}
                </Typography>
              </CardContent>
              
              <CardActions sx={{ p: 2, pt: 0 }}>
                <Button 
                  variant="outlined"
                  size="medium" 
                  fullWidth
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(card.path);
                  }}
                  sx={{ 
                    color: card.color,
                    borderColor: card.color,
                    '&:hover': {
                      borderColor: card.color,
                      backgroundColor: `${card.color}10`
                    }
                  }}
                >
                  Manage {card.title}
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Dashboard;
