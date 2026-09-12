const express = require('express');
const router = express.Router();
const DashboardController = require('../controllers/dashboardController');

// @route   GET /api/dashboard/stats
router.get('/stats', DashboardController.getStats);

// @route   GET /api/dashboard/recent
router.get('/recent', DashboardController.getRecentActivity);

module.exports = router;
