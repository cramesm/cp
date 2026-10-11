const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
  requestId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  studentId: {
    type: String,
    default: ''
  },
  userId: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  email: {
    type: String,
    default: ''
  },
  mobileStatus: {
    type: String,
    default: 'pending'
  },
  paymentReceiptId: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  paymentType: {
    type: String,
    default: ''
  },
  referenceNumber: {
    type: String,
    default: ''
  },
  course: {
    type: String,
    default: ''
  },
  yearLevel: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: [
      'Pending for Payment',
      'Pending',
      'Needs Update',
      'In Process',
      'Released',
      'Ready to Claim',
      'Claimed',
      'Refund Approved',
      'Refunded',
      'Completed',
      'Rejected'
    ],
    default: 'Pending'
  },
  claimedAt: {
    type: Date,
    default: null
  },
  statusHistory: [{
    status: { type: String, required: true },
    at: { type: Date, default: Date.now },
    remarks: { type: String, default: '' }
  }],
  rejectionReason: {
    type: String,
    default: ''
  },
  documentType: {
    type: String,
    required: true
  },
  subDocumentType: {
    type: String,
    default: ''
  },
  purpose: {
    type: String,
    default: ''
  },
  otherPurpose: {
    type: String,
    default: ''
  },
  quantity: {
    type: Number,
    default: 1
  },
  documentHash: {
    type: String
  },
  documentFile: {
    type: String
  },
  dateRequested: {
    type: Date,
    default: Date.now
  },
  dateReleased: {
    type: Date,
    default: null
  },
  estimatedProcessingStart: {
    type: Date,
    default: null
  },
  estimatedProcessingEnd: {
    type: Date,
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.models.Request || mongoose.model('Request', requestSchema);
