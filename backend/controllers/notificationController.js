const Notification = require('../models/Notification');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { resolveUserRoleAndDept, getRoleNotificationFilter } = require('../utils/notificationFilter');

// Helper to build robust user matching clauses (for Mobile & Student/Alumni web)
const buildUserClauses = (user) => {
  const clauses = [];
  const email = (user.email || '').trim();
  if (email) {
    const escaped = email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    clauses.push({ email: { $regex: new RegExp(`^${escaped}$`, 'i') } });
    clauses.push({ targetRole: 'student', email: { $regex: new RegExp(`^${escaped}$`, 'i') } });
  }
  const uid = user.id || user._id || user.userId;
  if (uid) {
    clauses.push({ userId: uid });
    clauses.push({ userId: String(uid) });
    if (mongoose.Types.ObjectId.isValid(uid)) {
      clauses.push({ userId: new mongoose.Types.ObjectId(uid) });
    }
  }
  const studentId = (user.studentId || '').trim();
  if (studentId) {
    const escapedSid = studentId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    clauses.push({ studentId: { $regex: new RegExp(`^${escapedSid}$`, 'i') } });
  }
  clauses.push({ targetRole: 'all' });
  return clauses;
};

const NotificationController = {
  // @desc    Get actionable notifications for Admin/Registrar/Accounting or delegating student
  getAdminNotifications: async (req, res) => {
    try {
      // Check API Key authentication (e.g., from mobile notification service or background worker)
      const apiKey = req.headers['x-api-key'] || req.headers['x-notification-key'];
      const isApiKeyAuthorized = Boolean(process.env.NOTIFICATIONS_API_KEY && apiKey === process.env.NOTIFICATIONS_API_KEY);

      // 1. Check query params if caller requested student notifications explicitly (e.g. Mobile query params)
      if (req.query.email || req.query.userId || req.query.studentId) {
        const clauses = buildUserClauses(req.query);
        const notifications = await Notification.find({ $or: clauses }).sort({ date: -1, createdAt: -1 });
        return res.json(notifications);
      }

      // 2. Decode user from Bearer token if provided
      let callerUser = req.user;
      if (!callerUser && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
          const token = req.headers.authorization.split(' ')[1];
          callerUser = jwt.verify(token, process.env.JWT_SECRET || 'supersecretverifitor123');
        } catch (_tokenErr) {
          // Token invalid or expired
        }
      }

      // Check if caller provides Bearer token for a student or alumni (e.g. Mobile app token)
      if (callerUser && (callerUser.role === 'student' || callerUser.role === 'alumni')) {
        const clauses = buildUserClauses(callerUser);
        const notifications = await Notification.find({ $or: clauses }).sort({ date: -1, createdAt: -1 });
        return res.json(notifications);
      }

      // 3. Resolve role and department for staff / admin
      const { role, department } = await resolveUserRoleAndDept(callerUser);
      const filter = getRoleNotificationFilter(role, department);

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
      const clauses = buildUserClauses(req.user);
      const notifications = await Notification.find({ $or: clauses }).sort({ date: -1, createdAt: -1 });
      res.json({ success: true, notifications, data: notifications });
    } catch (error) {
      console.error('Error fetching user notifications:', error);
      res.status(500).json({ success: false, message: 'Error fetching notifications' });
    }
  },

  // @desc    Mark all role-appropriate admin notifications as read
  markAllRead: async (req, res) => {
    try {
      let callerUser = req.user;
      if (!callerUser && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
          const token = req.headers.authorization.split(' ')[1];
          callerUser = jwt.verify(token, process.env.JWT_SECRET || 'supersecretverifitor123');
        } catch (_tokenErr) {}
      }

      const { role, department } = await resolveUserRoleAndDept(callerUser);
      const roleFilter = getRoleNotificationFilter(role, department);

      await Notification.updateMany({ ...roleFilter, isRead: false }, { isRead: true });
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
