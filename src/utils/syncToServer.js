/**
 * Utility to interact with the MongoDB API server
 * 
 * Since we've migrated to MongoDB exclusively, this file has been updated
 * to reflect that we no longer need localStorage syncing, but kept some
 * utility functions for API health checks and data refreshing.
 */

// MongoDB API URL
const API_URL = 'http://localhost:3004';

// Function to check if the MongoDB API server is running
export const checkServerHealth = async () => {
  try {
    const response = await fetch(`${API_URL}/health`);
    if (!response.ok) {
      throw new Error(`API server health check failed: ${response.status}`);
    }
    
    const data = await response.json();
    return { 
      success: true, 
      status: data.status,
      message: 'API server is running' 
    };
  } catch (error) {
    console.error('API server health check error:', error);
    return { 
      success: false, 
      status: 'down',
      message: `API server error: ${error.message}` 
    };
  }
};

// Function to refresh data from MongoDB server
export const refreshFromServer = async () => {
  try {
    // Check server health first
    const healthCheck = await checkServerHealth();
    if (!healthCheck.success) {
      return healthCheck;
    }
    
    // Trigger a page refresh to reload all data from MongoDB
    window.location.reload();
    
    return { 
      success: true, 
      message: 'Data refreshed from database' 
    };
  } catch (error) {
    console.error('Error refreshing data:', error);
    return { 
      success: false, 
      message: `Error refreshing data: ${error.message}` 
    };
  }
};

// This function is no longer needed since we're using MongoDB directly
// It's kept here for backward compatibility but now just refreshes from server
export const syncToServer = async () => {
  return await refreshFromServer();
};

// Function to check MongoDB server status periodically
export const setupAutoSync = (interval = 60000) => {
  // Initial health check
  checkServerHealth();
  
  // Set up periodic health checks
  const healthCheckInterval = setInterval(() => {
    checkServerHealth();
  }, interval);
  
  // Return cleanup function
  return () => clearInterval(healthCheckInterval);
};

// This function is no longer needed but kept for backward compatibility
export const setupUnloadSync = () => {
  // No need to sync before unloading since we're directly using MongoDB
  // Return empty cleanup function for compatibility
  return () => {};
};

// Setup a function to add a refresh button to the UI
export const addSyncButton = (containerId) => {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  const button = document.createElement('button');
  button.textContent = 'Refresh Data';
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
    button.textContent = 'Refreshing...';
    
    const result = await refreshFromServer();
    
    if (!result.success) {
      button.textContent = '❌ Failed';
      
      setTimeout(() => {
        button.textContent = 'Refresh Data';
        button.disabled = false;
      }, 2000);
    }
    // No need for success case handling since page will refresh
  });
  
  container.appendChild(button);
};
