import React, { createContext, useState, useContext, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

// Create context
const DataContext = createContext();

// Always use MongoDB API directly
const isLocalStorageDisabled = true;
console.log('localStorage disabled:', isLocalStorageDisabled);

// Base URL for backend API
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3004';

// System configuration
const systemConfig = {
  // Time in milliseconds before a ticket escalates from Tier 1A to Tier 1B (24 hours)
  tier1AToTier1BEscalationTime: 24 * 60 * 60 * 1000,
  
  // Business hours for notifications (7am-7pm EST)
  businessHoursStart: 7, // 7am EST
  businessHoursEnd: 19,   // 7pm EST
  
  // Notification interval in hours
  notificationInterval: 2
};

// Initial data for all entities
const initialData = {
  organizations: [],
  vendors: [],
  subAdmins: [],
  // List of all possible permissions
  availablePermissions: [
    { id: 'subadmin.placeTicket', description: 'Create a new maintenance ticket: fill in location, issue type, description, upload media, and submit it.' },
    { id: 'subadmin.acceptTicket', description: 'Pick up ("accept") an unassigned ticket at Tier 1: you see New tickets and can assign them to vendors.' },
    { id: 'subadmin.tier2AcceptTicket', description: 'Accept or reassign tickets that have escalated past Tier 1 (i.e. Tier 2 queue).' },
    { id: 'subadmin.tier3AcceptTicket', description: 'Accept or reassign tickets that have escalated past Tier 2 (i.e. Tier 3 queue).' },
    { id: 'subadmin.addVendor', description: 'Add a new vendor record to the org: enter name, email, phone, password, and link them to one/multiple orgs.' },
    { id: 'subadmin.addIssueType', description: 'Extend the "Type of Issue" lookup: add new categories like "Elevator" or "Electrical."' },
    { id: 'subadmin.acceptInvoice', description: 'Review and approve a vendor-generated invoice before it goes to accounts payable.' },
    { id: 'subadmin.addLocation', description: 'Create new locations (stores/sites) under the org: set name, address, contact info.' },
    { id: 'subadmin.assignLocation', description: 'Assign users (managers or sub-admins) to one or more locations so they can place/see tickets there.' },
    { id: 'subadmin.verifyJobCompleted', description: 'After a tech marks "Completed," verify the work order and close out the ticket.' },
    { id: 'subadmin.viewTickets', description: 'View tickets in the system.' },
    { id: 'subadmin.viewReports', description: 'Access and view reports.' },
    { id: 'subadmin.manageVendors', description: 'Manage vendor tiers and status, but not create them.' }
  ],
  securityGroups: [
    { 
      id: 'sg1', 
      name: 'Manager', 
      description: 'Full access to all features',
      permissions: [
        'subadmin.placeTicket',
        'subadmin.acceptTicket', 
        'subadmin.tier2AcceptTicket',
        'subadmin.tier3AcceptTicket',
        'subadmin.addIssueType',
        'subadmin.acceptInvoice',
        'subadmin.addLocation',
        'subadmin.assignLocation',
        'subadmin.verifyJobCompleted',
        'subadmin.viewTickets',
        'subadmin.viewReports',
        'subadmin.manageVendors'
      ]
    },
    { 
      id: 'sg2', 
      name: 'Tier 1 Support', 
      description: 'Can create and manage basic tickets',
      permissions: [
        'subadmin.placeTicket',
        'subadmin.acceptTicket',
        'subadmin.viewTickets'
      ]
    },
    { 
      id: 'sg3', 
      name: 'Tier 2 Support', 
      description: 'Can handle escalated tickets',
      permissions: [
        'subadmin.placeTicket',
        'subadmin.acceptTicket',
        'subadmin.tier2AcceptTicket',
        'subadmin.viewTickets'
      ]
    },
    { 
      id: 'sg4', 
      name: 'Tier 3 Support', 
      description: 'Can handle complex ticket issues',
      permissions: [
        'subadmin.placeTicket',
        'subadmin.acceptTicket',
        'subadmin.tier2AcceptTicket',
        'subadmin.tier3AcceptTicket',
        'subadmin.viewTickets'
      ]
    },
    { 
      id: 'sg5', 
      name: 'Location Manager', 
      description: 'Can manage locations and related tickets',
      permissions: [
        'subadmin.placeTicket',
        'subadmin.addLocation',
        'subadmin.assignLocation',
        'subadmin.viewTickets'
      ]
    },
    { 
      id: 'sg6', 
      name: 'Invoice Approver', 
      description: 'Specializes in invoice processing',
      permissions: [
        'subadmin.viewTickets',
        'subadmin.acceptInvoice'
      ]
    },
  ],
  locations: [],
  tickets: [],
  technicians: [],
  users: [
    {
      id: uuidv4(),
      email: 'root@mail.com',
      phone: '123-456-7890',
      password: 'admin', // plaintext for MVP
      role: 'root',
      orgContextIds: [],
      securityGroupIds: []
    }
  ]
};

// Status colors
const STATUS_COLORS = {
  'New': 'error',
  'Assigned': 'warning',
  'In Progress': 'info',
  'Paused': 'default',
  'Completed': 'success',
  'Verified': 'secondary',
  'Rejected': 'error',
  'More Info Needed': 'info'
};

const TICKET_WORKFLOW = [
  { key: 'created', label: 'Ticket Placed', description: 'Maintenance request submitted', status: 'New' },
  { key: 'pending_approval', label: 'Pending Approval', description: 'Waiting for approval from admin', status: 'New' },
  { key: 'assigned', label: 'Vendor Assigned', description: 'Ticket assigned to vendor', status: 'Assigned' },
  { key: 'waiting_vendor_response', label: 'Awaiting Vendor Response', description: 'Waiting for vendor to accept, reject, or request more info', status: 'Assigned' },
  { key: 'vendor_accepted', label: 'Vendor Accepted', description: 'Vendor accepted the ticket', status: 'Assigned' },
  { key: 'vendor_rejected', label: 'Vendor Rejected', description: 'Vendor rejected the ticket', status: 'Rejected' },
  { key: 'more_info_requested', label: 'More Info Requested', description: 'Vendor requested more information', status: 'More Info Needed' },
  { key: 'work_order', label: 'Work Order Created', description: 'Vendor created work order', status: 'Assigned' },
  { key: 'in_progress', label: 'Work In Progress', description: 'Vendor is working on the issue', status: 'In Progress' },
  { key: 'invoice_uploaded', label: 'Invoice Uploaded', description: 'Work completed and invoice uploaded', status: 'Completed' },
  { key: 'awaiting_approval', label: 'Awaiting Approval', description: 'Waiting for final approval', status: 'Completed' },
  { key: 'completed', label: 'Order Complete', description: 'All work verified and completed', status: 'Verified' }
];

// Data provider component
export const DataProvider = ({ children }) => {
  // Data state
  const [data, setData] = useState(initialData);
  
  // MongoDB API access functions
  const fetchFromMongoDB = async (endpoint) => {
    try {
      // Use direct server URL with port 3004 where MongoDB server is running
      const response = await axios.get(`${API_URL}/${endpoint}`);
      console.log(`Fetched data from MongoDB (${endpoint}):`, response.data);
      return response.data;
    } catch (error) {
      console.error(`Error fetching from MongoDB (${endpoint}):`, error);
      return null;
    }
  };
  
  const fetchOrganizationsFromMongoDB = async () => {
    const result = await fetchFromMongoDB('organizations');
    return result || [];
  };
  
  const fetchVendorsFromMongoDB = async () => {
    const result = await fetchFromMongoDB('vendors');
    return result || [];
  };
  
  const fetchSubAdminsFromMongoDB = async (orgId = null) => {
    let endpoint = 'subadmins';
  
    // If organization ID is provided, filter by it
    if (orgId) {
      endpoint = `subadmins/organization/${orgId}`;
    }
  
    const result = await fetchFromMongoDB(endpoint);
    return result || [];
  };
  
  const fetchLocationsFromMongoDB = async () => {
    const result = await fetchFromMongoDB('locations');
    return result || [];
  };
  
  const fetchTicketsFromMongoDB = async () => {
    const result = await fetchFromMongoDB('tickets');
    return result || [];
  };
  
  const loadAllDataFromMongoDB = async () => {
    try {
      const [organizations, vendors, subAdmins, locations, tickets] = await Promise.all([
        fetchOrganizationsFromMongoDB(),
        fetchVendorsFromMongoDB(),
        fetchSubAdminsFromMongoDB(),
        fetchLocationsFromMongoDB(),
        fetchTicketsFromMongoDB()
      ]);
      
      setData(prevData => ({
        ...prevData,
        organizations,
        vendors,
        subAdmins,
        locations,
        tickets
      }));
      
      console.log('Successfully loaded all data from MongoDB');
    } catch (error) {
      console.error('Error loading data from MongoDB:', error);
    }
  };
  
  useEffect(() => {
    // Always load data directly from MongoDB API
    console.log('Loading data directly from MongoDB API...');
    loadAllDataFromMongoDB();
  }, []);
  
  // Validation helpers
  const isEmailUnique = (email, excludeId = null) => {
    // Check across all user types
    const allUsers = [
      ...(Array.isArray(data.subAdmins) ? data.subAdmins : []),
      ...(Array.isArray(data.vendors) ? data.vendors : []),
      ...(Array.isArray(data.technicians) ? data.technicians : []),
      ...(Array.isArray(data.users) ? data.users : [])
    ];
    return !allUsers.some(user => user.email === email && user.id !== excludeId);
  };
  
  const isPhoneUnique = (phone, excludeId = null) => {
    // Check across all user types
    const allUsers = [
      ...(Array.isArray(data.subAdmins) ? data.subAdmins : []),
      ...(Array.isArray(data.vendors) ? data.vendors : []),
      ...(Array.isArray(data.technicians) ? data.technicians : []),
      ...(Array.isArray(data.users) ? data.users : [])
    ];
    return !allUsers.some(user => user.phone === phone && user.id !== excludeId);
  };
  
  const isPasswordStrong = (password) => {
    // Simplified for MVP
    return password && password.length >= 4;
  };
  
  // Generic CRUD operations
  const addItem = async (collection, item) => {
    if (!data[collection]) {
      console.error(`Collection ${collection} does not exist`);
      return null;
    }
    
    const newItem = { ...item, id: item.id || uuidv4() };
    
    try {
      // Always save directly to MongoDB
      const endpoint = collection.toLowerCase();
      const response = await axios.post(`${API_URL}/${endpoint.endsWith('s') ? endpoint : endpoint + 's'}`, newItem);
      if (response.data) {
        // Update local state with the newly created item from MongoDB
        setData({ ...data, [collection]: [...data[collection], response.data] });
        return response.data;
      }
    } catch (error) {
      console.error(`Error adding item to MongoDB (${collection}):`, error);
    }
    
    // Fallback behavior only in case of API error
    setData({ ...data, [collection]: [...data[collection], newItem] });
    return newItem;
  };
  
  const updateItem = async (collection, id, updatedItem) => {
    if (!data[collection]) {
      console.error(`Collection ${collection} does not exist`);
      return false;
    }
    
    try {
      // Always update directly in MongoDB
      const endpoint = collection.toLowerCase();
      const response = await axios.put(`${API_URL}/${endpoint.endsWith('s') ? endpoint : endpoint + 's'}/${id}`, updatedItem);
      if (response.data) {
        // Find and update the item in the local state
        const index = data[collection].findIndex(item => item.id === id);
        if (index !== -1) {
          const updatedCollection = [...data[collection]];
          updatedCollection[index] = response.data;
          setData({ ...data, [collection]: updatedCollection });
          return true;
        }
      }
    } catch (error) {
      console.error(`Error updating item in MongoDB (${collection}):`, error);
    }
    
    // Fallback behavior only in case of API error
    const updatedCollection = data[collection].map(item => 
      item.id === id ? { ...item, ...updatedItem } : item
    );
    setData({ ...data, [collection]: updatedCollection });
    return true;
  };
  
  const deleteItem = async (collection, id) => {
    if (!data[collection]) {
      console.error(`Collection ${collection} does not exist`);
      return false;
    }
    
    try {
      // Always delete directly from MongoDB
      const endpoint = collection.toLowerCase();
      await axios.delete(`${API_URL}/${endpoint.endsWith('s') ? endpoint : endpoint + 's'}/${id}`);
      
      // Remove from local state
      const updatedCollection = data[collection].filter(item => item.id !== id);
      setData({ ...data, [collection]: updatedCollection });
      return true;
    } catch (error) {
      console.error(`Error deleting item from MongoDB (${collection}):`, error);
      
      // Fallback behavior only in case of API error
      const updatedCollection = data[collection].filter(item => item.id !== id);
      setData({ ...data, [collection]: updatedCollection });
    }
    
    return true;
  };
  
  const getItem = (collection, id) => {
    if (!id) return null;
    const items = Array.isArray(data[collection]) ? data[collection] : [];
    
    // Standard lookup by exact ID match - this is the primary way to find items
    const exactMatch = items.find(item => item.id === id);
    if (exactMatch) return exactMatch;
    
    // Only for vendors, do a case-insensitive ID match if exact match fails
    // But DO NOT attempt to match by name - this was causing confusion
    if (collection === 'vendors') {
      const caseInsensitiveMatch = items.find(item => 
        item.id && typeof item.id === 'string' && item.id.toLowerCase() === id.toLowerCase()
      );
      if (caseInsensitiveMatch) return caseInsensitiveMatch;
      
      console.log(`Vendor lookup failed for ID: ${id}. Available vendors:`, 
        items.map(v => ({id: v.id, name: v.name}))
      );
    }
    
    return null;
  };
  
  const getItems = (collection, filterFn = null) => {
    const items = Array.isArray(data[collection]) ? data[collection] : [];
    return filterFn ? items.filter(filterFn) : items;
  };
  
  // Organization management
  const addOrganization = (org) => {
    // Ensure the organization has an empty subAdmins array
    const newOrg = {
      ...org,
      subAdmins: org.subAdmins || []
    };
    return addItem('organizations', newOrg);
  };
  
  const updateOrganization = (id, org) => {
    updateItem('organizations', id, org);
  };
  
  const deleteOrganization = (id) => {
    // Also delete related entities
    const relatedSubAdmins = getSubAdmins(id);
    relatedSubAdmins.forEach(admin => deleteSubAdmin(admin.id));
    
    const relatedLocations = getLocations(id);
    relatedLocations.forEach(location => deleteLocation(location.id));
    
    deleteItem('organizations', id);
  };
  
  const getOrganization = id => getItem('organizations', id);
  
  const getOrganizations = () => getItems('organizations');
  
  // User management
  const addUser = (userData) => {
    return addItem('users', userData);
  };
  
  const updateUser = (id, userData) => {
    updateItem('users', id, userData);
  };
  
  const getUsers = (role = null) => {
    return role 
      ? getItems('users', user => user.role === role)
      : getItems('users');
  };
  
  const getUserByEmail = (email) => {
    return data.users.find(user => user.email === email);
  };
  
  // Vendor management
  const addVendor = (vendor) => {
    // Validate email uniqueness
    if (!isEmailUnique(vendor.email)) {
      throw new Error('Email is already in use');
    }
    
    // Validate phone uniqueness
    if (!isPhoneUnique(vendor.phone)) {
      throw new Error('Phone number is already in use');
    }
    
    // Validate password strength
    if (!isPasswordStrong(vendor.password)) {
      throw new Error('Password does not meet strength requirements');
    }
    
    // Validate organization existence
    if (!vendor.orgIds || !vendor.orgIds.length) {
      throw new Error('Vendor must be linked to at least one organization');
    }
    
    for (const orgId of vendor.orgIds) {
      const org = getOrganization(orgId);
      if (!org) {
        throw new Error(`Organization with ID ${orgId} does not exist`);
      }
    }
    
    // Create a more user-friendly vendor ID using vendor name and a short random string
    const vendorInitials = vendor.name.split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase();
    const randomString = Math.random().toString(36).substring(2, 6);
    
    const newVendor = {
      id: `V-${vendorInitials}-${randomString}`,
      name: vendor.name,
      email: vendor.email,
      phone: vendor.phone,
      status: 'active',
      // Tier is no longer set during vendor creation
      // It will be set per organization context later
      orgIds: vendor.orgIds
    };
    
    // Add user record
    addItem('users', {
      id: uuidv4(),
      email: vendor.email,
      phone: vendor.phone,
      password: vendor.password,
      role: 'vendor',
      orgContextIds: vendor.orgIds,
      vendorId: newVendor.id
    });
    
    return addItem('vendors', newVendor);
  };
  
  const updateVendor = (id, vendor) => {
    const existingVendor = getItem('vendors', id);
    if (!existingVendor) throw new Error('Vendor not found');
    
    // Find associated user
    const user = data.users.find(u => u.vendorId === id);
    
    // Check email uniqueness if changed
    if (vendor.email && vendor.email !== existingVendor.email && !isEmailUnique(vendor.email, id)) {
      throw new Error('Email is already in use');
    }
    
    // Check phone uniqueness if changed
    if (vendor.phone && vendor.phone !== existingVendor.phone && !isPhoneUnique(vendor.phone, id)) {
      throw new Error('Phone number is already in use');
    }
    
    // Update user record if it exists
    if (user) {
      updateItem('users', user.id, {
        ...user,
        email: vendor.email || existingVendor.email,
        phone: vendor.phone || existingVendor.phone,
        password: vendor.password || user.password,
        orgContextIds: vendor.orgIds || existingVendor.orgIds
      });
    }
    
    updateItem('vendors', id, vendor);
  };
  
  const deleteVendor = (id) => {
    const vendor = getItem('vendors', id);
    if (vendor) {
      // Find and delete associated user
      const user = data.users.find(u => u.vendorId === id);
      if (user) {
        deleteItem('users', user.id);
      }
      
      // Delete associated technicians
      const techs = getTechnicians(id);
      techs.forEach(tech => deleteTechnician(tech.id));
    }
    
    deleteItem('vendors', id);
  };
  
  const getVendor = id => getItem('vendors', id);
  
  const getVendors = (orgId = null) => {
    if (!orgId) {
      return getItems('vendors');
    }
    
    // Safely filter vendors by checking if orgIds exists and is an array
    return getItems('vendors', vendor => 
      vendor.orgIds && Array.isArray(vendor.orgIds) && vendor.orgIds.includes(orgId)
    );
  };
  
  // SubAdmin management with direct permissions
  const addSubAdmin = (organizationId, subadminData) => {
    const { name, email, phone, password, permissions } = subadminData;

    // Validate email uniqueness
    if (!isEmailUnique(email)) {
      throw new Error('Email is already in use');
    }

    // Validate phone uniqueness
    if (!isPhoneUnique(phone)) {
      throw new Error('Phone number is already in use');
    }

    // Validate password strength
    if (!isPasswordStrong(password)) {
      throw new Error('Password does not meet strength requirements');
    }

    // Validate permissions
    if (!permissions || !Array.isArray(permissions) || permissions.length === 0) {
      throw new Error('At least one permission must be selected');
    }

    const newSubAdmin = {
      id: 'sa' + Date.now(),
      name,
      email,
      phone,
      password,
      role: 'subadmin',
      organizationId,
      permissions,
      assignedLocationIds: [] // Array of assigned location IDs
    };

    // Add user record
    addItem('users', {
      id: uuidv4(),
      email: newSubAdmin.email,
      phone: newSubAdmin.phone,
      password: newSubAdmin.password, // For MVP storing plaintext
      role: 'subadmin',
      orgContextIds: [organizationId],
      permissions: permissions
    });

    // Add to subAdmins collection
    const addedSubAdmin = addItem('subAdmins', newSubAdmin);

    // Update organization to include this sub-admin
    const organization = getItem('organizations', organizationId);
    if (organization) {
      const updatedOrg = {
        ...organization,
        subAdmins: organization.subAdmins ? [...organization.subAdmins, addedSubAdmin] : [addedSubAdmin]
      };
      updateItem('organizations', organizationId, updatedOrg);
    }

    return addedSubAdmin;
  };

  const updateSubAdmin = (id, subAdmin) => {
    const existingSubAdmin = getItem('subAdmins', id);
    if (!existingSubAdmin) throw new Error('Sub-admin not found');

    
    // Find associated user
    const user = data.users.find(u => u.email === existingSubAdmin.email);
    
    // Check email uniqueness if changed
    if (subAdmin.email && subAdmin.email !== existingSubAdmin.email && !isEmailUnique(subAdmin.email, id)) {
      throw new Error('Email is already in use');
    }
    
    // Check phone uniqueness if changed
    if (subAdmin.phone && subAdmin.phone !== existingSubAdmin.phone && !isPhoneUnique(subAdmin.phone, id)) {
      throw new Error('Phone number is already in use');
    }
    
    // Update user record if it exists
    if (user) {
      updateItem('users', user.id, {
        ...user,
        email: subAdmin.email || existingSubAdmin.email,
        phone: subAdmin.phone || existingSubAdmin.phone,
        password: subAdmin.password || user.password,
        orgContextIds: [subAdmin.organizationId || existingSubAdmin.organizationId],
        permissions: subAdmin.permissions || existingSubAdmin.permissions || []
      });
    }
    
    // Update the sub-admin record
    updateItem('subAdmins', id, subAdmin);
  };
  
  const deleteSubAdmin = (id) => {
    const subAdmin = getItem('subAdmins', id);
    if (subAdmin) {
      // Find and delete associated user
      const user = data.users.find(u => u.email === subAdmin.email);
      if (user) {
        deleteItem('users', user.id);
      }
      deleteItem('subAdmins', id);
    }
  };
  
  const getSubAdmin = id => getItem('subAdmins', id);
  
  const getSubAdmins = (orgId = null) => 
    orgId
      ? getItems('subAdmins', admin => admin.organizationId === orgId)
      : getItems('subAdmins');
  
  // Security Group management
  const addSecurityGroup = group => addItem('securityGroups', group);
  
  const updateSecurityGroup = (id, group) => updateItem('securityGroups', id, group);
  
  const deleteSecurityGroup = (id) => {
    // Check if any sub-admins are using this security group
    const usedBySubAdmins = data.subAdmins.some(sa => sa.securityGroupId === id);
    if (usedBySubAdmins) {
      throw new Error('Cannot delete security group in use by sub-admins');
    }
    deleteItem('securityGroups', id);
  };
  
  const getSecurityGroup = id => getItem('securityGroups', id);
  
  const getSecurityGroups = () => getItems('securityGroups');
  
  // Location management
  const addLocation = location => addItem('locations', location);
  
  const updateLocation = (id, location) => updateItem('locations', id, location);
  
  const deleteLocation = (id) => {
    // Also delete tickets associated with this location
    const relatedTickets = getTickets(id);
    relatedTickets.forEach(ticket => deleteTicket(ticket.id));
    
    deleteItem('locations', id);
  };
  
  const getLocation = id => getItem('locations', id);
  
  const getLocations = (orgId = null) => 
    orgId
      ? getItems('locations', location => location.orgId === orgId)
      : getItems('locations');
      
  // Ticket management
  const addTicket = (ticketData) => {
    const { locationId, issueType, description, placedBy, mediaUrls = [], notes = '', priority = 'medium' } = ticketData;
    
    const ticketNo = `TICK-${Math.floor(Math.random() * 10000)}`;
    
    const newTicket = {
      id: 'tick' + Date.now(),
      ticketNo,
      locationId,
      issueType,
      description,
      placedBy,
      dateTime: new Date().toISOString(),
      status: 'New',
      vendorId: null, // will be set when assigned
      notes: notes ? [{text: notes, date: new Date().toISOString(), by: placedBy}] : [],
      mediaUrls,
      priority,
      // Workflow tracking fields
      adminApproved: false,
      workOrderCreated: false,
      invoiceUploaded: false,
      finalApprovalRequested: false,
      completionDate: null,
      verificationDate: null,
      history: [
        {
          action: 'created',
          timestamp: new Date().toISOString(),
          by: placedBy
        }
      ]
    };
    
    return addItem('tickets', newTicket);
  };
  
  const updateTicket = (id, ticket) => updateItem('tickets', id, ticket);
  
  const deleteTicket = (id) => deleteItem('tickets', id);
  
  const getTicket = id => getItem('tickets', id);
  
  const getTickets = (locationId = null) => 
    locationId
      ? getItems('tickets', ticket => ticket.locationId === locationId)
      : getItems('tickets');
  
  // Workflow functions for tickets
  
  // Approve a ticket (admin approval)
  const approveTicket = (id, note = '') => {
    const ticket = getTicket(id);
    if (!ticket) throw new Error('Ticket not found');
    
    const updatedNotes = [...(ticket.notes || [])];
    if (note) {
      updatedNotes.push({
        text: note,
        date: new Date().toISOString(),
        by: 'Admin'
      });
    }
    
    updateTicket(id, {
      ...ticket,
      adminApproved: true,
      notes: updatedNotes,
      history: [
        ...(ticket.history || []),
        {
          action: 'approved',
          timestamp: new Date().toISOString(),
          note
        }
      ]
    });
    
    return true;
  };

// Assign a ticket to a vendor
// Only checks that the vendor is part of the organization, not assigned to specific locations
const assignTicket = (id, vendorId) => {
  const ticket = getTicket(id);
  if (!ticket) return false;
  
  // Get the vendor
  const vendor = getItem('vendors', vendorId);
  if (!vendor) return false;
  
  // Get the location to find the organization
  const location = getItem('locations', ticket.locationId);
  if (!location) return false;
  
  // Check if vendor belongs to the organization
  const belongsToOrg = vendor.orgIds && Array.isArray(vendor.orgIds) && vendor.orgIds.includes(location.orgId);
  if (!belongsToOrg) {
    console.error('Vendor does not belong to the organization of this ticket');
    return false;
  }
  
  // Update ticket with vendor assignment
  updateTicket(id, {
    ...ticket,
    vendorId,
    status: 'Assigned',
    currentStep: 'waiting_vendor_response',
    workOrders: [
      ...(ticket.workOrders || []),
      {
        type: 'assigned',
        timestamp: new Date().toISOString(),
        note: `Ticket assigned to vendor`,
        vendorId
      }
    ],
    updatedAt: new Date().toISOString()
  });
  
  return true;
};
  
  // Handle vendor accepting a ticket
  const acceptTicketByVendor = (id, note = '') => {
    // Get ticket
    const ticket = getTicket(id);
    if (!ticket) return false;
    
    // Update ticket with vendor acceptance
    updateTicket(id, {
      ...ticket,
      status: 'In Progress',
      currentStep: 'vendor_accepted',
      workOrders: [
        ...(ticket.workOrders || []),
        {
          type: 'vendor_accepted',
          timestamp: new Date().toISOString(),
          note: note || 'Vendor accepted the ticket'
        }
      ],
      updatedAt: new Date().toISOString()
    });
    
    return true;
  };
  
  // Handle vendor rejecting a ticket
  const rejectTicketByVendor = (id, reason) => {
    // Get ticket
    const ticket = getTicket(id);
    if (!ticket) return false;
    
    // Update ticket with vendor rejection
    updateTicket(id, {
      ...ticket,
      status: 'Rejected',
      currentStep: 'vendor_rejected',
      workOrders: [
        ...(ticket.workOrders || []),
        {
          type: 'vendor_rejected',
          timestamp: new Date().toISOString(),
          note: `Vendor rejected the ticket: ${reason}`
        }
      ],
      updatedAt: new Date().toISOString()
    });
    
    return true;
  };
  
  // Handle vendor requesting more information
  const requestMoreInfoByVendor = (id, infoNeeded) => {
    // Get ticket
    const ticket = getTicket(id);
    if (!ticket) return false;
    
    // Update ticket with info request
    updateTicket(id, {
      ...ticket,
      status: 'More Info Needed',
      currentStep: 'more_info_requested',
      workOrders: [
        ...(ticket.workOrders || []),
        {
          type: 'more_info_requested',
          timestamp: new Date().toISOString(),
          note: `Vendor requested more information: ${infoNeeded}`
        }
      ],
      updatedAt: new Date().toISOString()
    });
    
    return true;
  };
  
  // Handle providing more information to a ticket
  const provideMoreInfo = (id, additionalInfo) => {
    // Get ticket
    const ticket = getTicket(id);
    if (!ticket) return false;
    
    // Update ticket with additional info
    updateTicket(id, {
      ...ticket,
      status: 'Assigned',
      currentStep: 'waiting_vendor_response',
      workOrders: [
        ...(ticket.workOrders || []),
        {
          type: 'more_info_provided',
          timestamp: new Date().toISOString(),
          note: `Additional information provided: ${additionalInfo}`
        }
      ],
      updatedAt: new Date().toISOString()
    });
    
    return true;
  };
  
  // Create work order
  const createWorkOrder = (id, workOrderDetails = {}) => {
    const ticket = getTicket(id);
    if (!ticket) throw new Error('Ticket not found');
    
    updateTicket(id, {
      ...ticket,
      workOrderCreated: true,
      workOrderDetails,
      history: [
        ...(ticket.history || []),
        {
          action: 'work_order_created',
          timestamp: new Date().toISOString(),
          details: workOrderDetails
        }
      ]
    });
  };
  
  const startWork = (id) => {
    const ticket = getTicket(id);
    if (!ticket) throw new Error('Ticket not found');
    
    updateTicket(id, {
      ...ticket,
      status: 'In Progress',
      startedAt: new Date().toISOString(),
      history: [
        ...(ticket.history || []),
        {
          action: 'started',
          timestamp: new Date().toISOString()
        }
      ]
    });
  };
  
  const pauseWork = (id, reason) => {
    const ticket = getTicket(id);
    if (!ticket) throw new Error('Ticket not found');
    
    updateTicket(id, {
      ...ticket,
      status: 'Paused',
      pausedAt: new Date().toISOString(),
      pauseReason: reason,
      history: [
        ...(ticket.history || []),
        {
          action: 'paused',
          timestamp: new Date().toISOString(),
          reason
        }
      ]
    });
  };
  
  const uploadInvoice = (id, invoiceDetails) => {
    const ticket = getTicket(id);
    if (!ticket) throw new Error('Ticket not found');
    
    updateTicket(id, {
      ...ticket,
      invoiceUploaded: true,
      invoiceDetails,
      history: [
        ...(ticket.history || []),
        {
          action: 'invoice_uploaded',
          timestamp: new Date().toISOString(),
          invoiceDetails
        }
      ]
    });
  };
  
  const requestFinalApproval = (id) => {
    const ticket = getTicket(id);
    if (!ticket) throw new Error('Ticket not found');
    
    updateTicket(id, {
      ...ticket,
      finalApprovalRequested: true,
      history: [
        ...(ticket.history || []),
        {
          action: 'final_approval_requested',
          timestamp: new Date().toISOString()
        }
      ]
    });
  };
  
  const completeWork = (id, notes) => {
    const ticket = getTicket(id);
    if (!ticket) throw new Error('Ticket not found');
    
    const completionDate = new Date().toISOString();
    
    updateTicket(id, {
      ...ticket,
      status: 'Completed',
      completedAt: completionDate,
      completionDate: completionDate,
      completionNotes: notes,
      history: [
        ...(ticket.history || []),
        {
          action: 'completed',
          timestamp: completionDate,
          notes
        }
      ]
    });
  };
  
  const verifyCompletion = (id) => {
    const ticket = getTicket(id);
    if (!ticket) throw new Error('Ticket not found');
    
    const verificationDate = new Date().toISOString();
    
    updateTicket(id, {
      ...ticket,
      status: 'Verified',
      verifiedAt: verificationDate,
      verificationDate: verificationDate,
      history: [
        ...(ticket.history || []),
        {
          action: 'verified',
          timestamp: verificationDate
        }
      ]
    });
  };
  
  // Technician management
  const addTechnician = (technician) => {
    // Validate vendor exists
    if (!getVendor(technician.vendorId)) {
      throw new Error('Vendor not found');
    }
    
    // Validate email uniqueness
    if (!isEmailUnique(technician.email)) {
      throw new Error('Email is already in use');
    }
    
    // Validate phone uniqueness
    if (!isPhoneUnique(technician.phone)) {
      throw new Error('Phone number is already in use');
    }
    
    // Validate password strength
    if (!isPasswordStrong(technician.password)) {
      throw new Error('Password does not meet strength requirements');
    }
    
    // Add user record
    const userData = {
      id: uuidv4(),
      email: technician.email,
      phone: technician.phone,
      password: technician.password, // For MVP storing plaintext
      role: 'technician',
      orgContextIds: technician.orgContextIds || [],
      securityGroupIds: []
    };
    
    addItem('users', userData);
    
    // Add the technician record
    return addItem('technicians', {
      id: 't' + Date.now(),
      name: technician.name,
      email: technician.email,
      phone: technician.phone,
      vendorId: technician.vendorId,
      orgContextIds: technician.orgContextIds || []
    });
  };
  
  const updateTechnician = (id, technician) => {
    const existingTech = getItem('technicians', id);
    if (!existingTech) throw new Error('Technician not found');
    
    // Find associated user
    const user = data.users.find(u => u.email === existingTech.email);
    
    // Check email uniqueness if changed
    if (technician.email && technician.email !== existingTech.email && !isEmailUnique(technician.email, id)) {
      throw new Error('Email is already in use');
    }
    
    // Check phone uniqueness if changed
    if (technician.phone && technician.phone !== existingTech.phone && !isPhoneUnique(technician.phone, id)) {
      throw new Error('Phone number is already in use');
    }
    
    // Update user record if it exists
    if (user) {
      updateItem('users', user.id, {
        ...user,
        email: technician.email || existingTech.email,
        phone: technician.phone || existingTech.phone,
        password: technician.password || user.password,
        orgContextIds: technician.orgContextIds || existingTech.orgContextIds || []
      });
    }
    
    // Update the technician record
    updateItem('technicians', id, technician);
  };
  
  const deleteTechnician = (id) => {
    const tech = getItem('technicians', id);
    if (tech) {
      // Find and delete associated user
      const user = data.users.find(u => u.email === tech.email);
      if (user) {
        deleteItem('users', user.id);
      }
    }
    deleteItem('technicians', id);
  };
  
  const getTechnician = id => getItem('technicians', id);
  
  const getTechnicians = (vendorId = null) => 
    vendorId 
      ? getItems('technicians', tech => tech.vendorId === vendorId)
      : getItems('technicians');

  // Sub-admin location access check
  const hasLocationAccess = (subAdminId, locationId) => {
    if (!subAdminId || !locationId) return false;
    
    // Get the sub-admin record
    const subAdmin = getItem('subAdmins', subAdminId);
    if (!subAdmin) return false;
    
    // If no assigned locations, they might be a super-admin with access to all locations
    if (!subAdmin.assignedLocationIds || !Array.isArray(subAdmin.assignedLocationIds) || subAdmin.assignedLocationIds.length === 0) {
      // Check if they have the assignLocation permission (indicating they're an admin with full access)
      return subAdmin.permissions?.includes('subadmin.assignLocation') || false;
    }
    
    // Otherwise, check if the location is in their assigned locations
    return subAdmin.assignedLocationIds.includes(locationId);
  };
  
  // Check if a sub-admin can handle tickets of a specific tier for a location
  const hasTicketTierAccess = (subAdminId, locationId, tier, ticket = null) => {
    if (!subAdminId || !locationId) return false;
    
    // Get the sub-admin record
    const subAdmin = getItem('subAdmins', subAdminId);
    if (!subAdmin) return false;
    
    // First check if they have basic location access
    if (!hasLocationAccess(subAdminId, locationId)) return false;
    
    // Check if they have the basic accept ticket permission
    if (!subAdmin.permissions?.includes('subadmin.acceptTicket')) return false;
    
    // For location-specific tier permissions
    if (subAdmin.locationTierPermissions && subAdmin.locationTierPermissions[locationId]) {
      const locationPermissions = subAdmin.locationTierPermissions[locationId];
      
      // Check if they can accept tickets for this location
      if (!locationPermissions.acceptTicket) return false;
      
      // Simple tier-based access check (1, 2, or 3)
      return locationPermissions.tiers?.includes(tier);
    }
    
    // If no location-specific permissions are set, fall back to the general permissions
    // (this is for backward compatibility)
    if (tier === 2) {
      return subAdmin.permissions?.includes('subadmin.tier2AcceptTicket');
    } else if (tier === 3) {
      return subAdmin.permissions?.includes('subadmin.tier3AcceptTicket');
    }
    
    // For tier 1, the basic acceptTicket permission is sufficient
    return true;
  };
  
  // Get all locations a sub-admin has access to
  const getAccessibleLocations = (subAdminId) => {
    if (!subAdminId) return [];
    
    const subAdmin = getItem('subAdmins', subAdminId);
    if (!subAdmin) return [];
    
    // If they have assignLocation permission or no assigned locations, they can see all locations in their org
    if (subAdmin.permissions?.includes('subadmin.assignLocation') || 
        !subAdmin.assignedLocationIds || 
        !Array.isArray(subAdmin.assignedLocationIds) || 
        subAdmin.assignedLocationIds.length === 0) {
      
      const orgId = subAdmin.organizationId;
      return getItems('locations', loc => loc.orgId === orgId);
    }
    
    // Otherwise, filter locations based on their assigned location IDs
    return getItems('locations', loc => subAdmin.assignedLocationIds.includes(loc.id));
  };

  // Tier escalation has been removed - tiers are now only for access control
  
  // Context value with all operations
  const value = {
    data,
    isLocalStorageDisabled,
    loadAllDataFromMongoDB,
    fetchFromMongoDB,
    
    // Users
    addUser,
    updateUser,
    getUsers,
    getUserByEmail,
    isEmailUnique,
    isPhoneUnique,
    isPasswordStrong,
    
    // Organizations
    addOrganization,
    updateOrganization,
    deleteOrganization,
    getOrganization,
    getOrganizations,
    
    // Vendors
    addVendor,
    updateVendor,
    deleteVendor,
    getVendor,
    getVendors,
    
    // Technicians
    addTechnician,
    updateTechnician,
    deleteTechnician,
    getTechnician,
    getTechnicians,
    
    // SubAdmins
    addSubAdmin,
    updateSubAdmin,
    deleteSubAdmin,
    getSubAdmin,
    getSubAdmins,
    
    // Security Groups
    addSecurityGroup,
    updateSecurityGroup,
    deleteSecurityGroup,
    getSecurityGroup,
    getSecurityGroups,
    
    // Locations
    addLocation,
    updateLocation,
    deleteLocation,
    getLocation,
    getLocations,
    
    // Tickets
    addTicket,
    updateTicket,
    deleteTicket,
    getTicket,
    getTickets,
    
    // Ticket Workflow
    approveTicket,
    assignTicket,
    acceptTicketByVendor,
    rejectTicketByVendor,
    requestMoreInfoByVendor,
    provideMoreInfo,
    createWorkOrder,
    startWork,
    pauseWork,
    uploadInvoice,
    requestFinalApproval,
    completeWork,
    verifyCompletion,
    
    // Location Access Control
    hasLocationAccess,
    hasTicketTierAccess,
    getAccessibleLocations,
    
    // Ticket Escalation
    // shouldEscalateToTier1B removed - tiers are now only for access control
    systemConfig
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

// Custom hook to use data context
export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export default DataContext;
