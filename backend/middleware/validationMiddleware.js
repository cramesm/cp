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
// Helper Regular Expressions for Strict Field Formatting
// ============================================================================

// Letters, spaces, hyphens, and apostrophes only (No numbers or symbols allowed)
const NAME_REGEX = /^[a-zA-ZÀ-ÿ\s'-]+$/;

// Standard alphanumeric identifier with hyphens and underscores (No unsafe characters)
const SAFE_ID_REGEX = /^[0-9A-Za-z_-]+$/;

// Phone number: optional leading +, digits, hyphens, and spaces only
const PHONE_REGEX = /^\+?[0-9\s-]{7,15}$/;

// Safe text for titles, courses, document types (alphanumeric, spaces, parentheses, hyphens, periods)
const SAFE_TEXT_REGEX = /^[a-zA-Z0-9\s().,:-]+$/;

// Positive decimal amount with up to 2 decimal places
const AMOUNT_REGEX = /^\d+(\.\d{1,2})?$/;

// ============================================================================
// Authentication & Account Validations
// ============================================================================

const registerValidation = [
  body('firstName')
    .trim()
    .notEmpty().withMessage('First name is required')
    .matches(NAME_REGEX).withMessage('First name must contain only letters, spaces, hyphens, and apostrophes (numbers and special characters are not allowed)')
    .isLength({ min: 2, max: 50 }).withMessage('First name must be between 2 and 50 characters long'),
  body('lastName')
    .trim()
    .notEmpty().withMessage('Last name is required')
    .matches(NAME_REGEX).withMessage('Last name must contain only letters, spaces, hyphens, and apostrophes (numbers and special characters are not allowed)')
    .isLength({ min: 2, max: 50 }).withMessage('Last name must be between 2 and 50 characters long'),
  body('email')
    .trim()
    .isEmail().withMessage('Must be a valid email address')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6, max: 128 }).withMessage('Password must be between 6 and 128 characters long'),
  body('phoneNumber')
    .optional({ checkFalsy: true })
    .trim()
    .matches(PHONE_REGEX).withMessage('Phone number must contain only numbers and optional leading +'),
  body('studentId')
    .optional({ checkFalsy: true })
    .trim()
    .matches(SAFE_ID_REGEX).withMessage('Student ID can only contain letters, numbers, hyphens, and underscores'),
  body('role')
    .optional()
    .isIn(['student', 'alumni']).withMessage('Role must be student or alumni')
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
  body('firstName')
    .optional()
    .trim()
    .matches(NAME_REGEX).withMessage('First name must contain only letters, spaces, hyphens, and apostrophes (no numbers or special characters)')
    .isLength({ min: 2, max: 50 }).withMessage('First name must be between 2 and 50 characters long'),
  body('lastName')
    .optional()
    .trim()
    .matches(NAME_REGEX).withMessage('Last name must contain only letters, spaces, hyphens, and apostrophes (no numbers or special characters)')
    .isLength({ min: 2, max: 50 }).withMessage('Last name must be between 2 and 50 characters long'),
  body('name')
    .optional()
    .trim()
    .matches(NAME_REGEX).withMessage('Name must contain only letters, spaces, hyphens, and apostrophes (no numbers or special characters)')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters long'),
  body('phoneNumber')
    .optional({ checkFalsy: true })
    .trim()
    .matches(PHONE_REGEX).withMessage('Phone number must contain only numbers and optional leading +'),
  body('course')
    .optional({ checkFalsy: true })
    .trim()
    .matches(SAFE_TEXT_REGEX).withMessage('Course contains invalid characters'),
  body('yearLevel')
    .optional({ checkFalsy: true })
    .trim()
    .matches(SAFE_TEXT_REGEX).withMessage('Year level contains invalid characters'),
  body('email')
    .optional()
    .trim()
    .isEmail().withMessage('Must be a valid email address')
    .normalizeEmail()
];

const changePasswordValidation = [
  body('currentPassword')
    .notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6, max: 128 }).withMessage('New password must be between 6 and 128 characters long')
];

const resetPasswordValidation = [
  body('email')
    .trim()
    .isEmail().withMessage('Valid email address is required')
    .normalizeEmail(),
  body('otp')
    .trim()
    .notEmpty().withMessage('Verification OTP is required')
    .isLength({ min: 4, max: 8 }).withMessage('Invalid OTP code length')
    .isNumeric().withMessage('OTP must consist of digits only'),
  body('newPassword')
    .isLength({ min: 6, max: 128 }).withMessage('New password must be between 6 and 128 characters long')
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
    .trim()
    .notEmpty().withMessage('First name is required')
    .matches(NAME_REGEX).withMessage('First name must contain only letters, spaces, hyphens, and apostrophes (numbers and special characters are not allowed)')
    .isLength({ min: 2, max: 50 }).withMessage('First name must be between 2 and 50 characters long'),
  body('lastName')
    .trim()
    .notEmpty().withMessage('Last name is required')
    .matches(NAME_REGEX).withMessage('Last name must contain only letters, spaces, hyphens, and apostrophes (numbers and special characters are not allowed)')
    .isLength({ min: 2, max: 50 }).withMessage('Last name must be between 2 and 50 characters long'),
  body('name')
    .optional()
    .trim()
    .matches(NAME_REGEX).withMessage('Name must contain only letters, spaces, hyphens, and apostrophes')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters long'),
  body('department')
    .optional()
    .isIn(['Registrar', 'Accounting', 'IT Administration', 'Administration', 'IT'])
    .withMessage('Department must be one of: Registrar, Accounting, IT Administration, Administration, IT'),
  body('role')
    .optional()
    .isString().trim()
    .matches(/^[a-zA-Z\s]+$/).withMessage('Role can only contain letters and spaces')
];

