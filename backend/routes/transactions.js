const express = require('express');
const router = express.Router();
const multer = require('multer');
const TransactionController = require('../controllers/transactionController');
const { auth, superAdminOnly } = require('../middleware/authMiddleware');

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

// Get all transactions
router.get('/', TransactionController.getAllTransactions);

// Get transactions for logged-in user
router.get('/my-transactions', auth, TransactionController.getMyTransactions);

// Get a receipt for a specific request
router.get('/receipt', TransactionController.getReceipt);

// Admin: Get all refund requests (defined before /:id)
router.get('/refunds', auth, TransactionController.getRefunds);

// Get a transaction by requestId
router.get('/by-request/:requestId', TransactionController.getByRequestId);

// Get a single transaction by transactionId
router.get('/:id', TransactionController.getTransactionById);

// Upload receipt and create a new transaction
router.post('/upload-receipt', upload.single('receiptImage'), TransactionController.uploadReceipt);

// Create a new transaction (Logged)
router.post('/', auth, TransactionController.createTransaction);

// Admin: Verify / Approve / Request Update on a receipt
router.put('/:id/verify', auth, TransactionController.verifyTransaction);

// Admin: Re-upload receipt
router.put('/:id/reupload', upload.single('receiptImage'), TransactionController.reuploadReceipt);

// Mobile/Student: Submit a refund request
router.post('/refund-request', TransactionController.submitRefundRequest);

// Admin: Process (approve/reject) a refund request
router.put('/refunds/:id/process', auth, TransactionController.processRefund);

// Bulk delete transactions (Super Admin only)
router.post('/bulk-delete', auth, superAdminOnly, TransactionController.bulkDeleteTransactions);

// Delete single transaction (Super Admin only)
router.delete('/:id', auth, superAdminOnly, TransactionController.deleteTransaction);

module.exports = router;
