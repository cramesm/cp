const express = require('express');
const router = express.Router();
const EmailController = require('../controllers/emailController');
const { auth } = require('../middleware/authMiddleware');

// @route   POST /api/email/send
router.post('/send', auth, EmailController.sendEmail);

module.exports = router;
