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
  email: {
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
    enum: ['Pending', 'In Process', 'Approved', 'Released', 'Rejected'],
    default: 'Pending'
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
  }
}, { timestamps: true });

delete mongoose.models.Request;
module.exports = mongoose.model('Request', requestSchema);
