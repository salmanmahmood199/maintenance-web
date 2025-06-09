// Set up a vendor user in localStorage with the CORRECT key name
const vendorUser = {
  email: 'vendor@example.com',
  role: 'vendor',
  name: 'Test Vendor',
  vendorId: 'nr vendor', // Match the vendorId from your screenshot
  permissions: ['vendor.acceptTicket', 'vendor.rejectTicket']
};

// Store vendor user with CORRECT localStorage key
localStorage.setItem('maintenanceAppUser', JSON.stringify(vendorUser));
console.log('Logged in as vendor user with vendorId:', vendorUser.vendorId);
alert('Vendor login complete! Refresh the page to see the accept/reject buttons.');
