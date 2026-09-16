const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const Request = require('../models/Request');
const ActivityLog = require('../models/ActivityLog');
const Notification = require('../models/Notification');
const Refund = require('../models/Refund');
const { uploadStream } = require('../utils/cloudinary');
const getClientIp = require('../utils/getClientIp');

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
      const userClauses = [];
      if (req.user.email) {
        userClauses.push({ payerEmail: req.user.email });
        userClauses.push({ email: req.user.email });
      }
      if (req.user.id || req.user._id) {
        userClauses.push({ userId: req.user.id || req.user._id });
      }

      const transactions = await Transaction.find({
        $or: userClauses.length > 0 ? userClauses : [{ payerEmail: req.user.email }]
      }).sort({ date: -1, createdAt: -1 });

      res.json({ success: true, transactions });
    } catch (error) {
      console.error('Error fetching my-transactions:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  },

  // @desc    Get a receipt for a specific request
  getReceipt: async (req, res) => {
    try {
      const { docName, purpose, requestId } = req.query;

      const queryConditions = [];
      if (requestId) {
        queryConditions.push({ requestId: requestId });
      }
      if (docName && purpose) {
        queryConditions.push({ documentType: docName, requestId: purpose });
        queryConditions.push({ documentType: docName, purpose: purpose });
      }
      if (docName) {
        queryConditions.push({ documentType: docName });
      }

      let transaction = null;
      if (queryConditions.length > 0) {
        transaction = await Transaction.findOne({ $or: queryConditions }).sort({ date: -1, createdAt: -1 });
      }

      // Fallback: check receipts collection if mobile uploaded receipt there
      if (!transaction && mongoose.connection.readyState === 1) {
        const receiptConditions = [];
        if (requestId) {
          receiptConditions.push({ trueRequestId: requestId });
          receiptConditions.push({ requestId: requestId });
          if (mongoose.Types.ObjectId.isValid(requestId)) {
            receiptConditions.push({ _id: new mongoose.Types.ObjectId(requestId) });
          }
        }
        if (docName) {
          receiptConditions.push({ docName: docName });
        }
        if (receiptConditions.length > 0) {
          const rawReceipt = await mongoose.connection.db.collection('receipts')
            .findOne({ $or: receiptConditions }, { sort: { createdAt: -1 } });
          if (rawReceipt) {
            transaction = {
              _id: rawReceipt._id,
              transactionId: rawReceipt.paymentSubmissionId || `TXN-${rawReceipt._id}`,
              requestId: rawReceipt.trueRequestId || rawReceipt.requestId || requestId || 'N/A',
              documentType: rawReceipt.docName || docName || 'General',
              paymentMode: rawReceipt.paymentType || 'Receipt',
              amount: rawReceipt.amount || '0.00',
              receiptImage: rawReceipt.imageUrl || '',
              status: rawReceipt.status === 'verified' ? 'Completed' : 'Pending Verification',
              date: rawReceipt.createdAt || new Date(),
              createdAt: rawReceipt.createdAt || new Date()
            };
          }
        }
      }

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
      const targetRequestId = req.params.requestId;

      // Look up Request to discover all possible alias IDs (public requestId, MongoDB _id, paymentReceiptId)
      const linkedReq = await Request.findOne({
        $or: [
          { requestId: targetRequestId },
          ...(mongoose.Types.ObjectId.isValid(targetRequestId) ? [{ _id: targetRequestId }] : [])
        ]
      }).lean();

      const candidateIds = new Set([targetRequestId]);
      if (linkedReq) {
        if (linkedReq.requestId) candidateIds.add(linkedReq.requestId);
        if (linkedReq._id) candidateIds.add(String(linkedReq._id));
        if (linkedReq.paymentReceiptId) candidateIds.add(String(linkedReq.paymentReceiptId));
      }

      const idList = Array.from(candidateIds);
      const txQueryOr = [];
      idList.forEach(id => {
        txQueryOr.push({ requestId: id });
        if (mongoose.Types.ObjectId.isValid(id)) {
          txQueryOr.push({ _id: id });
        }
      });

      let transaction = await Transaction.findOne({ $or: txQueryOr }).sort({ date: -1, createdAt: -1 });

      // Fallback check in receipts collection
      if (!transaction && mongoose.connection.readyState === 1) {
        const receiptQueryOr = [];
        idList.forEach(id => {
          receiptQueryOr.push({ trueRequestId: id });
          receiptQueryOr.push({ requestId: id });
          receiptQueryOr.push({ paymentSubmissionId: id });
          if (mongoose.Types.ObjectId.isValid(id)) {
            receiptQueryOr.push({ _id: new mongoose.Types.ObjectId(id) });
          }
        });

        const rawReceipt = await mongoose.connection.db.collection('receipts')
          .findOne({ $or: receiptQueryOr }, { sort: { createdAt: -1 } });

        if (rawReceipt) {
          transaction = {
            _id: rawReceipt._id,
            transactionId: rawReceipt.paymentSubmissionId || `TXN-${rawReceipt._id}`,
            requestId: rawReceipt.trueRequestId || rawReceipt.requestId || targetRequestId,
            documentType: rawReceipt.docName || 'General',
            paymentMode: rawReceipt.paymentType || 'Receipt',
            amount: rawReceipt.amount || '0.00',
            receiptImage: rawReceipt.imageUrl || '',
            status: rawReceipt.status === 'verified' ? 'Completed' : 'Pending Verification',
            date: rawReceipt.createdAt || new Date(),
            createdAt: rawReceipt.createdAt || new Date()
          };
        }
      }

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
      const { requestId, name, documentType, docName, paymentMode, paymentType, amount, payerName, payerEmail, payerType, userId } = req.body;

      const count = await Transaction.countDocuments();
      const transactionId = `TXN-${Date.now().toString(36).toUpperCase()}-${(count + 1).toString().padStart(4, '0')}`;

      const uploadedFile = req.file || (req.files && (req.files.receipt?.[0] || req.files.receiptImage?.[0]));
      let receiptImage = '';
      if (uploadedFile) {
        const uploadResult = await uploadStream(uploadedFile.buffer, 'receipts');
        receiptImage = uploadResult.secure_url;
      }

      const effectiveDocType = documentType || docName || 'General';
      const effectivePaymentMode = paymentMode || paymentType || 'GCash';

      const newTx = await Transaction.create({
        transactionId,
        requestId: requestId || 'N/A',
        userId: userId || req.user?.id || req.user?._id || null,
        name: name || payerName || 'Unknown',
        documentType: effectiveDocType,
        paymentMode: effectivePaymentMode,
        amount: amount || '0.00',
        receiptImage,
        payerName: payerName || name || 'Unknown',
        payerEmail: payerEmail || '',
        payerType: payerType || 'Student',
        status: 'Pending Verification'
      });

      // Synchronize associated Request if available
      if (requestId && requestId !== 'N/A') {
        await Request.findOneAndUpdate(
          {
            $or: [
              { requestId },
              ...(mongoose.Types.ObjectId.isValid(requestId) ? [{ _id: requestId }] : [])
            ]
          },
          {
            status: 'Pending',
            mobileStatus: 'pending',
            paymentType: effectivePaymentMode
          }
        );
      }

      res.status(201).json({ success: true, ...newTx.toObject() });
    } catch (error) {
      console.error('Receipt upload error:', error);
      res.status(500).json({ success: false, message: 'Error uploading receipt', error: error.message });
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
        details: `Submitted transaction to blockchain for Request: ${req.body.requestId || 'Unknown'}`,
        ipAddress: getClientIp(req)
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
      const userRole = (req.user?.role || '').toLowerCase();
      const isStaffOrAdmin = ['super admin', 'registrar', 'registrar staff', 'admin', 'staff'].includes(userRole);
      if (!isStaffOrAdmin) {
        return res.status(403).json({ message: 'Only authorized staff and administrators can verify payment transactions.' });
      }

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

      // Resolve linked request and target student email/userId for notifications
      let targetEmail = transaction.payerEmail || '';
      let targetUserId = transaction.userId || undefined;
      let targetDocType = transaction.documentType || 'Document';

      const requestConditions = [];
      if (transaction.requestId && transaction.requestId !== 'N/A') {
        requestConditions.push({ requestId: transaction.requestId });
        if (mongoose.Types.ObjectId.isValid(transaction.requestId)) {
          requestConditions.push({ _id: transaction.requestId });
        }
      }
      if (transaction.transactionId) {
        requestConditions.push({ paymentReceiptId: transaction.transactionId });
      }
      if (transaction._id) {
        requestConditions.push({ paymentReceiptId: String(transaction._id) });
      }

      let linkedReq = null;
      if (requestConditions.length > 0) {
        linkedReq = await Request.findOne({ $or: requestConditions });
      }

      if (!linkedReq && transaction.payerEmail) {
        linkedReq = await Request.findOne({
          email: transaction.payerEmail,
          status: { $in: ['Pending', 'In Process'] }
        }).sort({ createdAt: -1 });
      }

      if (linkedReq) {
        targetEmail = targetEmail || linkedReq.email || '';
        targetUserId = targetUserId || linkedReq.userId || undefined;
        targetDocType = linkedReq.documentType || targetDocType;
        if (!targetEmail && linkedReq.studentId) {
          try {
            const Student = require('../models/Users/Student');
            const Alumni = require('../models/Users/Alumni');
            const st = await Student.findOne({ studentId: linkedReq.studentId }).lean() || await Alumni.findOne({ studentId: linkedReq.studentId }).lean();
            if (st) {
              targetEmail = st.email || '';
              targetUserId = targetUserId || st._id;
            }
          } catch (_e) {}
        }
      }

      if (!targetUserId && targetEmail) {
        try {
          const Student = require('../models/Users/Student');
          const Alumni = require('../models/Users/Alumni');
          const st = await Student.findOne({ email: targetEmail }).lean() || await Alumni.findOne({ email: targetEmail }).lean();
          if (st) targetUserId = st._id;
        } catch (_e) {}
      }

      if (status === 'Completed') {
        // Mark payment receipts as verified
        if (mongoose.connection.readyState === 1) {
          try {
            await mongoose.connection.db.collection('receipts').updateMany(
              {
                $or: [
                  { trueRequestId: transaction.requestId },
                  { requestId: transaction.requestId }
                ]
              },
              { $set: { status: 'verified', updatedAt: new Date().toISOString() } }
            );
          } catch (_e) {}
        }

        // Update linked request's mobileStatus while preserving status for document verification
        if (linkedReq) {
          const reqUpdate = {
            mobileStatus: 'payment_verified'
          };
          // If request was previously rejected, reset to Pending so admin can verify document request
          if (linkedReq.status === 'Rejected') {
            reqUpdate.status = 'Pending';
          }
          await Request.findByIdAndUpdate(linkedReq._id, reqUpdate);
        }
        
        try {
          await Notification.create({
            title: 'Payment Approved',
            message: `Your payment of ₱${transaction.amount} for Request #${transaction.requestId} (${targetDocType}) has been verified and approved.`,
            isRead: false,
            email: targetEmail,
            userId: targetUserId,
            studentId: linkedReq?.studentId || undefined,
            targetRole: 'student',
            type: 'payment',
            link: `/requests/${transaction.requestId}`
          });
        } catch (notifErr) {
          console.error('Failed to notify student of payment approval:', notifErr);
        }
      } else if (status === 'Needs Update') {
        if (linkedReq) {
          await Request.findByIdAndUpdate(linkedReq._id, {
            mobileStatus: 'needs_update'
          });
        }

        try {
          await Notification.create({
            title: 'Payment Receipt Needs Update',
            message: `Your payment receipt for Request #${transaction.requestId} needs update: ${adminRemarks || 'Please re-upload a clear copy of your payment receipt.'}`,
            isRead: false,
            email: targetEmail,
            userId: targetUserId,
            studentId: linkedReq?.studentId || undefined,
            targetRole: 'student',
            type: 'payment',
            link: `/requests/${transaction.requestId}`
          });
        } catch (notifErr) {
          console.error('Failed to notify student of payment update needed:', notifErr);
        }
      } else if (status === 'Rejected') {
        if (linkedReq) {
          // IMPORTANT: If request was In Process, immediately revert from In Process
          // so it is NEVER left as "Approved" when payment is rejected.
          // Mobile status is marked as payment_rejected.
          const reqUpdate = {
            mobileStatus: 'payment_rejected'
          };
          if (linkedReq.status === 'In Process') {
            reqUpdate.status = 'Pending';
          }
          if (adminRemarks) {
            reqUpdate.rejectionReason = `Payment Issue: ${adminRemarks}`;
          }
          await Request.findByIdAndUpdate(linkedReq._id, reqUpdate);
        }

        if (mongoose.connection.readyState === 1) {
          try {
            await mongoose.connection.db.collection('receipts').updateMany(
              {
                $or: [
                  { trueRequestId: transaction.requestId },
                  { requestId: transaction.requestId }
                ]
              },
              { $set: { status: 'rejected', updatedAt: new Date().toISOString() } }
            );
          } catch (_e) {}
        }

        try {
          await Notification.create({
            title: 'Payment Rejected',
            message: `Your payment for Request #${transaction.requestId} was rejected. ${adminRemarks ? 'Reason: ' + adminRemarks : 'Invalid or unverified receipt.'}`,
            isRead: false,
            email: targetEmail,
            userId: targetUserId,
            studentId: linkedReq?.studentId || undefined,
            targetRole: 'student',
            type: 'payment',
            link: `/requests/${transaction.requestId}`
          });
        } catch (notifErr) {
          console.error('Failed to notify student of payment rejection:', notifErr);
        }
      }

      await ActivityLog.create({
        userEmail: req.user.email,
        userName: req.user.name || 'Admin',
        action: `Payment ${status}`,
        type: transaction.documentType || '------',
        status: 'Successful',
        details: `${status} receipt for Transaction: ${transaction.transactionId}. Remarks: ${adminRemarks || 'None'}`,
        ipAddress: getClientIp(req)
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
        userId: req.body.userId || req.user?.id || req.user?._id || transaction.userId || null,
        studentName: studentName || transaction.payerName || transaction.name || 'Unknown',
        studentEmail: studentEmail || transaction.payerEmail || '',
        amount: amount || transaction.amount || '0.00',
        reason,
        otherReason: reason === 'Other' ? (otherReason || '') : ''
      });

      await Notification.create({
        title: 'New Refund Request',
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

      if (refund.requestId) {
        await Request.findOneAndUpdate(
          {
            $or: [
              { requestId: refund.requestId },
              ...(mongoose.Types.ObjectId.isValid(refund.requestId) ? [{ _id: refund.requestId }] : [])
            ]
          },
          { refundStatus: status.toLowerCase(), refundUpdatedAt: new Date() }
        );
      }

      const statusTitle = status === 'Approved' ? 'Refund Approved' : 'Refund Rejected';
      const statusMessage = status === 'Approved'
        ? `Your refund request for ₱${refund.amount} has been approved!`
        : `Your refund request was rejected. ${adminRemarks ? 'Reason: ' + adminRemarks : ''}`;

      let targetEmail = refund.email || refund.studentEmail || '';
      let targetUserId = refund.userId || undefined;
      if (!targetUserId && targetEmail) {
        try {
          const Student = require('../models/Users/Student');
          const Alumni = require('../models/Users/Alumni');
          const st = await Student.findOne({ email: targetEmail }).lean() || await Alumni.findOne({ email: targetEmail }).lean();
          if (st) targetUserId = st._id;
        } catch (_e) {}
      }

      await Notification.create({
        title: statusTitle,
        message: statusMessage,
        isRead: false,
        email: targetEmail,
        userId: targetUserId,
        studentId: refund.studentId || undefined,
        targetRole: 'student',
        type: 'refund',
        link: '/payments?tab=refunds'
      });

      await ActivityLog.create({
        userEmail: req.user.email,
        userName: req.user.name || 'Admin',
        action: `Refund ${status}`,
        type: 'Refund',
        status: 'Successful',
        details: `${status} refund ${refund.refundId} for transaction ${refund.transactionId}. Amount: ₱${refund.amount}. Remarks: ${adminRemarks || 'None'}`,
        ipAddress: getClientIp(req)
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
