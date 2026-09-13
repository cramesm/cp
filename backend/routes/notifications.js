const express = require('express');
const router = express.Router();
const NotificationController = require('../controllers/notificationController');
const { auth } = require('../middleware/authMiddleware');

// Get actionable notifications for Admin/Registrar
router.get('/', NotificationController.getAdminNotifications);

// Get user specific notifications (Student / Alumni)
router.get('/mine', auth, NotificationController.getMyNotifications);

// Mark all as read (Admin)
router.put('/mark-all-read', NotificationController.markAllRead);

// Mark all as read for specific user
router.put('/mine/mark-all-read', auth, NotificationController.markMyAllRead);

// Mark as read
router.put('/:id/read', auth, NotificationController.markAsRead);

// Delete notification
router.delete('/:id', auth, NotificationController.deleteNotification);

module.exports = router;
