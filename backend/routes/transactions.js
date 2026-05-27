const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Transaction = require('../models/Transaction');
const ActivityLog = require('../models/ActivityLog');
const { protect } = require('../middleware/authMiddleware');

// --- Multer Configuration for Receipt Uploads ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads', 'receipts'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `receipt-${uniqueSuffix}${ext}`);
  }
});

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
router.get('/', async (req, res) => {
  try {
    const transactions = await Transaction.find().sort({ date: 1 });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching transactions' });
  }
});

// Get a receipt for a specific request
router.get('/receipt', async (req, res) => {
  try {
    const { docName, purpose } = req.query;
    if (!docName || !purpose) {
      return res.status(400).json({ success: false, message: 'Missing parameters' });
    }

    const transaction = await Transaction.findOne({
      documentType: docName,
      requestId: purpose
    }).sort({ date: -1 });

    if (!transaction) {
      return res.json({ success: true, receipt: null });
    }

    res.json({ success: true, receipt: transaction });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching receipt' });
  }
});

// Get a single transaction by transactionId
router.get('/:id', async (req, res) => {
  try {
    const transaction = await Transaction.findOne({ transactionId: req.params.id });
    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });
    res.json(transaction);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching transaction' });
  }
});

// Upload receipt and create a new transaction
router.post('/upload-receipt', upload.single('receiptImage'), async (req, res) => {
  try {
    const { requestId, name, documentType, paymentMode, amount, payerName, payerEmail, payerType } = req.body;

    // Auto-generate transactionId
    const count = await Transaction.countDocuments();
    const transactionId = `TXN-${Date.now().toString(36).toUpperCase()}-${(count + 1).toString().padStart(4, '0')}`;

    const receiptImage = req.file ? `/uploads/receipts/${req.file.filename}` : '';

    const newTx = await Transaction.create({
      transactionId,
      requestId: requestId || 'N/A',
      name: name || payerName || 'Unknown',
      documentType: documentType || 'General',
      paymentMode: paymentMode || 'GCash',
      amount: amount || '0.00',
      receiptImage,
      payerName: payerName || name || 'Unknown',
      payerEmail: payerEmail || '',
      payerType: payerType || 'Student',
      status: 'Pending Verification'
    });

    res.status(201).json(newTx);
  } catch (error) {
    console.error('Receipt upload error:', error);
    res.status(500).json({ message: 'Error uploading receipt', error: error.message });
  }
});

// Create a new transaction (Legacy - Logged)
router.post('/', protect, async (req, res) => {
    try {
        const newTx = await Transaction.create({
          transactionId: req.body.transactionId || 'TXN-' + Date.now(),
          requestId: req.body.requestId || 'N/A',
          name: req.body.name || 'Unknown',
          documentType: req.body.documentType || 'General',
          paymentMode: req.body.paymentMode || 'GCash',
          amount: req.body.amount || '0.00',
          receiptImage: req.body.receiptImage || '',
          payerName: req.body.payerName || '',
          payerEmail: req.body.payerEmail || '',
          payerType: req.body.payerType || 'Student',
          adminRemarks: req.body.adminRemarks || '',
          status: req.body.status || 'Pending Verification',
        });

        // Log activity
        await ActivityLog.create({
            userEmail: req.user.email,
            userName: req.user.name || 'User',
            action: 'Blockchain Transaction',
            type: req.body.documentType || '------',
            status: 'Successful',
            details: `Submitted transaction to blockchain for Request: ${req.body.requestId || 'Unknown'}`
        });

        res.json(newTx);
    } catch (error) {
        res.status(500).json({ message: 'Error recording transaction' });
    }
});

// Admin: Verify / Approve / Request Update on a receipt
router.put('/:id/verify', protect, async (req, res) => {
  try {
    const { status, adminRemarks } = req.body;
    const allowedStatuses = ['Completed', 'Needs Update', 'Rejected'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Allowed: Completed, Needs Update, Rejected' });
    }

    const transaction = await Transaction.findOneAndUpdate(
      { transactionId: req.params.id },
      {
        status,
        adminRemarks: adminRemarks || '',
        verifiedBy: req.user.email || req.user.name || 'Admin',
        verifiedAt: new Date()
      },
      { new: true }
    );

    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });

    // Sync to Request Collection
    if (status === 'Completed') {
      const Request = require('../models/Request');
      await Request.findOneAndUpdate(
        { requestId: transaction.requestId },
        { status: 'In Process' }
      );
    }

    // Log the verification activity
    await ActivityLog.create({
      userEmail: req.user.email,
      userName: req.user.name || 'Admin',
      action: `Payment ${status}`,
      type: transaction.documentType || '------',
      status: 'Successful',
      details: `${status} receipt for Transaction: ${transaction.transactionId}. Remarks: ${adminRemarks || 'None'}`
    });

    res.json(transaction);
  } catch (error) {
    console.error('Verify error:', error);
    res.status(500).json({ message: 'Error verifying transaction' });
  }
});

// Admin: Re-upload receipt
router.put('/:id/reupload', upload.single('receiptImage'), async (req, res) => {
  try {
    const updateData = { status: 'Pending Verification', adminRemarks: '' };
    if (req.file) {
      updateData.receiptImage = `/uploads/receipts/${req.file.filename}`;
    }

    const transaction = await Transaction.findOneAndUpdate(
      { transactionId: req.params.id },
      updateData,
      { new: true }
    );

    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });
    res.json(transaction);
  } catch (error) {
    res.status(500).json({ message: 'Error re-uploading receipt' });
  }
});

module.exports = router;
