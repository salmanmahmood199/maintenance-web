/**
 * Script to update MongoDB with data from local-data.json
 */
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

// Path to local data file
const localDataPath = path.join(__dirname, 'local-data.json');

// Path to backups directory
const backupDir = path.join(__dirname, 'database-backups');
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir);
}

// Data types to merge with their corresponding models
const dataTypes = [
  { name: 'organizations', model: Organization },
  { name: 'vendors', model: Vendor },
  { name: 'locations', model: Location },
  { name: 'subAdmins', model: SubAdmin },
  { name: 'tickets', model: Ticket },
  { name: 'technicians', model: Technician },
  { name: 'users', model: User }
];

// Ensure the local data file exists
function checkFiles() {
  if (!fs.existsSync(localDataPath)) {
    console.error(`Local data file not found: ${localDataPath}`);
    console.log('Please create this file with your data first.');
    return false;
  }
  return true;
}

// Function to create a MongoDB backup
async function createMongoBackup() {
  console.log('Creating MongoDB backup...');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupData = {};
  
  // Get all data from MongoDB
  for (const type of dataTypes) {
    try {
      const items = await type.model.find({});
      backupData[type.name] = items;
    } catch (error) {
      console.error(`Error getting ${type.name} from MongoDB:`, error);
    }
  }
  
  // Save backup to file
  const backupFilePath = path.join(backupDir, `mongo-backup-${timestamp}.json`);
  fs.writeFileSync(backupFilePath, JSON.stringify(backupData, null, 2));
  console.log(`MongoDB backup created at ${backupFilePath}`);
}

// Function to update MongoDB with local data
async function updateMongoDb(localData) {
  const results = {};
  
  // Process each data type
  for (const type of dataTypes) {
    const typeName = type.name;
    const Model = type.model;
    
    if (!localData[typeName]) {
      console.log(`No ${typeName} data found in local data.`);
      results[typeName] = { added: 0, updated: 0 };
      continue;
    }
    
    if (!Array.isArray(localData[typeName])) {
      console.log(`${typeName} data is not an array, skipping.`);
      results[typeName] = { added: 0, updated: 0 };
      continue;
    }
    
    console.log(`Processing ${localData[typeName].length} ${typeName} from local data...`);
    const added = [];
    const updated = [];
    
    // Process each item from local data
    for (const item of localData[typeName]) {
      if (!item || !item.id) continue;
      
      try {
        // Check if item exists in MongoDB
        const existingItem = await Model.findOne({ id: item.id });
        
        if (existingItem) {
          // Update existing item
          await Model.findOneAndUpdate({ id: item.id }, item, { new: true });
          updated.push(item.id);
        } else {
          // Add new item
          const newItem = new Model(item);
          await newItem.save();
          added.push(item.id);
        }
      } catch (error) {
        console.error(`Error processing ${typeName} item ${item.id}:`, error);
      }
    }
    
    results[typeName] = { added: added.length, updated: updated.length };
    console.log(`Updated ${typeName}: ${added.length} added, ${updated.length} updated`);
  }
  
  return results;
}

// Main function
async function main() {
  try {
    if (!checkFiles()) {
      process.exit(1);
    }
    
    // Connect to MongoDB
    await connectDB();
    console.log('Connected to MongoDB');
    
    console.log('Reading local data...');
    const localData = JSON.parse(fs.readFileSync(localDataPath, 'utf8'));
    
    // Create a backup of the current MongoDB data
    await createMongoBackup();
    
    // Update MongoDB with local data
    const results = await updateMongoDb(localData);
    
    // Print summary
    console.log('\nUpdate summary:');
    Object.keys(results).forEach(type => {
      console.log(`- ${type}: ${results[type].added} added, ${results[type].updated} updated`);
    });
    
    console.log('\nMongoDB update complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run the update process
main();
