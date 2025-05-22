const mongoose = require('mongoose');

const SubAdminSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
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
  assignedLocationIds: [String],
  locationTierPermissions: {
    type: Map,
    of: {
      acceptTicket: Boolean,
      tiers: [mongoose.Schema.Types.Mixed]
    }
  },
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
SubAdminSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('SubAdmin', SubAdminSchema);
