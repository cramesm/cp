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
  isRead: {
    type: Boolean,
    default: false
  },
  date: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

delete mongoose.models.Notification;
module.exports = mongoose.model('Notification', notificationSchema);
