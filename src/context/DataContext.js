import React, { createContext, useState, useContext, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

// Create context
const DataContext = createContext();

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

// Data provider component
export const DataProvider = ({ children }) => {
  const [data, setData] = useState(() => {
    // Try to load from localStorage if available
    const savedData = localStorage.getItem('maintenanceAppData');
    const baseData = savedData ? JSON.parse(savedData) : initialData;
    
    // Ensure all collections are initialized as arrays
    const ensuredData = {
      ...baseData,
      organizations: Array.isArray(baseData.organizations) ? baseData.organizations : [],
      vendors: Array.isArray(baseData.vendors) ? baseData.vendors : [],
      subAdmins: Array.isArray(baseData.subAdmins) ? baseData.subAdmins : [],
      securityGroups: Array.isArray(baseData.securityGroups) ? baseData.securityGroups : initialData.securityGroups,
      availablePermissions: Array.isArray(baseData.availablePermissions) ? baseData.availablePermissions : initialData.availablePermissions,
      locations: Array.isArray(baseData.locations) ? baseData.locations : [],
      tickets: Array.isArray(baseData.tickets) ? baseData.tickets : [],
      technicians: Array.isArray(baseData.technicians) ? baseData.technicians : [],
      users: Array.isArray(baseData.users) ? baseData.users : initialData.users
    };
    
    return ensuredData;
  });

  // Save to localStorage whenever data changes
  useEffect(() => {
    try {
      localStorage.setItem('maintenanceAppData', JSON.stringify(data));
    } catch (e) {
      console.error('Error saving data to localStorage:', e);
    }
  }, [data]);

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
  const addItem = (collection, item) => {
    const newItem = { ...item, id: item.id || uuidv4() };
    setData(prev => {
      const currentCollection = Array.isArray(prev[collection]) ? prev[collection] : [];
      return {
        ...prev,
        [collection]: [...currentCollection, newItem]
      };
    });
    return newItem;
  };
  
  const updateItem = (collection, id, updatedItem) => {
    setData(prev => {
      const currentCollection = Array.isArray(prev[collection]) ? prev[collection] : [];
      return {
        ...prev,
        [collection]: currentCollection.map(item => 
          item.id === id ? { ...item, ...updatedItem } : item
        )
      };
    });
  };
  
  const deleteItem = (collection, id) => {
    setData(prev => {
      const currentCollection = Array.isArray(prev[collection]) ? prev[collection] : [];
      return {
        ...prev,
        [collection]: currentCollection.filter(item => item.id !== id)
      };
    });
  };
  
  const getItem = (collection, id) => {
    const items = Array.isArray(data[collection]) ? data[collection] : [];
    return items.find(item => item.id === id);
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
    
    const newVendor = {
      id: 'v' + Date.now(),
      name: vendor.name,
      email: vendor.email,
      phone: vendor.phone,
      status: 'active',
      tier: vendor.tier || 1,
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
      permissions
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
      ? getItems('locations', location => location.organizationId === orgId)
      : getItems('locations');
  
  // Ticket management
  const addTicket = ticket => {
    const newTicket = {
      ...ticket,
      status: 'new',
      createdAt: new Date().toISOString(),
      history: [
        {
          action: 'created',
          timestamp: new Date().toISOString(),
          userId: ticket.createdBy
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
  const assignTicket = (id, vendorId) => {
    const ticket = getTicket(id);
    if (!ticket) throw new Error('Ticket not found');
    
    const vendor = getVendor(vendorId);
    if (!vendor) throw new Error('Vendor not found');
    
    updateTicket(id, {
      ...ticket,
      status: 'assigned',
      vendorId,
      assignedAt: new Date().toISOString(),
      history: [
        ...ticket.history,
        {
          action: 'assigned',
          timestamp: new Date().toISOString(),
          vendorId
        }
      ]
    });
  };
  
  const startWork = (id) => {
    const ticket = getTicket(id);
    if (!ticket) throw new Error('Ticket not found');
    
    updateTicket(id, {
      ...ticket,
      status: 'in_progress',
      startedAt: new Date().toISOString(),
      history: [
        ...ticket.history,
        {
          action: 'started',
          timestamp: new Date().toISOString()
        }
      ]
    });
  };
  
  const pauseWork = (id, note) => {
    const ticket = getTicket(id);
    if (!ticket) throw new Error('Ticket not found');
    
    updateTicket(id, {
      ...ticket,
      status: 'paused',
      pausedAt: new Date().toISOString(),
      pauseNote: note,
      history: [
        ...ticket.history,
        {
          action: 'paused',
          timestamp: new Date().toISOString(),
          note
        }
      ]
    });
  };
  
  const completeWork = (id, note) => {
    const ticket = getTicket(id);
    if (!ticket) throw new Error('Ticket not found');
    
    updateTicket(id, {
      ...ticket,
      status: 'completed',
      completedAt: new Date().toISOString(),
      completionNote: note,
      history: [
        ...ticket.history,
        {
          action: 'completed',
          timestamp: new Date().toISOString(),
          note
        }
      ]
    });
  };
  
  const verifyCompletion = (id, verifiedBy) => {
    const ticket = getTicket(id);
    if (!ticket) throw new Error('Ticket not found');
    
    updateTicket(id, {
      ...ticket,
      status: 'verified',
      verifiedAt: new Date().toISOString(),
      verifiedBy,
      history: [
        ...ticket.history,
        {
          action: 'verified',
          timestamp: new Date().toISOString(),
          verifiedBy
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

  // Context value with all operations
  const value = {
    data,
    
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
    assignTicket,
    startWork,
    pauseWork,
    completeWork,
    verifyCompletion
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
