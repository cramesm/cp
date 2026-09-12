const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { auth } = require('../middleware/authMiddleware');
const { validate, registerValidation, loginValidation, updateProfileValidation } = require('../middleware/validationMiddleware');
const { registerLimiter, loginProgressiveLimiter } = require('../middleware/rateLimiterMiddleware');

// @route   POST /api/auth/register/request-otp
router.post('/register/request-otp', registerLimiter, AuthController.requestRegisterOTP);

// @route   POST /api/auth/register/verify-otp
router.post('/register/verify-otp', registerLimiter, registerValidation, validate, AuthController.verifyRegisterOTP);

// @route   POST /api/auth/register
router.post('/register', registerLimiter, registerValidation, validate, AuthController.register);

// @route   POST /api/auth/login
router.post('/login', loginProgressiveLimiter, loginValidation, validate, AuthController.login);

// @route   POST /api/auth/logout
router.post('/logout', AuthController.logout);

// @route   POST /api/auth/forgot-password
router.post('/forgot-password', AuthController.forgotPassword);

// @route   POST /api/auth/verify-otp
router.post('/verify-otp', AuthController.verifyPasswordResetOTP);

// @route   POST /api/auth/reset-password
router.post('/reset-password', AuthController.resetPassword);

// @route   GET /api/auth/profile
router.get('/profile', auth, AuthController.getProfile);

// @route   PUT /api/auth/profile
router.put('/profile', auth, updateProfileValidation, validate, AuthController.updateProfile);

// @route   PUT /api/auth/change-password
router.put('/change-password', auth, AuthController.changePassword);

module.exports = router;
