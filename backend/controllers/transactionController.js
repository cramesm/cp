const Transaction = require('../models/Transaction');
const Request = require('../models/Request');
const ActivityLog = require('../models/ActivityLog');
const Notification = require('../models/Notification');
const Refund = require('../models/Refund');
const { uploadStream } = require('../utils/cloudinary');

const TransactionController = {
  // @desc    Get all transactions
  getAllTransactions: async (req, res) => {
    try {
      const transactions = await Transaction.find().sort({ date: 1 });
      res.json(transactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      res.status(500).json({ message: 'Error fetching transactions' });
    }
  },

  // @desc    Get transactions for authenticated user
  getMyTransactions: async (req, res) => {
    try {
      const transactions = await Transaction.find({ payerEmail: req.user.email }).sort({ date: -1 });
      res.json({ success: true, transactions });
    } catch (error) {
      console.error('Error fetching my-transactions:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  },

  // @desc    Get a receipt for a specific request
  getReceipt: async (req, res) => {
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
      console.error('Error fetching receipt:', error);
      res.status(500).json({ success: false, message: 'Error fetching receipt' });
    }
  },

  // @desc    Admin: Get all refund requests
  getRefunds: async (req, res) => {
    try {
      const query = {};
      if (req.query.status && req.query.status !== 'All') {
        query.status = req.query.status;
      }
      const refunds = await Refund.find(query).sort({ createdAt: -1 });
      res.json(refunds);
    } catch (error) {
      console.error('Error fetching refunds:', error);
      res.status(500).json({ message: 'Error fetching refund requests' });
    }
  },

  // @desc    Get transaction by requestId
  getByRequestId: async (req, res) => {
    try {
      const transaction = await Transaction.findOne({ requestId: req.params.requestId }).sort({ date: -1 });
      if (!transaction) return res.json(null);
      res.json(transaction);
    } catch (error) {
      console.error('Error fetching transaction by request:', error);
      res.status(500).json({ message: 'Error fetching transaction by request' });
    }
  },

  // @desc    Get single transaction by transactionId
  getTransactionById: async (req, res) => {
    try {
      const transaction = await Transaction.findOne({ transactionId: req.params.id });
      if (!transaction) return res.status(404).json({ message: 'Transaction not found' });
      res.json(transaction);
    } catch (error) {
      console.error('Error fetching transaction:', error);
      res.status(500).json({ message: 'Error fetching transaction' });
    }
  },

  // @desc    Upload receipt and create transaction
  uploadReceipt: async (req, res) => {
    try {
      const { requestId, name, documentType, paymentMode, amount, payerName, payerEmail, payerType } = req.body;

      const count = await Transaction.countDocuments();
      const transactionId = `TXN-${Date.now().toString(36).toUpperCase()}-${(count + 1).toString().padStart(4, '0')}`;

      let receiptImage = '';
      if (req.file) {
        const uploadResult = await uploadStream(req.file.buffer, 'receipts');
        receiptImage = uploadResult.secure_url;
      }

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
  },

  // @desc    Create a new transaction directly
  createTransaction: async (req, res) => {
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

      await ActivityLog.create({
        userEmail: req.user.email,
        userName: req.user.name || 'User',
        action: 'Blockchain Transaction',
        type: req.body.documentType || '------',
        status: 'Successful',
        details: `Submitted transaction to blockchain for Request: ${req.body.requestId || 'Unknown'}`
      });

      try {
        await Notification.create({
          message: `New payment receipt submitted for Request #${req.body.requestId || 'N/A'} (${req.body.documentType || 'Document'}) by ${req.body.payerName || req.user.name || 'Student'} — ₱${req.body.amount || '0.00'}`,
          isRead: false,
          targetRole: 'admin',
          type: 'payment',
          link: '/payments'
        });
      } catch (notifErr) {
        console.error('Failed to notify admin of new payment:', notifErr);
      }

      res.json(newTx);
    } catch (error) {
      console.error('Error recording transaction:', error);
      res.status(500).json({ message: 'Error recording transaction' });
    }
  },

  // @desc    Admin: Verify / Approve / Request Update on a receipt
  verifyTransaction: async (req, res) => {
    try {
      const { status, adminRemarks } = req.body;
      const allowedStatuses = ['Completed', 'Needs Update', 'Rejected', 'Pending Verification', 'Refunded'];
      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({ message: 'Invalid status. Allowed: Completed, Needs Update, Rejected, Pending Verification, Refunded' });
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

      if (status === 'Completed') {
        const updatedReq = await Request.findOneAndUpdate(
          { requestId: transaction.requestId },
          { status: 'In Process' },
          { new: true }
        );
        
        if (updatedReq) {
          await Notification.create({
            message: `Your request #${updatedReq.requestId} for ${updatedReq.documentType} is now In Process!`,
            isRead: false,
            email: updatedReq.email || '',
            targetRole: 'student',
            type: 'request'
          });
        }
      }

      if (status === 'Rejected') {
        const updatedReq = await Request.findOneAndUpdate(
          { requestId: transaction.requestId, status: 'Pending' },
          { status: 'Rejected', rejectionReason: 'Payment Issue' },
          { new: true }
        );

        if (updatedReq) {
          await Notification.create({
            message: `Your request #${updatedReq.requestId} for ${updatedReq.documentType} was rejected. Reason: Payment Issue`,
            isRead: false,
            email: updatedReq.email || '',
            targetRole: 'student',
            type: 'payment'
          });
        }
      }

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
  },

  // @desc    Re-upload receipt
  reuploadReceipt: async (req, res) => {
    try {
      const updateData = { status: 'Pending Verification', adminRemarks: '' };
      if (req.file) {
        const uploadResult = await uploadStream(req.file.buffer, 'receipts');
        updateData.receiptImage = uploadResult.secure_url;
      }

      const transaction = await Transaction.findOneAndUpdate(
        { transactionId: req.params.id },
        updateData,
        { new: true }
      );

      if (!transaction) return res.status(404).json({ message: 'Transaction not found' });
      res.json(transaction);
    } catch (error) {
      console.error('Error re-uploading receipt:', error);
      res.status(500).json({ message: 'Error re-uploading receipt' });
    }
  },

  // @desc    Mobile / Client: Submit a refund request
  submitRefundRequest: async (req, res) => {
    try {
      const { transactionId, requestId, studentName, studentEmail, amount, reason, otherReason } = req.body;

      if (!transactionId || !reason) {
        return res.status(400).json({ success: false, message: 'Transaction ID and reason are required' });
      }

      const transaction = await Transaction.findOne({ transactionId });
      if (!transaction) {
        return res.status(404).json({ success: false, message: 'Transaction not found' });
      }

      const existingRefund = await Refund.findOne({ transactionId, status: 'Pending' });
      if (existingRefund) {
        return res.status(400).json({ success: false, message: 'A pending refund request already exists for this transaction' });
      }

      const count = await Refund.countDocuments();
      const refundId = `RFD-${Date.now().toString(36).toUpperCase()}-${(count + 1).toString().padStart(4, '0')}`;

      const refund = await Refund.create({
        refundId,
        transactionId,
        requestId: requestId || transaction.requestId || '',
        studentName: studentName || transaction.payerName || transaction.name || 'Unknown',
        studentEmail: studentEmail || transaction.payerEmail || '',
        amount: amount || transaction.amount || '0.00',
        reason,
        otherReason: reason === 'Other' ? (otherReason || '') : ''
      });

      await Notification.create({
        message: `New refund request (${refundId}) received from ${refund.studentName} for ₱${refund.amount} — Awaiting review`,
        isRead: false,
        targetRole: 'admin',
        type: 'refund',
        link: '/payments?tab=refunds'
      });

      res.status(201).json({ success: true, message: 'Refund request submitted', refund });
    } catch (error) {
      console.error('Refund request error:', error);
      res.status(500).json({ success: false, message: 'Error submitting refund request', error: error.message });
    }
  },

  // @desc    Admin: Process (approve/reject) a refund request
  processRefund: async (req, res) => {
    try {
      const { status, adminRemarks } = req.body;
      if (!['Approved', 'Rejected', 'Pending'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status. Must be Approved, Rejected, or Pending.' });
      }

      const mongoose = require('mongoose');
      let query = { refundId: req.params.id };
      if (mongoose.Types.ObjectId.isValid(req.params.id)) {
        query = { $or: [{ refundId: req.params.id }, { _id: req.params.id }] };
      }

      const refund = await Refund.findOneAndUpdate(
        query,
        {
          status,
          adminRemarks: adminRemarks || '',
          processedBy: req.user.email || req.user.name || 'Admin',
          processedAt: new Date()
        },
        { new: true }
      );

      if (!refund) return res.status(404).json({ message: 'Refund request not found' });

      if (status === 'Approved') {
        await Transaction.findOneAndUpdate(
          { transactionId: refund.transactionId },
          { status: 'Refunded', adminRemarks: `Refund approved (${refund.refundId || refund._id}). ${adminRemarks || ''}`.trim() }
        );
      } else if (status === 'Pending') {
        await Transaction.findOneAndUpdate(
          { transactionId: refund.transactionId },
          { status: 'Completed', adminRemarks: `Refund reverted to pending. ${adminRemarks || ''}`.trim() }
        );
      }

      const statusMessage = status === 'Approved'
        ? `Your refund request for ₱${refund.amount} has been approved!`
        : `Your refund request was rejected. ${adminRemarks ? 'Reason: ' + adminRemarks : ''}`;

      await Notification.create({
        message: statusMessage,
        isRead: false,
        email: refund.email || refund.studentEmail || '',
        targetRole: 'student',
        type: 'refund'
      });

      await ActivityLog.create({
        userEmail: req.user.email,
        userName: req.user.name || 'Admin',
        action: `Refund ${status}`,
        type: 'Refund',
        status: 'Successful',
        details: `${status} refund ${refund.refundId} for transaction ${refund.transactionId}. Amount: ₱${refund.amount}. Remarks: ${adminRemarks || 'None'}`
      });

      res.json({ success: true, refund });
    } catch (error) {
      console.error('Process refund error:', error);
      res.status(500).json({ message: 'Error processing refund request' });
    }
  },

  // @desc    Bulk delete transactions (Super Admin only)
  bulkDeleteTransactions: async (req, res) => {
    return res.status(403).json({ success: false, message: 'Payment transaction deletion has been disabled.' });
  },

  // @desc    Delete single transaction (Super Admin only)
  deleteTransaction: async (req, res) => {
    return res.status(403).json({ success: false, message: 'Payment transaction deletion has been disabled.' });
  }
};

module.exports = TransactionController;
