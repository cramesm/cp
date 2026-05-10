const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const supabase = require('../supabaseClient');
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
    const { data: transactions, error } = await supabase
      .from('transactions').select('*').order('date', { ascending: false });
    if (error) throw error;
    res.json(transactions || []);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching transactions' });
  }
});

// Get a single transaction by transactionId
router.get('/:id', async (req, res) => {
  try {
    const { data: transaction, error } = await supabase
      .from('transactions').select('*').eq('transaction_id', req.params.id).single();
    if (error || !transaction) return res.status(404).json({ message: 'Transaction not found' });
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
    const { count } = await supabase.from('transactions').select('*', { count: 'exact', head: true });
    const transactionId = `TXN-${Date.now().toString(36).toUpperCase()}-${((count || 0) + 1).toString().padStart(4, '0')}`;

    const receiptImage = req.file ? `/uploads/receipts/${req.file.filename}` : '';

    const { data: newTx, error } = await supabase.from('transactions').insert({
      transaction_id: transactionId,
      request_id: requestId || 'N/A',
      name: name || payerName || 'Unknown',
      document_type: documentType || 'General',
      payment_mode: paymentMode || 'GCash',
      amount: amount || '0.00',
      receipt_image: receiptImage,
      payer_name: payerName || name || 'Unknown',
      payer_email: payerEmail || '',
      payer_type: payerType || 'Student',
      status: 'Pending Verification'
    }).select().single();

    if (error) throw error;
    res.status(201).json(newTx);
  } catch (error) {
    console.error('Receipt upload error:', error);
    res.status(500).json({ message: 'Error uploading receipt', error: error.message });
  }
});

// Create a new transaction (Legacy - Logged)
router.post('/', protect, async (req, res) => {
    try {
        const { data: newTx, error } = await supabase.from('transactions').insert({
          transaction_id: req.body.transactionId || 'TXN-' + Date.now(),
          request_id: req.body.requestId || 'N/A',
          name: req.body.name || 'Unknown',
          document_type: req.body.documentType || 'General',
          payment_mode: req.body.paymentMode || 'GCash',
          amount: req.body.amount || '0.00',
          receipt_image: req.body.receiptImage || '',
          payer_name: req.body.payerName || '',
          payer_email: req.body.payerEmail || '',
          payer_type: req.body.payerType || 'Student',
          admin_remarks: req.body.adminRemarks || '',
          status: req.body.status || 'Pending Verification',
        }).select().single();
        if (error) throw error;

        // Log activity
        await supabase.from('activity_logs').insert({
            user_email: req.user.email,
            user_name: req.user.name || 'User',
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

    const { data: transaction, error } = await supabase
      .from('transactions')
      .update({
        status,
        admin_remarks: adminRemarks || '',
        verified_by: req.user.email || req.user.name || 'Admin',
        verified_at: new Date().toISOString()
      })
      .eq('transaction_id', req.params.id)
      .select()
      .single();

    if (error || !transaction) return res.status(404).json({ message: 'Transaction not found' });

    // Log the verification activity
    await supabase.from('activity_logs').insert({
      user_email: req.user.email,
      user_name: req.user.name || 'Admin',
      action: `Payment ${status}`,
      type: transaction.document_type || '------',
      status: 'Successful',
      details: `${status} receipt for Transaction: ${transaction.transaction_id}. Remarks: ${adminRemarks || 'None'}`
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
    const updateData = { status: 'Pending Verification', admin_remarks: '' };
    if (req.file) {
      updateData.receipt_image = `/uploads/receipts/${req.file.filename}`;
    }

    const { data: transaction, error } = await supabase
      .from('transactions')
      .update(updateData)
      .eq('transaction_id', req.params.id)
      .select()
      .single();

    if (error || !transaction) return res.status(404).json({ message: 'Transaction not found' });
    res.json(transaction);
  } catch (error) {
    res.status(500).json({ message: 'Error re-uploading receipt' });
  }
});

module.exports = router;
