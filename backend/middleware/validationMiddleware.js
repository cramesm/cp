const { body, param, validationResult } = require('express-validator');

/**
 * Validation Execution Middleware
 * Extracts express-validator results and halts execution with 400 Bad Request
 * if validation errors are detected.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      status: 400,
      error: 'Bad Request',
      message: 'Input validation failed',
      errors: errors.array().map((err) => ({
        field: err.path || err.param,
        message: err.msg,
        value: err.value
      }))
    });
  }
  next();
};

// ============================================================================
// Authentication & Account Validations
// ============================================================================

const registerValidation = [
  body('firstName')
    .trim()
    .isLength({ min: 2 }).withMessage('First name must be at least 2 characters long')
    .notEmpty().withMessage('First name is required'),
  body('lastName')
    .trim()
    .isLength({ min: 2 }).withMessage('Last name must be at least 2 characters long')
    .notEmpty().withMessage('Last name is required'),
  body('email')
    .trim()
    .isEmail().withMessage('Must be a valid email address')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('role').optional().isString().trim()
];

const loginValidation = [
  body('email')
    .trim()
    .isEmail().withMessage('Must be a valid email address')
    .notEmpty().withMessage('Email is required')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required')
];

const updateProfileValidation = [
  body('firstName').optional().trim().isLength({ min: 2 }).withMessage('First name must be at least 2 characters long'),
  body('lastName').optional().trim().isLength({ min: 2 }).withMessage('Last name must be at least 2 characters long'),
  body('email').optional().trim().isEmail().withMessage('Must be a valid email address').normalizeEmail(),
];

const changePasswordValidation = [
  body('currentPassword')
    .notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 }).withMessage('New password must be at least 6 characters long')
];

const resetPasswordValidation = [
  body('email')
    .trim()
    .isEmail().withMessage('Valid email address is required')
    .normalizeEmail(),
  body('otp')
    .trim()
    .notEmpty().withMessage('Verification OTP is required')
    .isLength({ min: 4, max: 8 }).withMessage('Invalid OTP code length'),
  body('newPassword')
    .isLength({ min: 6 }).withMessage('New password must be at least 6 characters long')
];

// ============================================================================
// Staff Management Validations
// ============================================================================

const createStaffValidation = [
  body('email')
    .trim()
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2 }).withMessage('First name must be at least 2 characters long'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2 }).withMessage('Last name must be at least 2 characters long'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2 }).withMessage('Name must be at least 2 characters long'),
  body('department')
    .optional()
    .isIn(['Registrar', 'Accounting', 'IT Administration', 'Administration', 'IT'])
    .withMessage('Department must be one of: Registrar, Accounting, IT Administration, Administration'),
  body('role')
    .optional()
    .isString().trim()
];

const updateStaffValidation = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2 }).withMessage('First name must be at least 2 characters long'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2 }).withMessage('Last name must be at least 2 characters long'),
  body('status')
    .optional()
    .isIn(['Active', 'Inactive', 'Archived'])
    .withMessage('Status must be Active, Inactive, or Archived')
];

// ============================================================================
// Department Operations Validations
// ============================================================================

const requestStatusValidation = [
  body('status')
    .isIn(['Pending', 'Processing', 'Ready for Pickup', 'Completed', 'Rejected'])
    .withMessage('Invalid status. Allowed values: Pending, Processing, Ready for Pickup, Completed, Rejected')
];

const paymentStatusValidation = [
  body('status')
    .isIn(['Verified', 'Rejected', 'Needs Update'])
    .withMessage('Invalid payment status. Allowed values: Verified, Rejected, Needs Update')
];

const refundStatusValidation = [
  body('status')
    .isIn(['Approved', 'Rejected'])
    .withMessage('Invalid refund status. Allowed values: Approved, Rejected')
];

// ============================================================================
// Common Parameter Validators
// ============================================================================

const mongoIdParamValidation = (paramName = 'id') => [
  param(paramName)
    .isMongoId()
    .withMessage(`Parameter '${paramName}' must be a valid 24-character hexadecimal MongoDB ObjectId`)
];

module.exports = {
  validate,
  registerValidation,
  loginValidation,
  updateProfileValidation,
  changePasswordValidation,
  resetPasswordValidation,
  createStaffValidation,
  updateStaffValidation,
  requestStatusValidation,
  paymentStatusValidation,
  refundStatusValidation,
  mongoIdParamValidation
};
