const mongoose = require('mongoose');

const SubAdminSchema = new mongoose.Schema({
  id: String,
  name: String,
  email: String,
  phone: String,
  password: String,
  role: {
    type: String,
    default: 'subadmin'
  },
  organizationId: String,
  permissions: [String],
  assignedLocationIds: [String]
}, { _id: false });

const OrganizationSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  email: String,
  phone: String,
  address: String,
  status: {
    type: String,
    default: 'active'
  },
  // Additional fields for newer organization model
  contactName: String,
  contactEmail: String,
  contactPhone: String,
  plan: String,
  subAdmins: [SubAdminSchema],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Pre-save middleware to update the updatedAt field
OrganizationSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Organization', OrganizationSchema);
