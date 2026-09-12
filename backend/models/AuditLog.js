const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  level: {
    type: String,
    enum: ['info', 'warn', 'error'],
    default: 'info'
  },
  message: {
    type: String,
    required: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  },
  method: {
    type: String
  },
  path: {
    type: String
  },
  ip: {
    type: String
  },
  userEmail: {
    type: String,
    default: 'Anonymous'
  },
  statusCode: {
    type: Number
  },
  durationMs: {
    type: Number
  },
  timestamp: {
    type: Date,
    default: Date.now,
    expires: 30 * 24 * 60 * 60 // 30 days TTL
  }
}, { timestamps: true });

module.exports = mongoose.models.AuditLog || mongoose.model('AuditLog', auditLogSchema);
