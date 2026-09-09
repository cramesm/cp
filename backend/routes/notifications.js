const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { protect } = require('../middleware/authMiddleware');

// Helper filter for admin-actionable notifications
const getAdminNotificationFilter = () => ({
  $or: [
    { targetRole: 'admin' },
    { targetRole: 'all' },
    // Backward compatibility for legacy records:
    // Exclude student-addressed messages ("Your request...", "Your refund...", etc.)
    {
      targetRole: { $exists: false },
      message: { $not: /^(your request|your refund|your account|your password|your profile)/i }
    }
  ]
});

// Get actionable notifications for Admin/Registrar
router.get('/', async (req, res) => {
  try {
    const filter = getAdminNotificationFilter();
    const notifications = await Notification.find(filter).sort({ date: -1, createdAt: -1 });
    res.json(notifications);
  } catch (error) {
    console.error('Error fetching admin notifications:', error);
    res.status(500).json({ message: 'Error fetching notifications' });
  }
});

// Get user specific notifications (Student / Alumni)
router.get('/mine', protect, async (req, res) => {
  try {
    const notifications = await Notification.find({
      $or: [
        { email: req.user.email },
        { targetRole: 'student', email: req.user.email },
        { targetRole: 'all' }
      ]
    }).sort({ date: -1, createdAt: -1 });
    res.json({ success: true, notifications });
  } catch (error) {
    console.error('Error fetching user notifications:', error);
    res.status(500).json({ success: false, message: 'Error fetching notifications' });
  }
});


// Mark all as read
router.put('/mark-all-read', async (req, res) => {
  try {
    await Notification.updateMany({ isRead: false }, { isRead: true });
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating notifications' });
  }
});

// Mark all as read for specific user
router.put('/mine/mark-all-read', protect, async (req, res) => {
  try {
    await Notification.updateMany({ email: req.user.email, isRead: false }, { isRead: true });
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating notifications' });
  }
});

// Mark as read
router.put('/:id/read', protect, async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );
    if (!notification) return res.status(404).json({ success: false, message: 'Notification not found' });
    res.json({ success: true, notification });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating notification' });
  }
});

module.exports = router;