const updateStaffValidation = [
  body('name')
    .optional()
    .trim()
    .matches(NAME_REGEX).withMessage('Name must contain only letters, spaces, hyphens, and apostrophes (no numbers or special characters)')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters long'),
  body('firstName')
    .optional()
    .trim()
    .matches(NAME_REGEX).withMessage('First name must contain only letters, spaces, hyphens, and apostrophes (no numbers or special characters)')
    .isLength({ min: 2, max: 50 }).withMessage('First name must be between 2 and 50 characters long'),
  body('lastName')
    .optional()
    .trim()
    .matches(NAME_REGEX).withMessage('Last name must contain only letters, spaces, hyphens, and apostrophes (no numbers or special characters)')
    .isLength({ min: 2, max: 50 }).withMessage('Last name must be between 2 and 50 characters long'),
  body('email')
    .optional()
    .trim()
    .isEmail().withMessage('Valid email address is required')
    .normalizeEmail(),
  body('status')
    .optional()
    .isIn(['Active', 'Inactive', 'Archived'])
    .withMessage('Status must be Active, Inactive, or Archived')
];

// ============================================================================
// Department Operations Validations
// ============================================================================

const createRequestValidation = [
  body('documentType')
    .trim()
    .notEmpty().withMessage('Document type is required')
    .matches(SAFE_TEXT_REGEX).withMessage('Document type contains invalid characters')
    .isLength({ min: 2, max: 100 }).withMessage('Document type must be between 2 and 100 characters'),
  body('subDocumentType')
    .optional({ checkFalsy: true })
    .trim()
    .matches(SAFE_TEXT_REGEX).withMessage('Sub-document type contains invalid characters')
    .isLength({ max: 100 }),
  body('purpose')
    .optional({ checkFalsy: true })
    .trim()
    .matches(SAFE_TEXT_REGEX).withMessage('Purpose contains invalid characters')
    .isLength({ max: 200 }),
  body('otherPurpose')
    .optional({ checkFalsy: true })
    .trim()
    .matches(SAFE_TEXT_REGEX).withMessage('Other purpose contains invalid characters')
    .isLength({ max: 200 }),
  body('studentId')
    .optional({ checkFalsy: true })
    .trim()
    .matches(SAFE_ID_REGEX).withMessage('Student ID can only contain letters, numbers, and dashes'),
  body('course')
    .optional({ checkFalsy: true })
    .trim()
    .matches(SAFE_TEXT_REGEX).withMessage('Course contains invalid characters'),
  body('yearLevel')
    .optional({ checkFalsy: true })
    .trim()
    .matches(SAFE_TEXT_REGEX).withMessage('Year level contains invalid characters'),
  body('quantity')
    .optional()
    .isInt({ min: 1, max: 20 }).withMessage('Quantity must be an integer between 1 and 20')
];

const requestStatusValidation = [
  body('status')
    .optional()
    .isIn(['Pending', 'In Process', 'Released', 'Rejected'])
    .withMessage('Invalid status. Allowed values: Pending, In Process, Released, Rejected'),
  body('rejectionReason')
    .optional({ checkFalsy: true })
    .trim()
    .matches(SAFE_TEXT_REGEX).withMessage('Rejection reason contains invalid characters'),
  body('estimatedProcessingStart')
    .optional({ checkFalsy: true })
    .isISO8601().withMessage('Estimated start date must be a valid ISO date'),
  body('estimatedProcessingEnd')
    .optional({ checkFalsy: true })
    .isISO8601().withMessage('Estimated completion date must be a valid ISO date')
];

const paymentStatusValidation = [
  body('status')
    .isIn(['Pending Verification', 'Completed', 'Needs Update', 'Rejected', 'Refunded'])
    .withMessage('Invalid payment status. Allowed values: Pending Verification, Completed, Needs Update, Rejected, Refunded'),
  body('adminRemarks')
    .optional({ checkFalsy: true })
    .trim()
    .matches(SAFE_TEXT_REGEX).withMessage('Remarks contain invalid characters')
];

const submitRefundValidation = [
  body('transactionId')
    .trim()
    .notEmpty().withMessage('Transaction ID is required')
    .matches(SAFE_ID_REGEX).withMessage('Invalid transaction ID format'),
  body('reason')
    .trim()
    .notEmpty().withMessage('Refund reason is required')
    .isIn(['Duplicate Payment', 'Wrong Amount', 'Service Not Rendered', 'Other'])
    .withMessage('Invalid refund reason category'),
  body('otherReason')
    .optional({ checkFalsy: true })
    .trim()
    .matches(SAFE_TEXT_REGEX).withMessage('Custom reason contains invalid characters')
    .isLength({ max: 300 }),
  body('studentName')
    .optional({ checkFalsy: true })
    .trim()
    .matches(NAME_REGEX).withMessage('Student name must contain only letters (no numbers or special characters)'),
  body('amount')
    .optional({ checkFalsy: true })
    .matches(AMOUNT_REGEX).withMessage('Amount must be a valid positive number with up to 2 decimal places')
];

const refundStatusValidation = [
  body('status')
    .isIn(['Pending', 'Approved', 'Rejected'])
    .withMessage('Invalid refund status. Allowed values: Pending, Approved, Rejected'),
  body('adminRemarks')
    .optional({ checkFalsy: true })
    .trim()
    .matches(SAFE_TEXT_REGEX).withMessage('Admin remarks contain invalid characters')
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
  createRequestValidation,
  requestStatusValidation,
  paymentStatusValidation,
  submitRefundValidation,
  refundStatusValidation,
  mongoIdParamValidation
};
