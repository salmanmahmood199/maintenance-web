const mongoose = require('mongoose');

const VendorSchema = new mongoose.Schema({
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
  // Support both formats of services
  services: [String],
  specialties: String,
  tier: Number,
  // Support both organization ID formats
  orgContextIds: [String],
  orgIds: [String],
  // Unified organization IDs (virtual field for API responses)
  organizationIds: {
    type: [String],
    default: function() {
      // Return orgIds or orgContextIds depending on what's available
      return this.orgIds || this.orgContextIds || [];
    }
  },
  password: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Create a virtual for normalized services
VendorSchema.virtual('allServices').get(function() {
  // Combine services array and specialties string into a unified array
  const serviceArray = this.services || [];
  if (this.specialties) {
    // Split specialties by comma if it's a comma-separated string
    if (this.specialties.includes(',')) {
      serviceArray.push(...this.specialties.split(',').map(s => s.trim()));
    } else {
      serviceArray.push(this.specialties);
    }
  }
  // Remove duplicates
  return [...new Set(serviceArray)];
});

// Pre-save middleware to update the updatedAt field
VendorSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Pre-save middleware to normalize organization IDs
VendorSchema.pre('save', function(next) {
  // If orgIds is present but orgContextIds is not, copy orgIds to orgContextIds
  if (this.orgIds && this.orgIds.length > 0 && (!this.orgContextIds || this.orgContextIds.length === 0)) {
    this.orgContextIds = [...this.orgIds];
  }
  // If orgContextIds is present but orgIds is not, copy orgContextIds to orgIds
  else if (this.orgContextIds && this.orgContextIds.length > 0 && (!this.orgIds || this.orgIds.length === 0)) {
    this.orgIds = [...this.orgContextIds];
  }
  next();
});

module.exports = mongoose.model('Vendor', VendorSchema);
