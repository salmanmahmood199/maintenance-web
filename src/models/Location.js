const mongoose = require('mongoose');

const LocationSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  address: String,
  city: String,
  state: String,
  zip: String,
  country: String,
  phone: String,
  organizationId: String,
  orgId: String, // Add support for orgId which is used in newer location entries
  status: {
    type: String,
    default: 'active'
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
LocationSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Location', LocationSchema);
