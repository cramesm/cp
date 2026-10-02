const express = require('express');
const router = express.Router();

const { authLimiter } = require('../middleware/rateLimiter');
const { HTTP_ERROR_STATUSES } = require('../middleware/errorMiddleware');

// ----------------------------------------------------------------------------
// 1. Authentication & Profile
// ----------------------------------------------------------------------------
router.use('/auth', authLimiter, require('./auth'));
router.use('/profile', require('./profile'));

// ----------------------------------------------------------------------------
// 2. Shared Workspace (Dashboard & Notifications)
// ----------------------------------------------------------------------------
router.use('/dashboard', require('./dashboard'));
router.use('/notifications', require('./notifications'));

// ----------------------------------------------------------------------------
// 3. Registrar Department (Document Requests & Blockchain)
// ----------------------------------------------------------------------------
router.use('/requests', require('./requests'));
router.use('/requests', require('./documentUploads')); // Handles POST /requests/:id/upload
router.use('/documents', require('./documents'));
router.use('/tor', require('./tor'));
router.use('/diploma', require('./diploma'));
router.use('/blockchain/transactions', require('./blockchainTransactions'));

// ----------------------------------------------------------------------------
// 4. Accounting Department (Payments & Refunds)
// ----------------------------------------------------------------------------
router.use('/transactions', require('./transactions'));
router.use('/payments', require('./transactions')); // Alias route for payments
router.use('/refunds', require('./refunds'));

// ----------------------------------------------------------------------------
// 5. IT Administration & User Directory
// ----------------------------------------------------------------------------
router.use('/students', require('./students'));
router.use('/v1/students', require('./students')); // V1 migration support
router.use('/alumni', require('./alumni'));
router.use('/v1/alumni', require('./alumni')); // V1 migration support
router.use('/backup', require('./backup'));

// ----------------------------------------------------------------------------
// 6. Super Admin & Staff Oversight
// ----------------------------------------------------------------------------
router.use('/registrars', require('./registrars')); // Staff directory across all departments
router.use('/admins', require('./adminManagement'));
router.use('/activity-logs', require('./activityLogs'));

// ----------------------------------------------------------------------------
// 7. Public & Utility Endpoints
// ----------------------------------------------------------------------------
router.use('/verify', require('./verify'));
router.use('/upload', require('./uploads'));
router.use('/email', require('./email'));

// System Discovery & Health Diagnostics
router.get('/health', (req, res) => res.json({ status: 'API is running' }));
router.get('/error-statuses', (req, res) => res.json({ success: true, statuses: HTTP_ERROR_STATUSES }));

module.exports = router;
