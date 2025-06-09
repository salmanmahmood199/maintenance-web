// Debug script to verify vendor login and ticket conditions
const debugVendor = () => {
  // Create/ensure vendor user in localStorage
  const vendorUser = {
    id: 'vendor-123',
    name: 'Test Vendor',
    email: 'vendor@example.com',
    role: 'vendor',
    vendorId: 'v-001', 
    token: 'fake-jwt-token'
  };
  localStorage.setItem('user', JSON.stringify(vendorUser));
  console.log('✅ Logged in as vendor user:', vendorUser);
  
  // Check if there's a ticket in the data context
  setTimeout(() => {
    // Try to access DataContext variables from React DevTools
    console.log('Checking current user role from localStorage:', 
      JSON.parse(localStorage.getItem('user'))?.role);
    console.log('If you see a ticket details page, right-click and Inspect Element');
    console.log('Check the status and currentStep properties of the ticket');
    console.log('Conditions for showing accept/reject buttons:');
    console.log('1. User role must be "vendor"'); 
    console.log('2. Ticket status must be one of: "New", "Assigned", "waiting_vendor_response"');
    console.log('   OR ticket.currentStep must be "waiting_vendor_response"');
  }, 2000);
};

// Run the debug function
debugVendor();
