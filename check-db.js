require('dotenv').config();
const mongoose = require('mongoose');
const Ticket = require('./src/models/Ticket');
const Vendor = require('./src/models/Vendor');

// Override the connection string to use maintenance_web database
const MONGODB_URI = process.env.MONGODB_URI.replace('main$', 'maintenance_web');
console.log('Using connection:', MONGODB_URI.replace(/:[^:]*@/, ':****@'));

async function checkDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Get all vendors
    const vendors = await Vendor.find({});
    console.log(`\nFound ${vendors.length} vendors`);
    
    if (vendors.length > 0) {
      console.log('Sample vendor fields:', Object.keys(vendors[0].toObject()));
      
      // Print vendor IDs for reference
      console.log('\nVendor IDs:');
      vendors.forEach(vendor => {
        console.log(`${vendor.name}: ${vendor.id}`);
      });
    }
    
    // Get all tickets
    const tickets = await Ticket.find({});
    console.log(`\nFound ${tickets.length} tickets`);
    
    if (tickets.length > 0) {
      // Sample of ticket fields
      console.log('Sample ticket fields:', Object.keys(tickets[0].toObject()));
      
      // Check how many tickets have vendorId or assignedVendorId fields
      const ticketsWithVendorId = tickets.filter(ticket => ticket.vendorId);
      const ticketsWithAssignedVendorId = tickets.filter(ticket => ticket.assignedVendorId);
      
      console.log(`\nTickets with vendorId: ${ticketsWithVendorId.length}`);
      console.log(`Tickets with assignedVendorId: ${ticketsWithAssignedVendorId.length}`);
      
      // If we have tickets with vendorIds, check if they match existing vendors
      if (ticketsWithVendorId.length > 0) {
        console.log('\nTickets with vendors assigned:');
        for (const ticket of ticketsWithVendorId) {
          const vendor = vendors.find(v => v.id === ticket.vendorId);
          console.log(`Ticket ID: ${ticket.id}, Vendor ID: ${ticket.vendorId}, Vendor Name: ${vendor ? vendor.name : 'NOT FOUND'}`);
        }
      }
      
      // If we have tickets with assignedVendorIds, check if they match existing vendors
      if (ticketsWithAssignedVendorId.length > 0) {
        console.log('\nTickets with assignedVendorId:');
        for (const ticket of ticketsWithAssignedVendorId) {
          const vendor = vendors.find(v => v.id === ticket.assignedVendorId);
          console.log(`Ticket ID: ${ticket.id}, AssignedVendor ID: ${ticket.assignedVendorId}, Vendor Name: ${vendor ? vendor.name : 'NOT FOUND'}`);
        }
      }
    } else {
      console.log('No tickets found in the database');
    }
    
  } catch (error) {
    console.error('Database check error:', error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run the check
checkDatabase();
