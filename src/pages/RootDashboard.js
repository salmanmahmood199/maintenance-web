import React from 'react';
import { 
  Box, 
  Grid,
  Typography,
  Card,
  CardHeader,
  CardContent,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  Alert
} from '@mui/material';
import { 
  Business as BusinessIcon,
  Group as GroupIcon,
  Storefront as VendorIcon,
  LocationOn as LocationIcon,
  AssignmentLate as TicketIcon,
  ArrowForward as ArrowForwardIcon,
  TrendingUp as TrendingUpIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import PermissionGuard from '../components/PermissionGuard';
import { menuPermissionMap } from '../utils/permissionUtils';

const RootDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data } = useData();
  
  // Get data counts for the dashboard
  const totalOrganizations = data?.organizations?.length || 0;
  const totalVendors = data?.vendors?.length || 0;
  const totalSubAdmins = data?.subAdmins?.length || 0;
  const totalLocations = data?.locations?.length || 0;
  const totalTickets = data?.tickets?.length || 0;

  // Define all cards with their required permissions
  const allSummaryCards = [
    {
      title: 'Organizations',
      count: totalOrganizations,
      icon: <BusinessIcon />,
      path: '/organizations',
      color: '#3f51b5',
      requiredPermissions: ['subadmin.createOrganization', 'subadmin.editOrganization'] // Only for org administrators
    },
    {
      title: 'Vendors',
      count: totalVendors,
      icon: <VendorIcon />,
      path: '/vendors',
      color: '#f50057',
      requiredPermissions: menuPermissionMap['/vendors'] || [] // Vendors management permissions
    },
    {
      title: 'Sub-Admins',
      count: totalSubAdmins,
      icon: <PersonIcon />,
      path: '/subadmins',
      color: '#00bcd4',
      requiredPermissions: ['subadmin.assignLocation'] // User management permissions
    },
    {
      title: 'Locations',
      count: totalLocations,
      icon: <LocationIcon />,
      path: '/locations',
      color: '#4caf50',
      requiredPermissions: menuPermissionMap['org.locations'] || [] // Location management permissions
    },
    {
      title: 'Tickets',
      count: totalTickets,
      icon: <TicketIcon />,
      path: '/tickets',
      color: '#ff9800',
      requiredPermissions: ['subadmin.placeTicket', 'subadmin.viewTickets', 'subadmin.acceptTicket', 
                            'subadmin.verifyJobCompleted'] // Ticket related permissions
    }
  ];
  
  // Filter cards based on user role and permissions
  const summaryCards = user?.role === 'root' 
    ? allSummaryCards // Root sees everything
    : allSummaryCards.filter(card => {
        // If no permissions required or empty array, show to all users
        if (!card.requiredPermissions || card.requiredPermissions.length === 0) return true;
        
        // Check if user has any of the required permissions
        return card.requiredPermissions.some(permission => 
          user?.permissions?.includes(permission)
        );
      });

  // For non-root users, only show their organization
  const filteredOrganizations = user?.role === 'root' 
    ? data?.organizations 
    : data?.organizations?.filter(org => org.id === user?.organizationId);

  // For non-root users, only show vendors related to their organization
  const filteredVendors = user?.role === 'root'
    ? data?.vendors
    : data?.vendors?.filter(vendor => 
        vendor.orgIds?.includes(user?.organizationId)
      );

  // Check if user has permission to see vendors section
  const canSeeVendors = user?.role === 'root' || 
    (user?.permissions && menuPermissionMap['/vendors']?.some(p => user.permissions.includes(p)));

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h4" component="h1" gutterBottom>
        System Analytics Dashboard
      </Typography>
      
      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {summaryCards.map((card) => (
          <Grid item xs={6} md={4} lg={2.4} key={card.title}>
            <Card 
              elevation={2}
              sx={{ 
                display: 'flex', 
                alignItems: 'center',
                p: 2,
                cursor: 'pointer',
                '&:hover': {
                  boxShadow: 3
                }
              }}
              onClick={() => navigate(card.path)}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box
                    sx={{
                      backgroundColor: card.color,
                      borderRadius: '50%',
                      width: 48,
                      height: 48,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mr: 2,
                      color: 'white'
                    }}
                  >
                    {card.icon}
                  </Box>
                  <Box>
                    <Typography variant="h5" component="div">
                      {card.count}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {card.title}
                    </Typography>
                  </Box>
                </Box>
                <IconButton size="small" onClick={(e) => {
                  e.stopPropagation();
                  navigate(card.path);
                }}>
                  <ArrowForwardIcon />
                </IconButton>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Organizations Table - Only shown to users with appropriate permissions */}
      {(user?.role === 'root' || user?.permissions?.some(p => p === 'subadmin.placeTicket')) && (
        <Card elevation={2} sx={{ mb: 4 }}>
          <CardHeader 
            title="Organizations Overview" 
            action={
              <Tooltip title="View All Organizations">
                <IconButton onClick={() => navigate('/organizations')}>
                  <ArrowForwardIcon />
                </IconButton>
              </Tooltip>
            }
          />
          <CardContent sx={{ p: 0 }}>
            {user?.role !== 'root' && user?.organizationId && (
              <Alert severity="info" sx={{ m: 2 }}>
                You are viewing information for your organization only.
              </Alert>
            )}
            <TableContainer component={Paper} elevation={0}>
              <Table sx={{ minWidth: 650 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Organization</TableCell>
                    {(user?.role === 'root' || user?.permissions?.includes('subadmin.assignLocation')) && (
                      <TableCell align="center">Sub-Admins</TableCell>
                    )}
                    {(user?.role === 'root' || user?.permissions?.some(p => 
                      menuPermissionMap['org.locations']?.includes(p))) && (
                      <TableCell align="center">Locations</TableCell>
                    )}
                    {(user?.role === 'root' || user?.permissions?.some(p => 
                      menuPermissionMap['org.vendors']?.includes(p))) && (
                      <TableCell align="center">Vendors</TableCell>
                    )}
                    {(user?.role === 'root' || user?.permissions?.includes('subadmin.placeTicket') || 
                     user?.permissions?.includes('subadmin.viewTickets')) && (
                      <TableCell align="center">Active Tickets</TableCell>
                    )}
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredOrganizations?.slice(0, 5).map((org) => {
                    // Get related data for this organization
                    const orgSubAdmins = data?.subAdmins?.filter(sa => sa.organizationId === org.id) || [];
                    const orgLocations = data?.locations?.filter(loc => loc.organizationId === org.id) || [];
                    const orgVendors = data?.vendors?.filter(v => v.orgIds?.includes(org.id)) || [];
                    const orgTickets = data?.tickets?.filter(t => 
                      t.organizationId === org.id && t.status !== 'closed') || [];
                    
                    return (
                      <TableRow key={org.id} hover onClick={() => navigate(`/organizations/${org.id}`)}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <BusinessIcon sx={{ mr: 1, color: '#3f51b5' }} />
                            <Typography sx={{ fontWeight: 'medium' }}>{org.name}</Typography>
                          </Box>
                        </TableCell>
                        {(user?.role === 'root' || user?.permissions?.includes('subadmin.assignLocation')) && (
                          <TableCell align="center">
                            <Chip 
                              label={orgSubAdmins.length} 
                              variant="outlined" 
                              size="small" 
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/organizations/${org.id}/subadmins`);
                              }}
                            />
                          </TableCell>
                        )}
                        {(user?.role === 'root' || user?.permissions?.some(p => 
                          menuPermissionMap['org.locations']?.includes(p))) && (
                          <TableCell align="center">
                            <Chip 
                              label={orgLocations.length} 
                              variant="outlined" 
                              size="small" 
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/organizations/${org.id}/locations`);
                              }}
                            />
                          </TableCell>
                        )}
                        {(user?.role === 'root' || user?.permissions?.some(p => 
                          menuPermissionMap['org.vendors']?.includes(p))) && (
                          <TableCell align="center">
                            <Chip 
                              label={orgVendors.length} 
                              variant="outlined" 
                              size="small" 
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/organizations/${org.id}/vendors`);
                              }}
                            />
                          </TableCell>
                        )}
                        {(user?.role === 'root' || user?.permissions?.includes('subadmin.placeTicket') || 
                         user?.permissions?.includes('subadmin.viewTickets')) && (
                          <TableCell align="center">
                            <Chip 
                              label={orgTickets.length} 
                              variant="outlined" 
                              size="small" 
                              color={orgTickets.length > 0 ? 'warning' : 'default'}
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/organizations/${org.id}/tickets`);
                              }}
                            />
                          </TableCell>
                        )}
                        <TableCell align="right">
                          <IconButton size="small" onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/organizations/${org.id}`);
                          }}>
                            <ArrowForwardIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filteredOrganizations?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <Typography variant="body2" sx={{ py: 2 }}>No organizations found</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                  {filteredOrganizations?.length > 5 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <Typography 
                          variant="body2" 
                          sx={{ py: 1, cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                          onClick={() => navigate('/organizations')}
                        >
                          View all {filteredOrganizations.length} organizations
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Vendors Table - Only shown to users with vendor permissions */}
      {canSeeVendors && (
        <Card elevation={2}>
          <CardHeader 
            title="Vendors Overview" 
            action={
              <Tooltip title="View All Vendors">
                <IconButton onClick={() => navigate('/vendors')}>
                  <ArrowForwardIcon />
                </IconButton>
              </Tooltip>
            }
          />
          <CardContent sx={{ p: 0 }}>
            {user?.role !== 'root' && (
              <Alert severity="info" sx={{ m: 2 }}>
                You are viewing vendors related to your organization only.
              </Alert>
            )}
            <TableContainer component={Paper} elevation={0}>
              <Table sx={{ minWidth: 650 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Vendor</TableCell>
                    <TableCell>Contact</TableCell>
                    <TableCell align="center">Tier</TableCell>
                    <TableCell align="center">Status</TableCell>
                    <TableCell align="center">Linked Organizations</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredVendors?.slice(0, 5).map((vendor) => {
                    // Get organizations linked to this vendor
                    const linkedOrgs = data?.organizations?.filter(org => 
                      vendor.orgIds?.includes(org.id)) || [];
                    
                    return (
                      <TableRow key={vendor.id} hover onClick={() => navigate(`/vendors/${vendor.id}`)}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <VendorIcon sx={{ mr: 1, color: '#f50057' }} />
                            <Typography sx={{ fontWeight: 'medium' }}>{vendor.name}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{vendor.email}</Typography>
                          <Typography variant="body2" color="text.secondary">{vendor.phone}</Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip 
                            label={`Tier ${vendor.tier || 1}`} 
                            color={
                              vendor.tier === 3 ? 'error' : 
                              vendor.tier === 2 ? 'warning' : 
                              'primary'
                            }
                            size="small"
                            sx={{ opacity: vendor.status === 'inactive' ? 0.5 : 1 }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Chip 
                            label={vendor.status === 'inactive' ? 'Inactive' : 'Active'}
                            color={vendor.status === 'inactive' ? 'default' : 'success'}
                            size="small"
                            variant={vendor.status === 'inactive' ? 'outlined' : 'filled'}
                          />
                        </TableCell>
                        <TableCell align="center">
                          {linkedOrgs.length > 0 ? (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 0.5 }}>
                              {linkedOrgs.slice(0, 2).map(org => (
                                <Chip key={org.id} label={org.name} size="small" variant="outlined" />
                              ))}
                              {linkedOrgs.length > 2 && (
                                <Chip label={`+${linkedOrgs.length - 2} more`} size="small" />
                              )}
                            </Box>
                          ) : (
                            <Typography variant="caption" color="text.secondary">None linked</Typography>
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <IconButton size="small" onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/vendors/${vendor.id}`);
                          }}>
                            <ArrowForwardIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filteredVendors?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <Typography variant="body2" sx={{ py: 2 }}>No vendors found</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                  {filteredVendors?.length > 5 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <Typography 
                          variant="body2" 
                          sx={{ py: 1, cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                          onClick={() => navigate('/vendors')}
                        >
                          View all {filteredVendors.length} vendors
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default RootDashboard;
