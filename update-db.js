/**
 * Simple script to update db.json with data from local-data.json
 * No external dependencies required
 */

const fs = require('fs');
const path = require('path');

// Paths to the data files
const localDataPath = path.join(__dirname, 'local-data.json');
const dbJsonPath = path.join(__dirname, 'db.json');

// Function to read a JSON file
function readJsonFile(filePath) {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    return null;
  }
}

// Function to write to a JSON file
function writeJsonFile(filePath, data) {
  try {
    // Create a backup first
    const backupPath = `${filePath}.backup-${new Date().toISOString().replace(/:/g, '-')}`;
    fs.copyFileSync(filePath, backupPath);
    console.log(`Created backup at: ${backupPath}`);
    
    // Write the data
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`Successfully updated ${filePath}`);
    return true;
  } catch (error) {
    console.error(`Error writing to ${filePath}:`, error);
    return false;
  }
}

// Function to merge local data with db.json data
function mergeData(localData, dbData) {
  if (!localData || !dbData) {
    console.error('Cannot merge: missing data');
    return null;
  }
  
  // Create a new object for the merged data
  const mergedData = { ...dbData };
  
  // Process each entity type
  Object.keys(localData).forEach(key => {
    if (Array.isArray(localData[key]) && Array.isArray(mergedData[key])) {
      // For arrays, we need to merge based on IDs to avoid duplicates
      const idMap = new Map();
      
      // Add existing items to the map
      mergedData[key].forEach(item => {
        if (item.id) {
          idMap.set(item.id, item);
        }
      });
      
      // Add/update items from localData
      localData[key].forEach(item => {
        if (item.id) {
          idMap.set(item.id, item);
        }
      });
      
      // Convert map back to array
      mergedData[key] = Array.from(idMap.values());
    } else {
      // For non-arrays or if key doesn't exist in db.json, use local data
      mergedData[key] = localData[key];
    }
  });
  
  return mergedData;
}

// Main function
function updateDb() {
  console.log('Reading local data...');
  const localData = readJsonFile(localDataPath);
  if (!localData) {
    console.error('Failed to read local data. Exiting.');
    return;
  }
  
  console.log('Reading db.json...');
  const dbData = readJsonFile(dbJsonPath);
  if (!dbData) {
    console.error('Failed to read db.json. Exiting.');
    return;
  }
  
  console.log('Merging data...');
  const mergedData = mergeData(localData, dbData);
  if (!mergedData) {
    console.error('Failed to merge data. Exiting.');
    return;
  }
  
  console.log('Updating db.json...');
  const success = writeJsonFile(dbJsonPath, mergedData);
  
  if (success) {
    console.log('Data has been successfully synchronized!');
    console.log('You may need to restart your JSON server to see the changes.');
    console.log('To restart, press Ctrl+C to stop the server and run:');
    console.log('npm run server');
  }
}

// Run the update
updateDb();
