const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  userEmail: {
    type: String,
    required: true
  },
  action: {
    type: String,
    required: true
  },
  details: {
    type: String
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
