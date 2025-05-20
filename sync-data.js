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
      return JSON.parse(localStorage.getItem('maintenanceAppData'));
    } else {
      // When running in Node.js, ask the user to export the data first
      console.log('This script needs to be run in the browser to access localStorage data.');
      console.log('Please follow the manual steps below:');
      console.log('1. Open your browser console on your app (localhost:3000)');
      console.log('2. Run this command to get localStorage data:');
      console.log('   const data = JSON.parse(localStorage.getItem("maintenanceAppData"))');
      console.log('3. Then run:');
      console.log('   console.log(JSON.stringify(data, null, 2))');
      console.log('4. Copy the output and save it to a file named "local-data.json"');
      console.log('5. Then run this script again with: node sync-data.js --from-file');
      
      // Check if we're trying to read from a file as fallback
      if (process.argv.includes('--from-file')) {
        try {
          const localDataPath = path.join(__dirname, 'local-data.json');
          if (fs.existsSync(localDataPath)) {
            return JSON.parse(fs.readFileSync(localDataPath, 'utf8'));
          } else {
            console.error(`File not found: ${localDataPath}`);
            console.log('Please create this file with your localStorage data first.');
            return null;
          }
        } catch (fileErr) {
          console.error('Error reading local-data.json file:', fileErr);
          return null;
        }
      }
      
      return null;
    }
  } catch (error) {
    console.error('Error extracting localStorage data:', error);
    return null;
  }
}

// Function to read the current db.json file
function readDbJson() {
  try {
    return JSON.parse(fs.readFileSync(dbJsonPath, 'utf8'));
  } catch (error) {
    console.error('Error reading db.json:', error);
    return null;
  }
}

// Function to write to db.json file
function writeDbJson(data) {
  try {
    // Create a backup of the current db.json first
    const backupPath = `${dbJsonPath}.backup-${new Date().toISOString().replace(/:/g, '-')}`;
    fs.copyFileSync(dbJsonPath, backupPath);
    console.log(`Created backup at: ${backupPath}`);
    
    // Write the new data to db.json
    fs.writeFileSync(dbJsonPath, JSON.stringify(data, null, 2));
    console.log('Successfully updated db.json!');
    return true;
  } catch (error) {
    console.error('Error writing to db.json:', error);
    return false;
  }
}

// Function to merge localStorage data with db.json
function mergeData(localData, dbData) {
  if (!localData || !dbData) {
    console.error('Cannot merge: missing data');
    return null;
  }
  
  // Create a new object for the merged data
  const mergedData = { ...dbData };
  
  // Loop through each key in localData and merge with dbData
  Object.keys(localData).forEach(key => {
    if (Array.isArray(localData[key]) && Array.isArray(mergedData[key])) {
      // For arrays, we need to merge based on IDs to avoid duplicates
      const idMap = new Map();
      
      // Add existing items from db.json to the map
      mergedData[key].forEach(item => {
        if (item.id) {
          idMap.set(item.id, item);
        }
      });
      
      // Add/update items from localStorage
      localData[key].forEach(item => {
        if (item.id) {
          idMap.set(item.id, item);
        }
      });
      
      // Convert map back to array
      mergedData[key] = Array.from(idMap.values());
    } else {
      // For non-arrays, use the localStorage data
      mergedData[key] = localData[key];
    }
  });
  
  return mergedData;
}

// Function to send data to JSON server
async function updateJsonServer(data) {
  try {
    // Direct file update is more reliable for our case
    const success = writeDbJson(data);
    
    if (success) {
      console.log('Data has been successfully synchronized!');
      console.log('You may need to restart your JSON server to see the changes.');
      console.log('To restart, press Ctrl+C to stop the server and run:');
      console.log('npm run server');
    }
  } catch (error) {
    console.error('Error updating JSON server:', error);
  }
}

// Main function
async function syncData() {
  // Get data from localStorage (or file in Node.js context)
  const localData = extractLocalStorageData();
  if (!localData) {
    console.error('Failed to get localStorage data');
    return;
  }
  
  // Get current data from db.json
  const dbData = readDbJson();
  if (!dbData) {
    console.error('Failed to read db.json');
    return;
  }
  
  // Merge the data
  const mergedData = mergeData(localData, dbData);
  if (!mergedData) {
    console.error('Failed to merge data');
    return;
  }
  
  // Update the JSON server
  await updateJsonServer(mergedData);
}

// Run the sync process
syncData().catch(error => {
  console.error('Error in syncData:', error);
});
