/**
 * Script to seed MongoDB with sample data
 */
require('dotenv').config();
const connectDB = require('./src/db/mongodb');
const { v4: uuidv4 } = require('uuid');

// Import models
const Organization = require('./src/models/Organization');
const Vendor = require('./src/models/Vendor');
const Location = require('./src/models/Location');
const SubAdmin = require('./src/models/SubAdmin');
const Ticket = require('./src/models/Ticket');
const Technician = require('./src/models/Technician');
const User = require('./src/models/User');

// Sample data generator
const generateSampleData = () => {
  // Generate unique IDs
  const orgId1 = uuidv4();
  const orgId2 = uuidv4();
  const vendorId1 = uuidv4();
  const vendorId2 = uuidv4();
  const vendorId3 = uuidv4();
  const locationId1 = uuidv4();
  const locationId2 = uuidv4();
  const locationId3 = uuidv4();
  const technicianId1 = uuidv4();
  const technicianId2 = uuidv4();
  const subAdminId1 = uuidv4();
  const subAdminId2 = uuidv4();
  const userId1 = uuidv4();
  const userId2 = uuidv4();
  
  // Sample organizations
  const organizations = [
    {
      id: orgId1,
      name: "ABC Retail",
      email: "contact@abcretail.com",
      phone: "555-123-4567",
      address: "123 Main St, City, State 12345",
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: orgId2,
      name: "XYZ Corporation",
      email: "info@xyzcorp.com",
      phone: "555-987-6543",
      address: "456 Corporate Way, Metro, State 67890",
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];
  
  // Sample vendors
  const vendors = [
    {
      id: vendorId1,
      name: "Fast Fix Maintenance",
      email: "service@fastfix.com",
      phone: "555-222-3333",
      address: "789 Service Rd, Repair City, State 45678",
      status: "active",
      services: ["HVAC", "Plumbing", "Electrical"],
      specialties: "Emergency repairs",
      tier: 1,
      orgIds: [orgId1, orgId2],
      orgContextIds: [orgId1, orgId2],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: vendorId2,
      name: "Elite Electrical Services",
      email: "info@eliteelectrical.com",
      phone: "555-444-5555",
      address: "321 Power Ave, Circuit City, State 56789",
      status: "active",
      services: ["Electrical", "Lighting", "Security Systems"],
      specialties: "Commercial electrical",
      tier: 2,
      orgIds: [orgId1],
      orgContextIds: [orgId1],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: vendorId3,
      name: "Premier Plumbing",
      email: "service@premierplumbing.com",
      phone: "555-666-7777",
      address: "654 Water Way, Pipe City, State 34567",
      status: "active",
      services: ["Plumbing", "Water Heaters", "Pipe Repairs"],
      specialties: "Commercial plumbing",
      tier: 1,
      orgIds: [orgId2],
      orgContextIds: [orgId2],
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];
  
  // Sample locations
  const locations = [
    {
      id: locationId1,
      name: "ABC Retail - Downtown",
      address: "123 Main St, Downtown, State 12345",
      phone: "555-123-0001",
      email: "downtown@abcretail.com",
      status: "active",
      organizationId: orgId1,
      orgId: orgId1,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: locationId2,
      name: "ABC Retail - Westside",
      address: "456 West Blvd, Westside, State 12346",
      phone: "555-123-0002",
      email: "westside@abcretail.com",
      status: "active",
      organizationId: orgId1,
      orgId: orgId1,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: locationId3,
      name: "XYZ Corp - Headquarters",
      address: "789 Corporate Pkwy, Metro, State 67890",
      phone: "555-987-0001",
      email: "hq@xyzcorp.com",
      status: "active",
      organizationId: orgId2,
      orgId: orgId2,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];
  
  // Sample technicians
  const technicians = [
    {
      id: technicianId1,
      name: "John Smith",
      email: "john@fastfix.com",
      phone: "555-222-1111",
      specialties: ["HVAC", "Electrical"],
      vendorId: vendorId1,
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: technicianId2,
      name: "Sarah Johnson",
      email: "sarah@eliteelectrical.com",
      phone: "555-444-2222",
      specialties: ["Electrical", "Lighting"],
      vendorId: vendorId2,
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];
  
  // Sample subadmins
  const subAdmins = [
    {
      id: subAdminId1,
      name: "Michael Brown",
      email: "michael@abcretail.com",
      phone: "555-123-8888",
      role: "Facility Manager",
      organizationId: orgId1,
      orgId: orgId1,
      locationIds: [locationId1, locationId2],
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: subAdminId2,
      name: "Lisa Wang",
      email: "lisa@xyzcorp.com",
      phone: "555-987-8888",
      role: "Operations Manager",
      organizationId: orgId2,
      orgId: orgId2,
      locationIds: [locationId3],
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];
  
  // Sample users
  const users = [
    {
      id: userId1,
      name: "Admin User",
      email: "admin@maintenance-web.com",
      role: "admin",
      password: "password123", // In a real app, this should be hashed
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: userId2,
      name: "Test User",
      email: "test@maintenance-web.com",
      role: "user",
      password: "password123", // In a real app, this should be hashed
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];
  
  // Sample tickets
  const tickets = [
    {
      id: uuidv4(),
      title: "HVAC not working",
      description: "The air conditioning system is not cooling properly in the main office area.",
      status: "open",
      priority: "high",
      category: "HVAC",
      locationId: locationId1,
      organizationId: orgId1,
      assignedVendorId: vendorId1,
      assignedTechnicianId: technicianId1,
      createdBy: subAdminId1,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: uuidv4(),
      title: "Electrical outlet not working",
      description: "Several outlets in the conference room are not functioning.",
      status: "assigned",
      priority: "medium",
      category: "Electrical",
      locationId: locationId2,
      organizationId: orgId1,
      assignedVendorId: vendorId2,
      assignedTechnicianId: technicianId2,
      createdBy: subAdminId1,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: uuidv4(),
      title: "Leaking sink in kitchen",
      description: "The sink in the staff kitchen area is leaking water onto the floor.",
      status: "pending",
      priority: "medium",
      category: "Plumbing",
      locationId: locationId3,
      organizationId: orgId2,
      assignedVendorId: vendorId3,
      createdBy: subAdminId2,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];
  
  return {
    organizations,
    vendors,
    locations,
    technicians,
    subAdmins,
    users,
    tickets
  };
};

// Function to seed the database
const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    console.log('Connected to MongoDB');
    
    // Generate sample data
    const data = generateSampleData();
    
    // Clear existing collections
    console.log('Clearing existing collections...');
    await Organization.deleteMany({});
    await Vendor.deleteMany({});
    await Location.deleteMany({});
    await SubAdmin.deleteMany({});
    await Ticket.deleteMany({});
    await Technician.deleteMany({});
    await User.deleteMany({});
    
    // Insert sample data
    console.log('Inserting sample data...');
    
    // Insert organizations
    await Organization.insertMany(data.organizations);
    console.log(`✓ Added ${data.organizations.length} organizations`);
    
    // Insert vendors
    await Vendor.insertMany(data.vendors);
    console.log(`✓ Added ${data.vendors.length} vendors`);
    
    // Insert locations
    await Location.insertMany(data.locations);
    console.log(`✓ Added ${data.locations.length} locations`);
    
    // Insert technicians
    await Technician.insertMany(data.technicians);
    console.log(`✓ Added ${data.technicians.length} technicians`);
    
    // Insert subadmins
    await SubAdmin.insertMany(data.subAdmins);
    console.log(`✓ Added ${data.subAdmins.length} subadmins`);
    
    // Insert users
    await User.insertMany(data.users);
    console.log(`✓ Added ${data.users.length} users`);
    
    // Insert tickets
    await Ticket.insertMany(data.tickets);
    console.log(`✓ Added ${data.tickets.length} tickets`);
    
    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

// Run the seeding function
seedDatabase();
