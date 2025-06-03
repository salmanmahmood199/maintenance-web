require('dotenv').config();
const mongoose = require('mongoose');

// Direct connection to maintenance_web database
const MONGODB_URI = 'mongodb+srv://salman:Salman1234@task-scout.mwxmqcg.mongodb.net/maintenance_web';
console.log('Connecting to:', MONGODB_URI.replace(/:[^:]*@/, ':****@'));

async function checkDatabase() {
  try {
    // Connect directly to MongoDB maintenance_web database
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB maintenance_web database');
    
    // We'll use direct MongoDB queries rather than models
    // since we're not sure about the schema
    const db = mongoose.connection.db;
    
    // List all collections
    const collections = await db.listCollections().toArray();
    console.log('\nCollections in the database:');
    collections.forEach(collection => {
      console.log(`- ${collection.name}`);
    });
    
    // Check vendors collection
    const vendors = await db.collection('vendors').find({}).toArray();
    console.log(`\nFound ${vendors.length} vendors`);
    
    if (vendors.length > 0) {
      console.log('Sample vendor fields:', Object.keys(vendors[0]));
      
      // Print vendor IDs for reference
      console.log('\nVendor IDs:');
      vendors.forEach(vendor => {
        console.log(`${vendor.name || 'Unnamed'}: ${vendor._id || vendor.id}`);
      });
    }
    
    // Check tickets collection
    const tickets = await db.collection('tickets').find({}).toArray();
    console.log(`\nFound ${tickets.length} tickets`);
    
    if (tickets.length > 0) {
      // Sample of ticket fields
      console.log('Sample ticket fields:', Object.keys(tickets[0]));
      
      // Check how many tickets have vendorId or assignedVendorId fields
      const ticketsWithVendorId = tickets.filter(ticket => ticket.vendorId);
      const ticketsWithAssignedVendorId = tickets.filter(ticket => ticket.assignedVendorId);
      
      console.log(`\nTickets with vendorId: ${ticketsWithVendorId.length}`);
      console.log(`Tickets with assignedVendorId: ${ticketsWithAssignedVendorId.length}`);
      
      // If we have tickets with vendorIds, check if they match existing vendors
      if (ticketsWithVendorId.length > 0) {
        console.log('\nTickets with vendors assigned:');
        for (const ticket of ticketsWithVendorId) {
          const vendor = vendors.find(v => v._id === ticket.vendorId || v.id === ticket.vendorId);
          console.log(`Ticket ID: ${ticket._id || ticket.id}, Vendor ID: ${ticket.vendorId}, Vendor Name: ${vendor ? vendor.name : 'NOT FOUND'}`);
        }
      }
      
      // If we have tickets with assignedVendorIds, check if they match existing vendors
      if (ticketsWithAssignedVendorId.length > 0) {
        console.log('\nTickets with assignedVendorId:');
        for (const ticket of ticketsWithAssignedVendorId) {
          const vendor = vendors.find(v => v._id === ticket.assignedVendorId || v.id === ticket.assignedVendorId);
          console.log(`Ticket ID: ${ticket._id || ticket.id}, AssignedVendor ID: ${ticket.assignedVendorId}, Vendor Name: ${vendor ? vendor.name : 'NOT FOUND'}`);
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
