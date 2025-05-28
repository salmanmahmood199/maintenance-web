const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  phone: String,
  password: String,
  role: {
    type: String,
    required: true,
    enum: ['root', 'vendor', 'subadmin', 'admin', 'user']
  },
  orgContextIds: [String],
  vendorId: String,
  securityGroupIds: [String],
  permissions: [String],
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

// Pre-save middleware to hash password and update the updatedAt field
UserSchema.pre('save', async function(next) {
  // Update the updatedAt field
  this.updatedAt = new Date();

  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) {
    return next();
  }

  // Do not hash if password is not set (e.g. during some updates)
  if (!this.password) {
    return next();
  }

  try {
    // Generate a salt
    const salt = await bcrypt.genSalt(10);
    // Hash the password using the new salt
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error); // Pass errors to Express
  }
});

// Method to compare given password with the hashed password in the database
UserSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

module.exports = mongoose.model('User', UserSchema);
