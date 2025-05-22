require('dotenv').config();
const fs = require('fs');
const path = require('path');
const connectDB = require('./src/db/mongodb');

// Import models
const Organization = require('./src/models/Organization');
const Vendor = require('./src/models/Vendor');
const Location = require('./src/models/Location');
const SubAdmin = require('./src/models/SubAdmin');
const Ticket = require('./src/models/Ticket');
const Technician = require('./src/models/Technician');
const User = require('./src/models/User');

async function migrateData() {
  console.log('Starting migration to MongoDB...');
  
  try {
    // Connect to MongoDB
    await connectDB();
    
    // Read the JSON file
    const jsonData = JSON.parse(fs.readFileSync(path.join(__dirname, 'db.json'), 'utf8'));
    
    // Clear existing collections (optional - uncomment if needed)
    // await Organization.deleteMany({});
    // await Vendor.deleteMany({});
    // await Location.deleteMany({});
    // await SubAdmin.deleteMany({});
    // await Ticket.deleteMany({});
    // await Technician.deleteMany({});
    // await User.deleteMany({});
    
    // Migrate organizations
    if (jsonData.organizations && jsonData.organizations.length > 0) {
      console.log(`Migrating ${jsonData.organizations.length} organizations...`);
      try {
        const orgResults = await Organization.insertMany(jsonData.organizations);
        console.log(`✓ Migrated ${orgResults.length} organizations`);
      } catch (err) {
        console.error('Error migrating organizations:', err.message);
      }
    }
    
    // Migrate vendors
    if (jsonData.vendors && jsonData.vendors.length > 0) {
      console.log(`Migrating ${jsonData.vendors.length} vendors...`);
      try {
        const vendorResults = await Vendor.insertMany(jsonData.vendors);
        console.log(`✓ Migrated ${vendorResults.length} vendors`);
      } catch (err) {
        console.error('Error migrating vendors:', err.message);
      }
    }
    
    // Migrate locations - Process each location to ensure data compatibility
    if (jsonData.locations && jsonData.locations.length > 0) {
      console.log(`Migrating ${jsonData.locations.length} locations...`);
      try {
        // Map locations to ensure compatibility with our schema
        const processedLocations = jsonData.locations.map(location => {
          // Copy the location object to avoid modifying the original
          const processedLocation = { ...location };
          
          // If we have orgId but not organizationId, make sure we have one or the other
          if (!processedLocation.organizationId && processedLocation.orgId) {
            processedLocation.organizationId = processedLocation.orgId;
          }
          
          return processedLocation;
        });
        
        // Insert the processed locations
        const locationResults = await Location.insertMany(processedLocations, { ordered: false });
        console.log(`✓ Migrated ${locationResults.length} locations`);
      } catch (err) {
        console.error('Error migrating locations:', err.message);
      }
    }
    
    // Migrate subadmins
    if (jsonData.subAdmins && jsonData.subAdmins.length > 0) {
      console.log(`Migrating ${jsonData.subAdmins.length} subadmins...`);
      try {
        const subAdminResults = await SubAdmin.insertMany(jsonData.subAdmins, { ordered: false });
        console.log(`✓ Migrated ${subAdminResults.length} subadmins`);
      } catch (err) {
        console.error('Error migrating subadmins:', err.message);
      }
    }
    
    // Migrate tickets
    if (jsonData.tickets && jsonData.tickets.length > 0) {
      console.log(`Migrating ${jsonData.tickets.length} tickets...`);
      try {
        const ticketResults = await Ticket.insertMany(jsonData.tickets, { ordered: false });
        console.log(`✓ Migrated ${ticketResults.length} tickets`);
      } catch (err) {
        console.error('Error migrating tickets:', err.message);
      }
    }
    
    // Migrate technicians
    if (jsonData.technicians && jsonData.technicians.length > 0) {
      console.log(`Migrating ${jsonData.technicians.length} technicians...`);
      try {
        const technicianResults = await Technician.insertMany(jsonData.technicians, { ordered: false });
        console.log(`✓ Migrated ${technicianResults.length} technicians`);
      } catch (err) {
        console.error('Error migrating technicians:', err.message);
      }
    }
    
    // Migrate users
    if (jsonData.users && jsonData.users.length > 0) {
      console.log(`Migrating ${jsonData.users.length} users...`);
      try {
        const userResults = await User.insertMany(jsonData.users, { ordered: false });
        console.log(`✓ Migrated ${userResults.length} users`);
      } catch (err) {
        console.error('Error migrating users:', err.message);
      }
    }
    
    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrateData();
