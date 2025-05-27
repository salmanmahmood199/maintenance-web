/**
 * Standard server configuration for maintenance-web
 * Always uses port 3001 and local MongoDB
 */
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./src/db/mongodb');
const mongoose = require('mongoose');

// Import models
const Organization = require('./src/models/Organization');
const Vendor = require('./src/models/Vendor');
const Location = require('./src/models/Location');
const SubAdmin = require('./src/models/SubAdmin');
const Ticket = require('./src/models/Ticket');
const Technician = require('./src/models/Technician');
const User = require('./src/models/User');

const app = express();
const port = 3001; // Set to 3001 for backend API

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Serve static files from the React app
app.use(express.static('build'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'up', database: 'mongodb://localhost:27017/maintenance_web' });
});

// Login endpoint
app.post('/api/users/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if password matches
    if (user.password !== password) {
      return res.status(401).json({ message: 'Invalid password' });
    }
    
    // Return user data without the password
    const userData = user.toObject();
    delete userData.password;
    
    res.json(userData);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Helper function to handle API responses
const handleResponse = (res, data, statusCode = 200) => {
  return res.status(statusCode).json(data);
};

const handleError = (res, error, statusCode = 500) => {
  console.error('API Error:', error);
  return res.status(statusCode).json({ 
    error: error.message || 'An error occurred while processing your request' 
  });
};

// Generic CRUD routes for each model
const createCrudRoutes = (app, modelName, Model) => {
  const path = `/${modelName.toLowerCase()}s`;
  
  // Get all items
  app.get(path, async (req, res) => {
    try {
      const items = await Model.find({});
      handleResponse(res, items);
    } catch (error) {
      handleError(res, error);
    }
  });
  
  // Get single item by ID
  app.get(`${path}/:id`, async (req, res) => {
    try {
      const item = await Model.findOne({ id: req.params.id });
      if (!item) {
        return handleError(res, { message: `${modelName} not found` }, 404);
      }
      handleResponse(res, item);
    } catch (error) {
      handleError(res, error);
    }
  });
  
  // Create new item
  app.post(path, async (req, res) => {
    try {
      console.log(`POST request to ${path}`, req.body);
      const newItem = new Model(req.body);
      console.log('Created model instance:', newItem);
      const savedItem = await newItem.save();
      console.log('Saved item:', savedItem);
      handleResponse(res, savedItem, 201);
    } catch (error) {
      console.error(`Error saving ${modelName}:`, error);
      handleError(res, error);
    }
  });
  
  // Update item
  app.put(`${path}/:id`, async (req, res) => {
    try {
      const updatedItem = await Model.findOneAndUpdate(
        { id: req.params.id },
        req.body,
        { new: true, runValidators: true }
      );
      
      if (!updatedItem) {
        return handleError(res, { message: `${modelName} not found` }, 404);
      }
      
      handleResponse(res, updatedItem);
    } catch (error) {
      handleError(res, error);
    }
  });
  
  // Delete item
  app.delete(`${path}/:id`, async (req, res) => {
    try {
      const deletedItem = await Model.findOneAndDelete({ id: req.params.id });
      
      if (!deletedItem) {
        return handleError(res, { message: `${modelName} not found` }, 404);
      }
      
      handleResponse(res, { message: `${modelName} deleted successfully` });
    } catch (error) {
      handleError(res, error);
    }
  });
};

// Create CRUD routes for all models
createCrudRoutes(app, 'Organization', Organization);
createCrudRoutes(app, 'Vendor', Vendor);
createCrudRoutes(app, 'Location', Location);
createCrudRoutes(app, 'SubAdmin', SubAdmin);
createCrudRoutes(app, 'Ticket', Ticket);
createCrudRoutes(app, 'Technician', Technician);
createCrudRoutes(app, 'User', User);

// Special direct endpoint for organization creation
app.post('/api/create-organization', async (req, res) => {
  try {
    console.log('Received organization creation request:', req.body);
    
    // Add id if not provided
    if (!req.body.id) {
      req.body.id = require('uuid').v4();
    }
    
    // Ensure required fields
    const orgData = {
      ...req.body,
      status: req.body.status || 'active',
      createdAt: req.body.createdAt || new Date(),
      updatedAt: req.body.updatedAt || new Date(),
      subAdmins: req.body.subAdmins || []
    };
    
    console.log('Creating organization with data:', orgData);
    
    const newOrg = new Organization(orgData);
    const savedOrg = await newOrg.save();
    
    console.log('Organization created successfully:', savedOrg);
    res.status(201).json(savedOrg);
  } catch (error) {
    console.error('Error creating organization:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add specific custom routes as needed

// Get vendors by organization ID (handles both orgIds and orgContextIds)
app.get('/vendors/organization/:orgId', async (req, res) => {
  try {
    const orgId = req.params.orgId;
    const vendors = await Vendor.find({
      $or: [
        { orgIds: orgId },
        { orgContextIds: orgId }
      ]
    });
    handleResponse(res, vendors);
  } catch (error) {
    handleError(res, error);
  }
});

// Get vendors by service
app.get('/vendors/service/:service', async (req, res) => {
  try {
    const service = req.params.service;
    const vendors = await Vendor.find({
      $or: [
        { services: service },
        { specialties: { $regex: service, $options: 'i' } }
      ]
    });
    handleResponse(res, vendors);
  } catch (error) {
    handleError(res, error);
  }
});

// Get vendors by tier
app.get('/vendors/tier/:tier', async (req, res) => {
  try {
    const vendors = await Vendor.find({ tier: parseInt(req.params.tier) });
    handleResponse(res, vendors);
  } catch (error) {
    handleError(res, error);
  }
});

// Filter tickets by organization ID
app.get('/tickets/organization/:orgId', async (req, res) => {
  try {
    // Get all locations for this organization
    const locations = await Location.find({
      $or: [
        { organizationId: req.params.orgId },
        { orgId: req.params.orgId }
      ]
    });
    const locationIds = locations.map(loc => loc.id);
    
    // Find tickets for these locations
    const tickets = await Ticket.find({ locationId: { $in: locationIds } });
    
    handleResponse(res, tickets);
  } catch (error) {
    handleError(res, error);
  }
});

// Catch-all route handler for React router
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log(`API available at: http://localhost:${port}/`);
  console.log(`Frontend available at: http://localhost:${port}/`);
  console.log(`Using MongoDB: mongodb://localhost:27017/maintenance_web`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  process.exit(1);
});
