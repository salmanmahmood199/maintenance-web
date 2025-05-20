/**
 * Utility to sync data between localStorage and the JSON server
 */

// JSON Server API URL
const API_URL = 'http://localhost:3004';

// Function to get data from localStorage
export const getLocalData = () => {
  try {
    const data = localStorage.getItem('maintenanceAppData');
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return null;
  }
};

// Function to sync data from localStorage to the JSON server
export const syncToServer = async () => {
  try {
    // Get data from localStorage
    const localData = getLocalData();
    if (!localData) {
      console.error('No data found in localStorage');
      return { success: false, message: 'No data found in localStorage' };
    }

    // Get current data from server
    const response = await fetch(`${API_URL}/`);
    if (!response.ok) {
      throw new Error(`Failed to fetch data from JSON server: ${response.status}`);
    }
    
    const serverData = await response.json();
    
    // Merge the data
    const mergedData = mergeData(localData, serverData);
    
    // Update the server data
    const updateResponse = await fetch(`${API_URL}/db`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(mergedData)
    });
    
    if (!updateResponse.ok) {
      throw new Error(`Failed to update JSON server: ${updateResponse.status}`);
    }
    
    return { 
      success: true, 
      message: 'Data successfully synchronized with server' 
    };
  } catch (error) {
    console.error('Error syncing data to server:', error);
    return { 
      success: false, 
      message: `Error syncing data: ${error.message}` 
    };
  }
};

// Function to merge localStorage data with server data
const mergeData = (localData, serverData) => {
  if (!localData || !serverData) {
    throw new Error('Cannot merge: missing data');
  }
  
  // Create a new object for the merged data
  const mergedData = { ...serverData };
  
  // Process each entity type
  Object.keys(localData).forEach(key => {
    if (Array.isArray(localData[key]) && Array.isArray(mergedData[key])) {
      // For arrays, merge based on IDs to avoid duplicates
      const idMap = new Map();
      
      // Add existing server items to the map
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
      // For non-arrays, use the localStorage data if available
      mergedData[key] = localData[key];
    }
  });
  
  return mergedData;
};

// Function to sync data on component mount
export const setupAutoSync = (interval = 60000) => {
  // Sync on initial load
  syncToServer();
  
  // Set up periodic sync
  const syncInterval = setInterval(() => {
    syncToServer();
  }, interval);
  
  // Return cleanup function
  return () => clearInterval(syncInterval);
};

// Sync before unloading the page
export const setupUnloadSync = () => {
  const handleBeforeUnload = () => {
    syncToServer();
  };
  
  window.addEventListener('beforeunload', handleBeforeUnload);
  
  // Return cleanup function
  return () => window.removeEventListener('beforeunload', handleBeforeUnload);
};

// Setup a function to add a sync button to the UI
export const addSyncButton = (containerId) => {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  const button = document.createElement('button');
  button.textContent = 'Sync to Server';
  button.style.position = 'fixed';
  button.style.bottom = '20px';
  button.style.right = '20px';
  button.style.zIndex = '9999';
  button.style.padding = '10px 15px';
  button.style.backgroundColor = '#4CAF50';
  button.style.color = 'white';
  button.style.border = 'none';
  button.style.borderRadius = '4px';
  button.style.cursor = 'pointer';
  button.style.boxShadow = '0 2px 5px rgba(0,0,0,0.3)';
  
  button.addEventListener('click', async () => {
    button.disabled = true;
    button.textContent = 'Syncing...';
    
    const result = await syncToServer();
    
    button.textContent = result.success ? '✓ Synced!' : '❌ Failed';
    
    setTimeout(() => {
      button.textContent = 'Sync to Server';
      button.disabled = false;
    }, 2000);
  });
  
  container.appendChild(button);
};
