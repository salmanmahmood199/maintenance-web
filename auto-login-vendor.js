// Auto-login script for vendor user
const vendorUser = {
  id: 'vendor-123',
  name: 'Test Vendor',
  email: 'vendor@example.com',
  role: 'vendor',
  vendorId: 'v-001', // This is crucial for vendor role
  token: 'fake-jwt-token',
  permissions: ['view_tickets', 'update_tickets']
};

// Store user in localStorage
localStorage.setItem('user', JSON.stringify(vendorUser));
console.log('Logged in as vendor user');
