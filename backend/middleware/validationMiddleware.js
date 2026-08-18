const { body, validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Input validation failed',
      errors: errors.array()
    });
  }
  next();
};

const registerValidation = [
  body('firstName')
    .trim()
    .isLength({ min: 3 }).withMessage('First name must be at least 3 characters long')
    .notEmpty().withMessage('First name is required'),
  body('lastName')
    .trim()
    .isLength({ min: 3 }).withMessage('Last name must be at least 3 characters long')
    .notEmpty().withMessage('Last name is required'),
  body('email')
    .trim()
    .isEmail().withMessage('Must be a valid email address')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  // Role might be required for some systems, we make it optional but string if provided
  body('role').optional().isString()
];

const loginValidation = [
  body('email')
    .trim()
    .isEmail().withMessage('Must be a valid email address')
    .normalizeEmail()
    .notEmpty().withMessage('Email is required'),
  body('password')
    .notEmpty().withMessage('Password is required')
];

const updateProfileValidation = [
  body('firstName').optional().trim().isLength({ min: 3 }).withMessage('First name must be at least 3 characters long'),
  body('lastName').optional().trim().isLength({ min: 3 }).withMessage('Last name must be at least 3 characters long'),
  body('email').optional().trim().isEmail().withMessage('Must be a valid email address').normalizeEmail(),
];

module.exports = {
  validate,
  registerValidation,
  loginValidation,
  updateProfileValidation
};
