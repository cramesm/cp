const express = require('express');
const router = express.Router();
const BackupController = require('../controllers/backupController');
const { auth, superAdminOnly } = require('../middleware/authMiddleware');

// All backup routes require Super Admin authorization
router.use(auth);
router.use(superAdminOnly);

// @route   GET /api/backup/stats
router.get('/stats', BackupController.getStats);

// @route   GET /api/backup/export
router.get('/export', BackupController.exportBackup);

// @route   POST /api/backup/restore
router.post('/restore', BackupController.restoreBackup);

module.exports = router;
