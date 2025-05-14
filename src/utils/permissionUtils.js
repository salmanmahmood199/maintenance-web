/**
 * Permission mapping utilities
 * Maps UI elements to required permissions
 */

// Maps menu items to required permissions
export const menuPermissionMap = {
  // Root navigation items
  '/dashboard': [],  // Available to all authenticated users
  '/organizations': [], // Available to all authenticated users
  '/vendors': ['subadmin.addVendor', 'subadmin.manageVendors'],
  
  // Organization context navigation items
  'org.overview': [], // Available to all authenticated users for their organization
  'org.subadmins': ['subadmin.assignLocation'], // Only those who can manage permissions
  'org.locations': ['subadmin.addLocation', 'subadmin.assignLocation'],
  'org.vendors': ['subadmin.manageVendors'],
  'org.tickets': ['subadmin.placeTicket', 'subadmin.viewTickets', 'subadmin.acceptTicket', 
                 'subadmin.tier2AcceptTicket', 'subadmin.tier3AcceptTicket', 'subadmin.verifyJobCompleted'],
  'org.issues': ['subadmin.addIssueType'],
  'org.invoices': ['subadmin.acceptInvoice'],
  
  // Other functional areas
  'tickets.create': ['subadmin.placeTicket'],
  'tickets.accept': ['subadmin.acceptTicket'],
  'tickets.accept.tier2': ['subadmin.tier2AcceptTicket'],
  'tickets.accept.tier3': ['subadmin.tier3AcceptTicket'],
  'tickets.verify': ['subadmin.verifyJobCompleted'],
  'vendors.add': ['subadmin.addVendor'],
  'locations.add': ['subadmin.addLocation'],
  'locations.assign': ['subadmin.assignLocation'],
};

// Maps feature areas to friendly display names
export const permissionDisplayNames = {
  'subadmin.placeTicket': 'Create Tickets',
  'subadmin.acceptTicket': 'Tier 1 Ticket Processing',
  'subadmin.tier2AcceptTicket': 'Tier 2 Ticket Processing',
  'subadmin.tier3AcceptTicket': 'Tier 3 Ticket Processing',
  'subadmin.addVendor': 'Vendor Management',
  'subadmin.manageVendors': 'Vendor Relationships',
  'subadmin.addIssueType': 'Issue Type Management',
  'subadmin.acceptInvoice': 'Invoice Processing',
  'subadmin.addLocation': 'Location Management',
  'subadmin.assignLocation': 'User-Location Assignment',
  'subadmin.verifyJobCompleted': 'Work Verification',
  'subadmin.viewTickets': 'View Tickets',
  'subadmin.viewReports': 'View Reports',
};
