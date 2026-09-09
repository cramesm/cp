const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  message: {
    type: String,
    required: true
  },
  email: {
    type: String,
    default: ''
  },
  targetRole: {
    type: String,
    enum: ['admin', 'student', 'all'],
    default: 'admin'
  },
  type: {
    type: String,
    enum: ['request', 'payment', 'refund', 'system', 'general'],
    default: 'general'
  },
  link: {
    type: String,
    default: ''
  },
  isRead: {
    type: Boolean,
    default: false
  },
  date: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);

