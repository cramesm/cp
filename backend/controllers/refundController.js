const mongoose = require('mongoose');
const Refund = require('../models/Refund');
const Transaction = require('../models/Transaction');
const Request = require('../models/Request');
const ActivityLog = require('../models/ActivityLog');
const Notification = require('../models/Notification');

const RefundController = {
  // @desc    Get refunds (all for admin, own for students/alumni)
  getRefunds: async (req, res) => {
    try {
      let query = {};
      
      if (req.user.role === 'student' || req.user.role === 'alumni') {
        query = {
          $or: [
            { studentEmail: req.user.email },
            ...(req.user.id || req.user._id ? [{ userId: req.user.id || req.user._id }] : [])
          ]
        };
      }

      const refunds = await Refund.find(query).sort({ createdAt: -1 });
      res.json({ success: true, refunds });
    } catch (error) {
      console.error('Fetch refunds error:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  },

  // @desc    Create a new refund request
  createRefund: async (req, res) => {
    try {
      const { transactionId, reason, otherReason } = req.body;
      
      if (!transactionId || !reason) {
        return res.status(400).json({ success: false, message: 'Missing transactionId or reason' });
      }

      const transaction = await Transaction.findOne({ transactionId, payerEmail: req.user.email });
      if (!transaction) {
        return res.status(404).json({ success: false, message: 'Transaction not found or unauthorized' });
      }

      const refundId = 'REF-' + Date.now();
      const refund = await Refund.create({
        refundId,
        transactionId,
        requestId: transaction.requestId,
        userId: req.user.id || req.user._id || transaction.userId || null,
        studentName: req.user.name,
        studentEmail: req.user.email,
        amount: transaction.amount,
        reason,
        otherReason: otherReason || '',
        status: 'Pending'
      });

      await ActivityLog.create({
        userEmail: req.user.email,
        userName: req.user.name || 'User',
        action: 'Refund Request',
        type: 'Request',
        status: 'Successful',
        details: `Requested refund for transaction ${transactionId}`
      });

      try {
        await Notification.create({
          title: 'New Refund Request',
          message: `New refund request (${refundId}) submitted by ${req.user.name || req.user.email} for ₱${transaction.amount} — Awaiting review`,
          isRead: false,
          targetRole: 'admin',
          type: 'refund',
          link: '/payments?tab=refunds'
        });
      } catch (notifErr) {
        console.error('Failed to create refund notification:', notifErr);
      }

      res.status(201).json({ success: true, message: 'Refund requested successfully', refund });
    } catch (error) {
      console.error('Create refund error:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  },

  // @desc    Update refund status (Admin/Registrar only)
  updateRefundStatus: async (req, res) => {
    try {
      if (req.user.role === 'student' || req.user.role === 'alumni') {
        return res.status(403).json({ success: false, message: 'Unauthorized' });
      }

      const { status, adminRemarks } = req.body;
      
      const refund = await Refund.findByIdAndUpdate(
        req.params.id,
        {
          status,
          adminRemarks,
          processedBy: req.user.email,
          processedAt: new Date()
        },
        { new: true }
      );

      if (!refund) {
        return res.status(404).json({ success: false, message: 'Refund not found' });
      }

      if (status === 'Approved') {
        await Transaction.findOneAndUpdate(
          { transactionId: refund.transactionId },
          { status: 'Refunded', adminRemarks: 'Refund processed' }
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

      try {
        const statusTitle = status === 'Approved' ? 'Refund Approved' : 'Refund Rejected';
        const statusMessage = status === 'Approved'
          ? `Your refund request for ₱${refund.amount} has been approved!`
          : `Your refund request was rejected. ${adminRemarks ? 'Reason: ' + adminRemarks : ''}`;
        let targetEmail = refund.studentEmail || '';
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
          targetRole: 'student',
          type: 'refund',
          link: '/payments?tab=refunds'
        });
      } catch (nErr) {
        console.error('Failed to notify student of refund update:', nErr);
      }

      res.json({ success: true, message: 'Refund updated', refund });
    } catch (error) {
      console.error('Update refund error:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  },

  // @desc    Bulk delete refunds (Super Admin only)
  bulkDeleteRefunds: async (req, res) => {
    return res.status(403).json({ success: false, message: 'Refund deletion has been disabled.' });
  },

  // @desc    Delete single refund (Super Admin only)
  deleteRefund: async (req, res) => {
    return res.status(403).json({ success: false, message: 'Refund deletion has been disabled.' });
  }
};

module.exports = RefundController;
