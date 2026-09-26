const express = require('express');
const router = express.Router();
const ActivityLogController = require('../controllers/activityLogController');
const { auth, canViewLogs } = require('../middleware/authMiddleware');

// Get all activity logs (export as CSV) - Authorized Admins
router.get('/export', auth, canViewLogs, ActivityLogController.exportLogs);

// Get all activity logs - Authorized Admins
router.get('/', auth, canViewLogs, ActivityLogController.getLogs);

// Create a log entry
router.post('/', auth, ActivityLogController.createLog);

module.exports = router;
