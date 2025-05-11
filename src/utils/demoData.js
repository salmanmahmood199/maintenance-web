import { v4 as uuidv4 } from 'uuid';

// Demo data to restore organizations and vendors
export const demoData = {
  organizations: [
    {
      id: uuidv4(),
      name: "Retail Chain Inc.",
      email: "contact@retailchain.com",
      phone: "555-123-4567",
      address: "123 Main Street, New York, NY 10001",
      status: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: uuidv4(),
      name: "Restaurant Group",
      email: "info@restaurantgroup.com",
      phone: "555-987-6543",
      address: "456 Food Avenue, Chicago, IL 60601",
      status: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: uuidv4(),
      name: "Hotel Chain",
      email: "support@hotelchain.com",
      phone: "555-456-7890",
      address: "789 Hospitality Blvd, Miami, FL 33101",
      status: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  vendors: [
    {
      id: uuidv4(),
      name: "FixIt Maintenance Services",
      email: "service@fixit.com",
      phone: "555-111-2222",
      address: "100 Repair Street, Boston, MA 02108",
      status: "active",
      services: ["Plumbing", "Electrical", "HVAC"],
      tier: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: uuidv4(),
      name: "Pro Technicians",
      email: "info@protech.com",
      phone: "555-333-4444",
      address: "200 Expert Lane, San Francisco, CA 94105",
      status: "active",
      services: ["Equipment Repair", "IT Infrastructure", "Security Systems"],
      tier: 2,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: uuidv4(),
      name: "Elite Cleaning Solutions",
      email: "contact@elitecleaning.com",
      phone: "555-555-6666",
      address: "300 Spotless Avenue, Dallas, TX 75201",
      status: "active",
      services: ["Janitorial", "Carpet Cleaning", "Pressure Washing"],
      tier: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  locations: [
    {
      id: uuidv4(),
      name: "Downtown Branch",
      address: "101 Main Street, New York, NY 10001",
      phone: "555-111-3333",
      organizationId: null, // Will be set programmatically
      status: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: uuidv4(),
      name: "West Side Location",
      address: "202 West End Ave, Chicago, IL 60601",
      phone: "555-222-4444",
      organizationId: null, // Will be set programmatically
      status: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ]
};

// This function will associate locations with their respective organizations
export const setupDemoRelationships = (data) => {
  // If we have both organizations and locations
  if (data.organizations?.length > 0 && data.locations?.length > 0) {
    // Assign first location to first organization
    if (data.locations[0] && data.organizations[0]) {
      data.locations[0].organizationId = data.organizations[0].id;
    }
    
    // Assign second location to second organization if available, otherwise to first
    if (data.locations[1]) {
      data.locations[1].organizationId = data.organizations[1]?.id || data.organizations[0].id;
    }
  }
  
  return data;
};
