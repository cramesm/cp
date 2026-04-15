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
  transactionHash: {
    type: String,
    required: true,
    unique: true
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
    required: true
  },
  status: {
    type: String,
    enum: ['Processing', 'Approved', 'Released', 'Rejected'],
    default: 'Processing'
  },
  date: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);
