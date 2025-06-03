import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  Container, 
  TextField, 
  Typography, 
  Paper,
  Alert
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  
  // Default redirect path
  
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  // Handle login
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validate form
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }
    
    // Attempt login
    const user = await login(email, password);
    if (user) {
      // Navigate to intended destination
  var from = location.state?.from?.pathname || '/dashboard';
  if(user?.role == 'vendor') {
    from = '/vendors/'+user?.vendorId;
  }
  console.log(from, user.role)
  navigate(from, { replace: true });
    } else {
      setError('Invalid email or password. Please check your credentials and try again.');
    }
  };
  
  return (
    <Container maxWidth="sm" sx={{ height: '100vh', display: 'flex', alignItems: 'center' }}>
      <Paper 
        elevation={3} 
        sx={{ 
          padding: 4, 
          display: 'flex', 
          flexDirection: 'column', 
          width: '100%' 
        }}
      >
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Maintenance App
        </Typography>
        
        <Typography variant="h5" component="h2" gutterBottom align="center">
          Login
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Box component="form" onSubmit={handleLogin} noValidate>
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
          >
            Sign In
          </Button>
          
          <Typography variant="body2" color="text.secondary" align="center">
            Administrator login: root@mail.com / admin<br/>
            Or use credentials for any user you've created
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default LoginPage;
