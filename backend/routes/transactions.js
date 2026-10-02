const express = require('express');
const router = express.Router();
const multer = require('multer');
const TransactionController = require('../controllers/transactionController');
const { auth, superAdminOnly, accountingOnly, canViewTransactions } = require('../middleware/authMiddleware');
const { validate, paymentStatusValidation, submitRefundValidation, refundStatusValidation } = require('../middleware/validationMiddleware');

// --- Multer Configuration for Receipt Uploads ---
const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/png', 'image/jpg', 'image/jpeg'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only PNG, JPG and JPEG image files are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }
});

// Middleware to accept either 'receiptImage' or 'receipt' as multipart field name
const receiptUpload = (req, res, next) => {
  upload.fields([
    { name: 'receiptImage', maxCount: 1 },
    { name: 'receipt', maxCount: 1 }
  ])(req, res, (err) => {
    if (err) return res.status(400).json({ success: false, message: err.message });
    if (req.files) {
      req.file = req.files.receiptImage?.[0] || req.files.receipt?.[0] || req.file;
    }
    next();
  });
};

// Get all transactions (Institutional staff)
router.get('/', auth, canViewTransactions, TransactionController.getAllTransactions);

// Get transactions for logged-in user
router.get('/my-transactions', auth, TransactionController.getMyTransactions);

// Get a receipt for a specific request
router.get('/receipt', auth, TransactionController.getReceipt);

// Accounting: Get all refund requests (defined before /:id) - Accounting department & Super Admin only
router.get('/refunds', auth, accountingOnly, TransactionController.getRefunds);

// Get a transaction by requestId (Authenticated staff/student check)
router.get('/by-request/:requestId', auth, TransactionController.getByRequestId);

// Get a single transaction by transactionId
router.get('/:id', auth, TransactionController.getTransactionById);

// Upload receipt and create a new transaction (supports 'receiptImage' and 'receipt' field names)
router.post('/upload-receipt', receiptUpload, TransactionController.uploadReceipt);

// Mobile/Payment alias for receipt upload
router.post('/receipt', receiptUpload, TransactionController.uploadReceipt);

// Create a new transaction (Logged)
router.post('/', auth, TransactionController.createTransaction);

// Accounting: Verify / Approve / Request Update on a receipt
router.put('/:id/verify', auth, accountingOnly, paymentStatusValidation, validate, TransactionController.verifyTransaction);

// Admin: Re-upload receipt
router.put('/:id/reupload', auth, receiptUpload, TransactionController.reuploadReceipt);

// Mobile/Student: Submit a refund request (Authenticated)
router.post('/refund-request', auth, submitRefundValidation, validate, TransactionController.submitRefundRequest);

// Accounting: Process (approve/reject) a refund request
router.put('/refunds/:id/process', auth, accountingOnly, refundStatusValidation, validate, TransactionController.processRefund);

// Bulk delete transactions (Super Admin only)
router.post('/bulk-delete', auth, superAdminOnly, TransactionController.bulkDeleteTransactions);

// Delete single transaction (Super Admin only)
router.delete('/:id', auth, superAdminOnly, TransactionController.deleteTransaction);

module.exports = router;
