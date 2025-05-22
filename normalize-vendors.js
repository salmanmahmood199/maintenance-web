require('dotenv').config();
const connectDB = require('./src/db/mongodb');
const Vendor = require('./src/models/Vendor');

async function normalizeVendorData() {
  console.log('Starting vendor data normalization...');
  
  try {
    // Connect to MongoDB
    await connectDB();
    
    // Retrieve all vendors
    const vendors = await Vendor.find({});
    console.log(`Found ${vendors.length} vendors to normalize`);
    
    let normalizedCount = 0;
    
    // Normalize each vendor
    for (const vendor of vendors) {
      let needsUpdate = false;
      
      // Normalize organization IDs
      if (vendor.orgIds && vendor.orgIds.length > 0 && (!vendor.orgContextIds || vendor.orgContextIds.length === 0)) {
        vendor.orgContextIds = [...vendor.orgIds];
        needsUpdate = true;
      } else if (vendor.orgContextIds && vendor.orgContextIds.length > 0 && (!vendor.orgIds || vendor.orgIds.length === 0)) {
        vendor.orgIds = [...vendor.orgContextIds];
        needsUpdate = true;
      }
      
      // Normalize services field
      if (vendor.specialties && !vendor.services) {
        // If specialties is a comma-separated string, convert to array
        if (typeof vendor.specialties === 'string' && vendor.specialties.includes(',')) {
          vendor.services = vendor.specialties.split(',').map(s => s.trim());
        } else {
          vendor.services = [vendor.specialties];
        }
        needsUpdate = true;
      }
      
      // Ensure tier is a number
      if (vendor.tier && typeof vendor.tier === 'string') {
        vendor.tier = parseInt(vendor.tier);
        needsUpdate = true;
      }
      
      // Save if changes were made
      if (needsUpdate) {
        await vendor.save();
        normalizedCount++;
        console.log(`Normalized vendor: ${vendor.name} (${vendor.id})`);
      }
    }
    
    console.log(`Normalization completed. Updated ${normalizedCount} vendors.`);
    process.exit(0);
  } catch (error) {
    console.error('Normalization failed:', error);
    process.exit(1);
  }
}

normalizeVendorData();
