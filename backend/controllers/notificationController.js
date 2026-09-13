const Notification = require('../models/Notification');

// Helper filter for admin-actionable notifications
const getAdminNotificationFilter = () => ({
  $or: [
    { targetRole: 'admin' },
    { targetRole: 'all' },
    {
      targetRole: { $exists: false },
      message: { $not: /^(your request|your refund|your account|your password|your profile)/i }
    }
  ]
});

const NotificationController = {
  // @desc    Get actionable notifications for Admin/Registrar
  getAdminNotifications: async (req, res) => {
    try {
      const filter = getAdminNotificationFilter();
      const notifications = await Notification.find(filter).sort({ date: -1, createdAt: -1 });
      res.json(notifications);
    } catch (error) {
      console.error('Error fetching admin notifications:', error);
      res.status(500).json({ message: 'Error fetching notifications' });
    }
  },

  // @desc    Get user specific notifications (Student / Alumni)
  getMyNotifications: async (req, res) => {
    try {
      const userClauses = [];
      if (req.user.email) userClauses.push({ email: req.user.email });
      if (req.user.id || req.user._id) userClauses.push({ userId: req.user.id || req.user._id });

      const notifications = await Notification.find({
        $or: [
          ...userClauses,
          { targetRole: 'all' },
          ...(req.user.email ? [{ targetRole: 'student', email: req.user.email }] : [{ targetRole: 'student' }])
        ]
      }).sort({ date: -1, createdAt: -1 });
      res.json({ success: true, notifications });
    } catch (error) {
      console.error('Error fetching user notifications:', error);
      res.status(500).json({ success: false, message: 'Error fetching notifications' });
    }
  },

  // @desc    Mark all admin notifications as read
  markAllRead: async (req, res) => {
    try {
      await Notification.updateMany({ isRead: false }, { isRead: true });
      res.json({ message: 'All notifications marked as read' });
    } catch (error) {
      console.error('Error updating notifications:', error);
      res.status(500).json({ message: 'Error updating notifications' });
    }
  },

  // @desc    Mark all notifications as read for current user
  markMyAllRead: async (req, res) => {
    try {
      const userClauses = [];
      if (req.user.email) userClauses.push({ email: req.user.email });
      if (req.user.id || req.user._id) userClauses.push({ userId: req.user.id || req.user._id });

      await Notification.updateMany({
        $or: userClauses.length > 0 ? userClauses : [{ email: req.user.email }],
        isRead: false
      }, { isRead: true });
      res.json({ success: true, message: 'All notifications marked as read' });
    } catch (error) {
      console.error('Error updating user notifications:', error);
      res.status(500).json({ success: false, message: 'Error updating notifications' });
    }
  },

  // @desc    Mark single notification as read
  markAsRead: async (req, res) => {
    try {
      const notification = await Notification.findByIdAndUpdate(
        req.params.id,
        { isRead: true },
        { new: true }
      );
      if (!notification) return res.status(404).json({ success: false, message: 'Notification not found' });
      res.json({ success: true, notification });
    } catch (error) {
      console.error('Error updating notification:', error);
      res.status(500).json({ success: false, message: 'Error updating notification' });
    }
  },

  // @desc    Delete single notification
  deleteNotification: async (req, res) => {
    try {
      const notification = await Notification.findByIdAndDelete(req.params.id);
      if (!notification) return res.status(404).json({ success: false, message: 'Notification not found' });
      res.json({ success: true, message: 'Notification deleted' });
    } catch (error) {
      console.error('Error deleting notification:', error);
      res.status(500).json({ success: false, message: 'Error deleting notification' });
    }
  }
};

module.exports = NotificationController;
