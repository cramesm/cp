const express = require('express');
const router = express.Router();
const ActivityLogController = require('../controllers/activityLogController');
const { auth, superAdminOnly } = require('../middleware/authMiddleware');

// Get all activity logs (export as CSV) - Super Admin Only
router.get('/export', auth, superAdminOnly, ActivityLogController.exportLogs);

// Get all activity logs - Super Admin Only
router.get('/', auth, superAdminOnly, ActivityLogController.getLogs);

// Create a log entry
router.post('/', auth, ActivityLogController.createLog);

module.exports = router;
