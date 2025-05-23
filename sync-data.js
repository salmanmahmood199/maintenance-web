/**
 * Script to transfer data from localStorage to the JSON server
 * This will extract data from localStorage and send it to update db.json
 */

const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

// Path to the db.json file
const dbJsonPath = path.join(__dirname, 'db.json');

// Function to read localStorage data
function extractLocalStorageData() {
  try {
    // For Node.js, we'll simulate reading from localStorage by reading from a file
    // In the browser, you would use:
    // return JSON.parse(localStorage.getItem('maintenanceAppData'));
    
    // Check if we're in a browser environment or Node.js
    if (typeof window !== 'undefined' && window.localStorage) {
      console.log('Reading from browser localStorage...');

// Path to backups directory
const backupDir = path.join(__dirname, 'database-backups');

// Ensure backups directory exists
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir);
}

// Data types to extract from localStorage with their corresponding model
const dataTypes = [
  { name: 'organizations', model: Organization },
  { name: 'vendors', model: Vendor },
  { name: 'locations', model: Location },
  { name: 'subAdmins', model: SubAdmin },
  { name: 'tickets', model: Ticket },
  { name: 'technicians', model: Technician },
  { name: 'users', model: User }
];

// Initialize data object
const extractedData = {};

// Function to process localStorage data
async function processLocalStorage(filePath) {
  if (!filePath) {
    console.error('Please provide a path to the localStorage backup file');
    process.exit(1);
  }

  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }

  console.log(`Reading localStorage data from ${filePath}...`);
  const fileContent = fs.readFileSync(filePath, 'utf8');
  let localStorageData;

  try {
    localStorageData = JSON.parse(fileContent);
  } catch (error) {
    console.error('Error parsing localStorage data:', error);
    process.exit(1);
  }

  // Extract data for each type
  dataTypes.forEach(type => {
    const key = `maintenance-web-${type.name}`;
    if (localStorageData[key]) {
      try {
        extractedData[type.name] = JSON.parse(localStorageData[key]);
      } catch (error) {
        console.error(`Error parsing ${key}:`, error);
      }
    }
  });
}

// Function to create MongoDB backup
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

// Function to merge localStorage data with MongoDB
async function mergeDataWithMongo(localData) {
  const results = {};
  
  // Process each data type
  for (const type of dataTypes) {
    const typeName = type.name;
    const Model = type.model;
    
    if (!localData[typeName] || !Array.isArray(localData[typeName])) {
      results[typeName] = { added: 0, updated: 0 };
      continue;
    }
    
    console.log(`Processing ${typeName}...`);
    const added = [];
    const updated = [];
    
    // Process each item from localStorage
    for (const item of localData[typeName]) {
      if (!item.id) continue;
      
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
  }
  
  return results;
}

// Prompt for confirmation
function promptForConfirmation(message) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise(resolve => {
    rl.question(`${message} (y/n): `, answer => {
      rl.close();
      resolve(answer.toLowerCase() === 'y');
    });
  });
}

// Main function
async function main() {
  try {
    // Connect to MongoDB
    await connectDB();
    console.log('Connected to MongoDB');
    
    // Process localStorage data
    await processLocalStorage(localStoragePath);
    
    // Check if we have data to process
    const hasData = Object.keys(extractedData).some(type => {
      return extractedData[type] && extractedData[type].length > 0;
    });
    
    if (!hasData) {
      console.log('No data found in localStorage backup.');
      process.exit(0);
    }
    
    // Print summary of data found
    console.log('\nData extracted from localStorage:');
    dataTypes.forEach(type => {
      const count = extractedData[type.name] ? extractedData[type.name].length : 0;
      console.log(`- ${type.name}: ${count} items`);
    });
    
    // Ask for confirmation
    const confirmed = await promptForConfirmation('\nDo you want to merge this data with MongoDB?');
    if (!confirmed) {
      console.log('Operation cancelled.');
      process.exit(0);
    }
    
    // Create backup of current MongoDB data
    await createMongoBackup();
    
    // Merge the data with MongoDB
    const results = await mergeDataWithMongo(extractedData);
    
    // Print results
    console.log('\nSync results:');
    Object.keys(results).forEach(type => {
      console.log(`- ${type}: ${results[type].added} added, ${results[type].updated} updated`);
    });
    
    console.log('\nData successfully synced to MongoDB!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run the main function
main();
