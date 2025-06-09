// This script adds a test vendor user to local storage to simulate login
const vendorUser = {
  email: 'service@fastfix.com', // Using an email from your vendors list
  role: 'vendor',
  name: 'Fast Fix Maintenance',
  vendorId: '8faa2e56-edda-4b17-a965-4827eafba242'
};

// Save to localStorage so the app thinks you're logged in
localStorage.setItem('maintenanceAppUser', JSON.stringify(vendorUser));
console.log('Vendor login simulated successfully!');
