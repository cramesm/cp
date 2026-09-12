const Refund = require('../models/Refund');
const Transaction = require('../models/Transaction');
const ActivityLog = require('../models/ActivityLog');
const Notification = require('../models/Notification');

const RefundController = {
  // @desc    Get refunds (all for admin, own for students/alumni)
  getRefunds: async (req, res) => {
    try {
      let query = {};
      
      if (req.user.role === 'student' || req.user.role === 'alumni') {
        query = { studentEmail: req.user.email };
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

      try {
        const statusMessage = status === 'Approved'
          ? `Your refund request for ₱${refund.amount} has been approved!`
          : `Your refund request was rejected. ${adminRemarks ? 'Reason: ' + adminRemarks : ''}`;
        await Notification.create({
          message: statusMessage,
          isRead: false,
          email: refund.studentEmail || '',
          targetRole: 'student',
          type: 'refund'
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
    try {
      const { refundIds } = req.body;
      if (!Array.isArray(refundIds) || refundIds.length === 0) {
        return res.status(400).json({ success: false, message: 'Please provide an array of refund IDs to delete.' });
      }

      const result = await Refund.deleteMany({
        $or: [
          { refundId: { $in: refundIds } },
          { _id: { $in: refundIds.filter(id => id && id.match(/^[0-9a-fA-F]{24}$/)) } }
        ]
      });

      await ActivityLog.create({
        userEmail: req.user.email,
        userName: req.user.name || 'Super Admin',
        action: 'Bulk Delete Refunds',
        type: 'Refund',
        status: 'Successful',
        details: `Bulk deleted ${result.deletedCount} refund record(s).`
      });

      res.json({ success: true, message: `Successfully deleted ${result.deletedCount} refund(s).`, deletedCount: result.deletedCount });
    } catch (error) {
      console.error('Error bulk deleting refunds:', error);
      res.status(500).json({ success: false, message: 'Failed to bulk delete refunds.', error: error.message });
    }
  },

  // @desc    Delete single refund (Super Admin only)
  deleteRefund: async (req, res) => {
    try {
      const { id } = req.params;
      const refund = await Refund.findOneAndDelete({
        $or: [
          { refundId: id },
          ...(id.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: id }] : [])
        ]
      });

      if (!refund) {
        return res.status(404).json({ success: false, message: 'Refund record not found.' });
      }

      await ActivityLog.create({
        userEmail: req.user.email,
        userName: req.user.name || 'Super Admin',
        action: 'Delete Refund',
        type: 'Refund',
        status: 'Successful',
        details: `Deleted refund record ${refund.refundId} for student ${refund.studentName || refund.studentEmail || 'User'}.`
      });

      res.json({ success: true, message: `Refund record ${refund.refundId} deleted successfully.` });
    } catch (error) {
      console.error('Error deleting refund:', error);
      res.status(500).json({ success: false, message: 'Failed to delete refund.', error: error.message });
    }
  }
};

module.exports = RefundController;
