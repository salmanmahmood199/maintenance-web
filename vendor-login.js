// Set up a vendor user in localStorage
const vendorUser = {
  id: 'vendor-123',
  name: 'Test Vendor',
  email: 'vendor@example.com',
  role: 'vendor',
  vendorId: 'nr vendor', // Match the vendorId shown in the ticket
  token: 'fake-jwt-token'
};

// Store vendor user in localStorage
localStorage.setItem('user', JSON.stringify(vendorUser));
console.log('Logged in as vendor user with vendorId:', vendorUser.vendorId);
alert('Vendor login complete! Refresh the page to see the accept/reject buttons.');
