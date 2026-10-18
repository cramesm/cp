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
router.get('/smtp-debug', async (req, res) => {
  const { getTransporter, getSmtpUser, getSmtpPass } = require('../utils/emailService');

  const user1 = process.env.SMTP_USER || '';
  const user2 = process.env.SMTP_EMAIL || '';
  const pass1 = process.env.SMTP_PASS || '';
  const pass2 = process.env.SMTP_PASSWORD || '';
  const host = process.env.SMTP_HOST || '';
  const port = process.env.SMTP_PORT || '';
  const secure = process.env.SMTP_SECURE || '';

  const cleanUser = getSmtpUser();
  const cleanP = getSmtpPass();

  let verifyResult = 'not tested';
  let verifyError = null;
  try {
    const transporter = getTransporter();
    await transporter.verify();
    verifyResult = 'success';
  } catch (err) {
    verifyResult = 'failed';
    verifyError = err.message;
  }

  res.json({
    status: 'ok',
    diagnostics: {
      has_SMTP_USER: !!user1,
      user1_val: user1,
      has_SMTP_EMAIL: !!user2,
      user2_val: user2,
      effective_user: cleanUser,
      has_SMTP_PASS: !!pass1,
      pass1_length: pass1.length,
      pass1_prefix: pass1.length >= 4 ? `${pass1.substring(0, 2)}***${pass1.substring(pass1.length - 2)}` : 'too-short',
      has_SMTP_PASSWORD: !!pass2,
      pass2_length: pass2.length,
      pass2_prefix: pass2.length >= 4 ? `${pass2.substring(0, 2)}***${pass2.substring(pass2.length - 2)}` : 'too-short',
      effective_clean_pass_length: cleanP.length,
      effective_clean_pass_prefix: cleanP.length >= 4 ? `${cleanP.substring(0, 2)}***${cleanP.substring(cleanP.length - 2)}` : 'too-short',
      host,
      port,
      secure,
      verifyResult,
      verifyError
    }
  });
});
router.get('/request-policy', (_req, res) => res.json({ success: true, express: null }));
router.get('/error-statuses', (req, res) => res.json({ success: true, statuses: HTTP_ERROR_STATUSES }));

module.exports = router;
