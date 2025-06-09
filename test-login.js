// Simple script to test login flow
const axios = require('axios');

async function testLogin() {
  try {
    // First, let's try to login with a vendor account
    console.log('Attempting vendor login...');
    const loginResponse = await axios.post('http://localhost:3004/api/users/login', {
      email: 'vendor@example.com',  // Replace with a valid vendor email
      password: 'password'         // Replace with the vendor password
    });
    
    console.log('Login response:', loginResponse.data);
    
    if (loginResponse.data) {
      // Now fetch vendor data
      const vendorEmail = loginResponse.data.email;
      console.log(`Fetching vendor data for ${vendorEmail}...`);
      
      const vendorResponse = await axios.get(`http://localhost:3004/vendors?email=${encodeURIComponent(vendorEmail)}`);
      console.log('Vendor data:', vendorResponse.data);
    }
  } catch (error) {
    console.error('Login test error:', error.response ? error.response.data : error.message);
  }
}

testLogin();
