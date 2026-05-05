const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  transactionId: {
    type: String,
    required: true,
    unique: true
  },
  requestId: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  documentType: {
    type: String,
    required: true
  },
  paymentMode: {
    type: String,
    enum: ['GCash', 'Maya', 'GoThyme', 'Other Online Payment'],
    default: 'GCash'
  },
  amount: {
    type: String,
    default: '0.00'
  },
  receiptImage: {
    type: String,
    default: ''
  },
  payerName: {
    type: String,
    default: ''
  },
  payerEmail: {
    type: String,
    default: ''
  },
  payerType: {
    type: String,
    enum: ['Student', 'Alumni'],
    default: 'Student'
  },
  adminRemarks: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['Pending Verification', 'Completed', 'Needs Update', 'Rejected'],
    default: 'Pending Verification'
  },
  verifiedBy: {
    type: String,
    default: ''
  },
  verifiedAt: {
    type: Date
  },
  date: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);
