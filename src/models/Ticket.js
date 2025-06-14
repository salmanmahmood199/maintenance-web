const mongoose = require('mongoose');

const HistorySchema = new mongoose.Schema({
  action: String,
  timestamp: Date,
  by: String
}, { _id: false });

const NoteSchema = new mongoose.Schema({
  text: String,
  date: Date,
  by: String
}, { _id: false });

const TicketSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  ticketNo: String,
  locationId: {
    type: String,
    required: true
  },
  issueType: String,
  description: String,
  placedBy: String,
  dateTime: Date,
  timestamp: Date,
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical']
  },
  status: {
    type: String,
    default: 'New'
  },
  vendorId: String,
  vendorResponseStatus: {
    type: String,
    enum: ['accepted', 'rejected', 'more_info_requested', null],
    default: null
  },
  notes: [NoteSchema],
  mediaUrls: [String],
  adminApproved: {
    type: Boolean,
    default: false
  },
  workOrderCreated: {
    type: Boolean,
    default: false
  },
  invoiceUploaded: {
    type: Boolean,
    default: false
  },
  finalApprovalRequested: {
    type: Boolean,
    default: false
  },
  completionDate: Date,
  verificationDate: Date,
  history: [HistorySchema],
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
TicketSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Ticket', TicketSchema);
